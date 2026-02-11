import { NextRequest, NextResponse } from 'next/server';
import { createAccountLink } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { accountId } = await req.json();

    // Verify account belongs to user
    const { data: freelancer, error: freelancerError } = await supabase
      .from('freelancers')
      .select('id, stripe_account_id')
      .eq('stripe_account_id', accountId)
      .eq('profile_id', user.id)
      .single();

    if (freelancerError || !freelancer) {
      return NextResponse.json(
        { error: 'Connect account not found or unauthorized' },
        { status: 404 }
      );
    }

    // Create onboarding link
    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/freelancer/settings?tab=payments&setup=complete`;
    const refreshUrl = `${process.env.NEXT_PUBLIC_APP_URL}/freelancer/settings?tab=payments&setup=refresh`;
    
    const accountLink = await createAccountLink(accountId, returnUrl, refreshUrl);

    // Update setup progress
    await supabase
      .from('payment_setup_progress')
      .update({
        setup_stage: 'onboarding_started',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_account_id', accountId);

    return NextResponse.json({
      success: true,
      url: accountLink.url,
      expiresAt: accountLink.expires_at,
    });

  } catch (error: any) {
    console.error('Onboarding link creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create onboarding link' },
      { status: 500 }
    );
  }
}