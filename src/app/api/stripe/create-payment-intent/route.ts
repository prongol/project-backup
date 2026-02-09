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

    // Verify contract ownership
    const { data: contractData, error: contractError } = await supabase
      .from('contracts')
      .select(`
        id, client_id, freelancer_id,
        clients!inner(profile_id, stripe_customer_id),
        freelancers!inner(profile_id, stripe_connect_account_id)
      `)
      .eq('id', contractId)
      .eq('client_id', user.id)
      .eq('freelancer_id', freelancerId)
      .single();

    if (contractError || !contractData) {
      return NextResponse.json(
        { error: 'Contract not found or unauthorized' },
        { status: 404 }
      );
    }

    // Get or create Stripe customer
    let customerId = contractData.clients?.[0]?.stripe_customer_id;

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

    // Create proper escrow payment intent using the library function
    const paymentIntent = await createConnectEscrowPayment(
      amount,
      contractData.freelancers?.[0]?.stripe_connect_account_id || '',
      contractId,
      user.id
    );

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}