import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get user's Stripe account ID
    const { data: freelancer } = await supabase
      .from('freelancers')
      .select('stripe_account_id')
      .eq('profile_id', user.id)
      .single();

    if (!freelancer?.stripe_account_id) {
      return NextResponse.json({ transactions: [] });
    }

    // Fetch transactions from Stripe
    const [charges, payouts, transfers] = await Promise.all([
      // Incoming payments
      stripe.charges.list(
        {
          limit: limit,
        },
        {
          stripeAccount: freelancer.stripe_account_id,
        }
      ),
      // Payouts to bank
      stripe.payouts.list(
        {
          limit: limit,
        },
        {
          stripeAccount: freelancer.stripe_account_id,
        }
      ),
      // Transfers received
      stripe.transfers.list({
        destination: freelancer.stripe_account_id,
        limit: limit,
      }),
    ]);

    // Combine and format transactions
    const transactions = [
      ...charges.data.map((charge) => ({
        id: charge.id,
        type: 'payment_received',
        amount: charge.amount / 100,
        currency: charge.currency,
        description: charge.description || 'Payment received',
        date: new Date(charge.created * 1000).toISOString(),
        status: charge.status === 'succeeded' ? 'completed' : charge.status,
        metadata: charge.metadata,
      })),
      ...payouts.data.map((payout) => ({
        id: payout.id,
        type: 'withdrawal',
        amount: payout.amount / 100,
        currency: payout.currency,
        description: payout.description || 'Withdrawal to bank',
        date: new Date(payout.created * 1000).toISOString(),
        status: payout.status === 'paid' ? 'completed' : payout.status,
        arrivalDate: payout.arrival_date ? new Date(payout.arrival_date * 1000).toISOString() : null,
      })),
      ...transfers.data.map((transfer) => ({
        id: transfer.id,
        type: 'transfer_received',
        amount: transfer.amount / 100,
        currency: transfer.currency,
        description: transfer.description || 'Transfer received',
        date: new Date(transfer.created * 1000).toISOString(),
        status: 'completed',
        metadata: transfer.metadata,
      })),
    ];

    // Sort by date (newest first)
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      transactions: transactions.slice(0, limit),
    });

  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}