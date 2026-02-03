import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

// Initialize Stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-11-17.clover',
  typescript: true,
});

// Platform fee percentage (7%)
export const PLATFORM_FEE_PERCENTAGE = 7;

// Calculate platform fee
export function calculatePlatformFee(amount: number): number {
  return Math.round((amount * PLATFORM_FEE_PERCENTAGE) / 100);
}

// Calculate freelancer payout (total - platform fee)
export function calculateFreelancerPayout(amount: number): number {
  return amount - calculatePlatformFee(amount);
}

// Create Payment Intent for escrow deposit
export async function createEscrowPaymentIntent(
  amount: number,
  clientId: string,
  contractId: string,
  metadata?: Record<string, string>
) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: 'usd',
    automatic_payment_methods: {
      enabled: true,
    },
    metadata: {
      clientId,
      contractId,
      type: 'escrow_deposit',
      ...metadata,
    },
    description: `Escrow deposit for contract ${contractId}`,
  });

  return paymentIntent;
}

// Create Payment Intent for milestone
export async function createMilestonePaymentIntent(
  amount: number,
  milestoneId: string,
  contractId: string,
  metadata?: Record<string, string>
) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: 'usd',
    automatic_payment_methods: {
      enabled: true,
    },
    metadata: {
      milestoneId,
      contractId,
      type: 'milestone_payment',
      ...metadata,
    },
    description: `Payment for milestone ${milestoneId}`,
  });

  return paymentIntent;
}

// Release payment to freelancer
export async function releaseMilestonePayment(
  freelancerStripeAccountId: string,
  amount: number,
  milestoneId: string
) {
  const platformFee = calculatePlatformFee(amount);
  const freelancerAmount = amount - platformFee;

  const transfer = await stripe.transfers.create({
    amount: Math.round(freelancerAmount * 100),
    currency: 'usd',
    destination: freelancerStripeAccountId,
    metadata: {
      milestoneId,
      type: 'milestone_payout',
      platformFee: platformFee.toString(),
    },
  });

  return transfer;
}

// Create customer
export async function createStripeCustomer(
  email: string,
  name: string,
  userId: string
) {
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      userId,
    },
  });

  return customer;
}

// Attach payment method to customer
export async function attachPaymentMethod(
  paymentMethodId: string,
  customerId: string
) {
  await stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId,
  });

  // Set as default payment method
  await stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });
}

// Create Connect account for freelancer payouts
export async function createConnectAccount(
  email: string,
  freelancerId: string,
  country: string = 'US'
) {
  const account = await stripe.accounts.create({
    type: 'express',
    email,
    country,
    metadata: {
      freelancerId,
      platform: 'neplancer',
    },
    capabilities: {
      transfers: { requested: true },
      card_payments: { requested: true },
    },
    business_type: 'individual',
    settings: {
      payouts: {
        schedule: {
          interval: 'manual', // Let freelancers control when they get paid
        },
      },
    },
  });

  return account;
}

// Create account link for Connect onboarding
export async function createAccountLink(
  accountId: string,
  returnUrl: string,
  refreshUrl: string,
  type: 'account_onboarding' | 'account_update' = 'account_onboarding'
) {
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type,
    collect: 'eventually_due',
  });

  return accountLink;
}

// Get Connect account status
export async function getConnectAccountStatus(accountId: string) {
  const account = await stripe.accounts.retrieve(accountId);
  
  return {
    id: account.id,
    charges_enabled: account.charges_enabled,
    payouts_enabled: account.payouts_enabled,
    details_submitted: account.details_submitted,
    requirements: {
      currently_due: account.requirements?.currently_due || [],
      eventually_due: account.requirements?.eventually_due || [],
      past_due: account.requirements?.past_due || [],
      pending_verification: account.requirements?.pending_verification || [],
    },
    capabilities: account.capabilities,
  };
}

// Create escrow payment with Connect (proper escrow)
export async function createConnectEscrowPayment(
  amount: number,
  connectAccountId: string,
  contractId: string,
  clientId: string,
  metadata?: Record<string, string>
) {
  const platformFeeAmount = Math.round((amount * PLATFORM_FEE_PERCENTAGE) / 100 * 100); // In cents

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: 'usd',
    application_fee_amount: platformFeeAmount,
    on_behalf_of: connectAccountId, // Money goes to Connect account
    capture_method: 'manual', // Hold funds in escrow until manual capture
    automatic_payment_methods: {
      enabled: true,
    },
    metadata: {
      clientId,
      contractId,
      connectAccountId,
      type: 'contract_escrow',
      platformFeePercentage: PLATFORM_FEE_PERCENTAGE.toString(),
      ...metadata,
    },
    description: `Escrow payment for contract ${contractId}`,
  });

  return paymentIntent;
}

// Release escrow payment (capture funds and transfer to freelancer)
export async function releaseEscrowPayment(paymentIntentId: string) {
  // Capture the held payment intent
  const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
  return paymentIntent;
}

// Refund escrow payment
export async function refundEscrowPayment(
  paymentIntentId: string,
  amount?: number,
  reason: string = 'requested_by_customer'
) {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  
  if (paymentIntent.status === 'requires_capture') {
    // If payment is still held, cancel it
    const cancelled = await stripe.paymentIntents.cancel(paymentIntentId);
    return { type: 'cancelled', data: cancelled };
  } else if (paymentIntent.status === 'succeeded') {
    // If payment was captured, refund it
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
      reason: reason as any,
    });
    return { type: 'refunded', data: refund };
  } else {
    throw new Error(`Cannot refund payment in status: ${paymentIntent.status}`);
  }
}

// Create customer for client payments
export async function createStripeCustomerForClient(
  email: string,
  name: string,
  clientId: string
) {
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      clientId,
      type: 'client',
    },
  });

  return customer;
}

// Create payment method for customer
export async function createPaymentMethod(
  customerId: string,
  paymentMethodId: string
) {
  await stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId,
  });

  // Set as default payment method
  await stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });
}

// Get payment methods for customer
export async function getCustomerPaymentMethods(customerId: string) {
  return await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
  });
}

// Create Express Dashboard login link
export async function createExpressDashboardLink(connectAccountId: string) {
  const link = await stripe.accounts.createLoginLink(connectAccountId);
  return link;
}

// Refund payment
export async function refundPayment(
  paymentIntentId: string,
  amount?: number,
  reason?: string
) {
  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: amount ? Math.round(amount * 100) : undefined,
    reason: reason as Stripe.RefundCreateParams.Reason,
  });

  return refund;
}

// Get payment method details
export async function getPaymentMethod(paymentMethodId: string) {
  return await stripe.paymentMethods.retrieve(paymentMethodId);
}

// List customer payment methods
export async function listCustomerPaymentMethods(customerId: string) {
  return await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
  });
}

// Verify webhook signature
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, secret);
}
