import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

// GET /api/cron/auto-release - Auto-release payments that have passed their timer
// This should be called by a cron job (e.g., Vercel Cron, GitHub Actions, etc.)
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const now = new Date().toISOString();

    // Find contracts ready for auto-release
    const { data: contracts, error: contractsError } = await supabase
      .from('contracts')
      .select(`
        *,
        freelancer:freelancer_id (
          id,
          stripe_account_id,
          profile_id
        )
      `)
      .eq('status', 'approved')
      .in('payment_status', ['held', 'approved'])
      .lte('auto_release_at', now)
      .not('auto_release_at', 'is', null);

    if (contractsError) {
      console.error('Error fetching contracts:', contractsError);
      return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 });
    }

    const released: string[] = [];
    const failed: { id: string; error: string }[] = [];

    // Process each contract
    for (const contract of contracts || []) {
      try {
        // Capture payment from escrow
        const paymentIntent = await stripe.paymentIntents.capture(
          contract.stripe_payment_intent_id
        );

        // Transfer to freelancer
        if (contract.freelancer.stripe_account_id) {
          await stripe.transfers.create({
            amount: Math.round(contract.freelancer_amount * 100),
            currency: 'usd',
            destination: contract.freelancer.stripe_account_id,
            transfer_group: `contract_${contract.id}`,
            metadata: {
              contract_id: contract.id,
              auto_released: 'true',
            },
          });
        }

        // Update contract
        await supabase
          .from('contracts')
          .update({
            payment_status: 'released',
            status: 'completed',
            released_at: new Date().toISOString(),
          })
          .eq('id', contract.id);

        // Notify freelancer
        await supabase
          .from('notifications')
          .insert({
            user_id: contract.freelancer.profile_id,
            type: 'payment_released',
            title: '💰 Payment Released',
            message: `$${contract.freelancer_amount.toFixed(2)} has been released to your account for "${contract.title}".`,
            action_url: `/contracts/${contract.id}`,
          });

        released.push(contract.id);
      } catch (error: any) {
        console.error(`Error releasing payment for contract ${contract.id}:`, error);
        failed.push({ id: contract.id, error: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      released_count: released.length,
      failed_count: failed.length,
      released,
      failed,
    });

  } catch (error: any) {
    console.error('Auto-release cron error:', error);
    return NextResponse.json(
      { error: error.message || 'Auto-release failed' },
      { status: 500 }
    );
  }
}
