import { NextRequest, NextResponse } from 'next/server';
import { 
  stripe,
  createConnectEscrowPayment,
  releaseEscrowPayment,
  refundEscrowPayment,
  createStripeCustomerForClient
} from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// POST /api/stripe/escrow - Create or update escrow payment record
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient(); // Use admin client for RLS-protected tables
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { contractId, amount, paymentMethodId, paymentIntentId } = await req.json();

    // Get contract details
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select(`
        id, client_id, freelancer_id, total_amount,
        freelancers!inner(id, stripe_account_id),
        clients!inner(id, profile_id, stripe_customer_id)
      `)
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Verify user is the client
    if (contract.clients[0]?.profile_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - you are not the client for this contract' },
        { status: 403 }
      );
    }

    let paymentIntent;

    if (paymentIntentId) {
      // If we already have a payment intent ID from the frontend (Stripe Elements check-out)
      // Retrieve it and verify status
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'requires_capture' && paymentIntent.status !== 'succeeded') {
        return NextResponse.json(
          { error: `Payment intent is in invalid status: ${paymentIntent.status}` },
          { status: 400 }
        );
      }
    } else {
      // Check if freelancer has completed Connect setup
      if (!contract.freelancers[0]?.stripe_account_id) {
        return NextResponse.json(
          { error: 'Freelancer has not completed payment setup. Please ask them to complete their payment information first.' },
          { status: 400 }
        );
      }

      // Create/get Stripe customer for client if not exists
      let customerId = contract.clients[0]?.stripe_customer_id;
      if (!customerId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', user.id)
          .single();

        const customer = await createStripeCustomerForClient(
          profile!.email,
          profile!.full_name,
          user.id
        );

        customerId = customer.id;

        // Save customer ID
        await supabase
          .from('clients')
          .update({ stripe_customer_id: customerId })
          .eq('profile_id', user.id);
      }

      // Create escrow payment intent (original flow) with fallback support
      try {
        paymentIntent = await createConnectEscrowPayment(
          amount,
          contract.freelancers[0]?.stripe_account_id,
          contractId,
          user.id,
          paymentMethodId && paymentMethodId !== 'pm_placeholder' ? paymentMethodId : undefined
        );
      } catch (paymentError: any) {
        // Fallback if freelancer account is restricted or missing transfers capability
        if (paymentError.message?.includes('feature enabled') || 
            paymentError.message?.includes('capability') ||
            paymentError.message?.includes('requirements')) {
          
          console.warn('Freelancer account restricted, falling back to platform-held escrow');
          
          paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: 'usd',
            customer: customerId,
            capture_method: 'manual',
            automatic_payment_methods: {
              enabled: true,
            },
            payment_method: paymentMethodId && paymentMethodId !== 'pm_placeholder' ? paymentMethodId : undefined,
            confirm: paymentMethodId && paymentMethodId !== 'pm_placeholder',
            metadata: {
              clientId: user.id,
              contractId,
              type: 'platform_escrow_fallback',
              originalError: paymentError.message.substring(0, 50)
            },
            description: `Escrow payment (held by platform) for contract ${contractId}`,
          });
        } else {
          throw paymentError;
        }
      }
    }

    // Determine status based on stripe payment intent status
    const escrowStatus = paymentIntent.status === 'requires_capture' || paymentIntent.status === 'succeeded' 
      ? 'held' 
      : 'pending_payment';

    // Create/update escrow account (use admin client to bypass RLS)
    const { data: escrowAccount, error: escrowError } = await adminSupabase
      .from('escrow_accounts')
      .upsert({
        contract_id: contractId,
        total_amount: amount,
        stripe_payment_intent_id: paymentIntent.id,
        status: escrowStatus,
        held_amount: paymentIntent.status === 'requires_capture' ? amount : 0
      })
      .select()
      .single();

    if (escrowError) {
      console.error('Escrow creation error:', escrowError);
      return NextResponse.json(
        { error: 'Failed to create escrow account', message: escrowError.message },
        { status: 500 }
      );
    }

    // Create transaction record (use admin client to bypass RLS)
    const { error: transactionError } = await adminSupabase
      .from('transactions')
      .insert({
        contract_id: contractId,
        from_user_id: user.id,
        to_user_id: contract.freelancer_id,
        amount: amount,
        type: 'escrow_deposit',
        status: paymentIntent.status === 'requires_capture' || paymentIntent.status === 'succeeded' ? 'completed' : 'pending',
        stripe_payment_intent_id: paymentIntent.id,
        escrow_account_id: escrowAccount.id
      });

    if (transactionError) {
      console.error('Transaction creation error:', transactionError);
      return NextResponse.json(
        { error: 'Failed to create transaction record', message: transactionError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      paymentId: paymentIntent.id,
      paymentIntentPatch: {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        status: paymentIntent.status
      },
      escrowAccount,
      platformFee: (amount * 7) / 100,
      freelancerWillReceive: amount - (amount * 7) / 100
    });

  } catch (error: any) {
    console.error('Escrow creation error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to create escrow payment',
        message: error.message || 'Failed to create escrow payment'
      },
      { status: 500 }
    );
  }
}

// PUT /api/stripe/escrow - Release or refund escrow payment
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { paymentIntentId, action, contractId } = await req.json();

    if (action === 'release') {
      // Release payment to freelancer
      const paymentIntent = await releaseEscrowPayment(paymentIntentId);

      // Update escrow account (use admin client)
      await adminSupabase
        .from('escrow_accounts')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_payment_intent_id', paymentIntentId);

      // Update transaction (use admin client)
      await adminSupabase
        .from('transactions')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_payment_intent_id', paymentIntentId);

      // Update contract
      await supabase
        .from('contracts')
        .update({
          payment_hold_released: true,
          payment_release_method: 'manual',
          payment_released_at: new Date().toISOString()
        })
        .eq('id', contractId);

      return NextResponse.json({
        success: true,
        message: 'Payment released to freelancer successfully',
        paymentIntent
      });

    } else if (action === 'refund') {
      // Refund payment to client
      const result = await refundEscrowPayment(paymentIntentId);

      // Update escrow account (use admin client)
      await adminSupabase
        .from('escrow_accounts')
        .update({
          status: 'refunded',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_payment_intent_id', paymentIntentId);

      // Update transaction (use admin client)
      await adminSupabase
        .from('transactions')
        .update({
          status: 'refunded',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_payment_intent_id', paymentIntentId);

      return NextResponse.json({
        success: true,
        message: 'Payment refunded successfully',
        result
      });
    }

  } catch (error: any) {
    console.error('Escrow action error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process escrow action' },
      { status: 500 }
    );
  }
}

// GET /api/stripe/escrow - Get escrow status
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const contractId = url.searchParams.get('contractId');

    if (!contractId) {
      return NextResponse.json(
        { error: 'Contract ID required' },
        { status: 400 }
      );
    }

    // Get escrow account details
    const { data: escrowAccount, error } = await supabase
      .from('escrow_accounts')
      .select(`
        *,
        contracts!inner(id, client_id, freelancer_id, status),
        transactions(*)
      `)
      .eq('contract_id', contractId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Escrow account not found' },
        { status: 404 }
      );
    }

    // Verify user has access
    const contract = escrowAccount.contracts;
    if (contract.client_id !== user.id && contract.freelancer_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      escrowAccount
    });

  } catch (error: any) {
    console.error('Escrow status error:', error);
    return NextResponse.json(
      { error: 'Failed to get escrow status' },
      { status: 500 }
    );
  }
}