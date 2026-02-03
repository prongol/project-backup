import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount } = await request.json();

    if (!amount || amount < 50) {
      return NextResponse.json(
        { error: 'Minimum withdrawal amount is $50' },
        { status: 400 }
      );
    }

    // Get freelancer's Stripe account
    const { data: freelancer } = await supabase
      .from('freelancers')
      .select('stripe_account_id')
      .eq('profile_id', user.id)
      .single();

    if (!freelancer?.stripe_account_id) {
      return NextResponse.json(
        { error: 'Stripe account not connected' },
        { status: 400 }
      );
    }

    // Check account balance
    const balance = await stripe.balance.retrieve({
      stripeAccount: freelancer.stripe_account_id,
    });

    const availableAmount = balance.available.reduce((sum, b) => sum + b.amount, 0);

    if (availableAmount < amount * 100) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Create payout
    const payout = await stripe.payouts.create(
      {
        amount: amount * 100, // Convert to cents
        currency: 'usd',
        description: `Withdrawal by ${user.email}`,
        metadata: {
          user_id: user.id,
        },
      },
      {
        stripeAccount: freelancer.stripe_account_id,
      }
    );

    return NextResponse.json({
      success: true,
      payoutId: payout.id,
      amount: payout.amount / 100,
      estimatedArrival: payout.arrival_date,
    });

  } catch (error: any) {
    console.error('Error creating payout:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process withdrawal' },
      { status: 500 }
    );
  }
}