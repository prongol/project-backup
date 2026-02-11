import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, createConnectEscrowPayment } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get user from Supabase auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, contractId, freelancerId } = await request.json();

    if (!amount || !contractId || !freelancerId) {
      return NextResponse.json(
        { error: 'Amount, contract ID, and freelancer ID are required' },
        { status: 400 }
      );
    }

    // Get client record for current user
    const { data: clientRecord, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('profile_id', user.id)
      .single();

    if (clientError || !clientRecord) {
      console.error('Client record not found for user:', user.id);
      return NextResponse.json(
        { error: 'Client profile not found. Please complete your profile.' },
        { status: 404 }
      );
    }

    // Verify contract explicitly
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      console.error('Contract not found:', { contractError, contractId });
      return NextResponse.json(
        { error: 'Contract not found', message: 'Contract not found' },
        { status: 404 }
      );
    }

    // Verify ownership in JS to be safe with ID types
    if (contract.client_id !== clientRecord.id) {
      console.error('Unauthorized client:', { contractClientId: contract.client_id, userClientId: clientRecord.id });
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You are not the client for this contract' },
        { status: 403 }
      );
    }

    if (contract.freelancer_id !== freelancerId) {
      console.error('Freelancer ID mismatch:', { contractFreelancerId: contract.freelancer_id, passedFreelancerId: freelancerId });
      return NextResponse.json(
        { error: 'Invalid freelancer', message: 'Freelancer ID mismatch' },
        { status: 400 }
      );
    }

    // Now get the stripe details
    const { data: clientData } = await supabase
      .from('clients')
      .select('stripe_customer_id')
      .eq('id', contract.client_id)
      .single();

    const { data: freelancerData } = await supabase
      .from('freelancers')
      .select('stripe_account_id')
      .eq('id', contract.freelancer_id)
      .single();

    // Get or Create Stripe Customer first
    let customerId = clientData?.stripe_customer_id;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: {
          userId: user.id,
          userType: 'client'
        }
      });

      customerId = customer.id;

      // Update user record with customer ID
      await supabase
        .from('clients')
        .update({ stripe_customer_id: customerId })
        .eq('profile_id', user.id);
    }

    // Unified logic to create Payment Intent with fallback
    try {
      if (!freelancerData?.stripe_account_id) {
        throw new Error('NO_CONNECT_ACCOUNT');
      }

      // Try proper Connect escrow first
      const paymentIntent = await createConnectEscrowPayment(
        amount,
        freelancerData.stripe_account_id,
        contractId,
        user.id
      );

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });

    } catch (paymentError: any) {
      // Check if it's a specific Stripe capability error or missing account
      const isCapabilityError = paymentError.message?.includes('feature enabled') || 
                               paymentError.message?.includes('capability') ||
                               paymentError.message?.includes('requirements');
      
      const isNoAccount = paymentError.message === 'NO_CONNECT_ACCOUNT';

      if (isNoAccount || isCapabilityError) {
        console.warn(`Falling back to platform escrow: ${paymentError.message}`);
        
        // Fall back to platform-held escrow
        const fallbackIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100),
          currency: 'usd',
          customer: customerId,
          capture_method: 'manual',
          automatic_payment_methods: {
            enabled: true,
          },
          metadata: {
            clientId: user.id,
            contractId,
            freelancerId,
            type: 'platform_escrow_fallback',
            fallbackReason: isNoAccount ? 'missing_account' : 'restricted_account'
          },
          description: `Escrow payment (held by platform) for contract ${contractId}`,
        });

        return NextResponse.json({
          clientSecret: fallbackIntent.client_secret,
          paymentIntentId: fallbackIntent.id,
          isPlatformEscrow: true,
          message: isNoAccount 
            ? 'Freelancer has not set up Stripe. Payment will be held by platform.' 
            : 'Freelancer account restricted. Payment will be held by platform.'
        });
      }

      // If it's some other error, rethrow it to the main catch block
      throw paymentError;
    }

  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to create payment intent',
        message: error.message || 'Failed to create payment intent'
      },
      { status: 500 }
    );
  }
}