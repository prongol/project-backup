import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get user from Supabase auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has accepted fee and has Connect account
    const { data: setupData } = await supabase
      .from('stripe_connect_setup')
      .select('*')
      .eq('freelancer_id', user.id)
      .single();

    if (!setupData) {
      return NextResponse.json({
        feeAccepted: false,
        account: null,
        status: 'not_started'
      });
    }

    if (!setupData.fee_accepted) {
      return NextResponse.json({
        feeAccepted: false,
        account: null,
        status: 'fee_pending'
      });
    }

    if (!setupData.stripe_account_id) {
      return NextResponse.json({
        feeAccepted: true,
        account: null,
        status: 'account_pending'
      });
    }

    // Get account details from Stripe
    try {
      const account = await stripe.accounts.retrieve(setupData.stripe_account_id);
      
      return NextResponse.json({
        feeAccepted: true,
        account: {
          id: account.id,
          details_submitted: account.details_submitted,
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          requirements: account.requirements
        },
        status: account.details_submitted && account.charges_enabled ? 'complete' : 'onboarding_pending'
      });
    } catch (stripeError: any) {
      console.error('Error retrieving Stripe account:', stripeError);
      
      // If account doesn't exist, reset the setup
      if (stripeError.code === 'resource_missing') {
        await supabase
          .from('stripe_connect_setup')
          .update({ stripe_account_id: null })
          .eq('freelancer_id', user.id);
        
        return NextResponse.json({
          feeAccepted: true,
          account: null,
          status: 'account_pending'
        });
      }
      
      throw stripeError;
    }

  } catch (error: any) {
    console.error('Error checking Connect status:', error);
    return NextResponse.json(
      { error: 'Failed to check setup status' },
      { status: 500 }
    );
  }
}