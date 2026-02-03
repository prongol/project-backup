import { NextRequest, NextResponse } from 'next/server';
import { createConnectAccount, createAccountLink } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

// POST /api/stripe/connect/setup - Setup Stripe Connect for freelancer
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

    const { email, acceptsFee } = await req.json();

    // Verify user is a freelancer
    const { data: freelancer, error: freelancerError } = await supabase
      .from('freelancers')
      .select('id, profile_id, stripe_connect_account_id')
      .eq('profile_id', user.id)
      .single();

    if (freelancerError || !freelancer) {
      return NextResponse.json(
        { error: 'Freelancer profile not found' },
        { status: 404 }
      );
    }

    // Check if already has Stripe account
    if (freelancer.stripe_connect_account_id) {
      return NextResponse.json(
        { error: 'Connect account already exists' },
        { status: 400 }
      );
    }

    // Require fee acceptance
    if (!acceptsFee) {
      return NextResponse.json(
        { error: 'You must accept the 7% platform fee to continue' },
        { status: 400 }
      );
    }

    // Create Stripe Connect account
    const account = await createConnectAccount(email, freelancer.id);

    // Update freelancer with Connect account and fee acceptance
    const { error: updateError } = await supabase
      .from('freelancers')
      .update({
        stripe_connect_account_id: account.id,
        fee_acceptance_agreement: true,
        fee_accepted_at: new Date().toISOString(),
      })
      .eq('id', freelancer.id);

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to save account information' },
        { status: 500 }
      );
    }

    // Track setup progress
    await supabase
      .from('payment_setup_progress')
      .insert({
        user_id: user.id,
        user_type: 'freelancer',
        setup_stage: 'stripe_connect_created',
        stripe_account_id: account.id,
        setup_data: { fee_accepted: true }
      });

    return NextResponse.json({
      success: true,
      accountId: account.id,
      message: 'Connect account created successfully',
    });

  } catch (error: any) {
    console.error('Connect account creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create Connect account' },
      { status: 500 }
    );
  }
}

// GET /api/stripe/connect/setup - Check setup status
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

    // Get freelancer status
    const { data: freelancer } = await supabase
      .from('freelancers')
      .select(`
        id, 
        stripe_connect_account_id, 
        stripe_onboarding_completed, 
        stripe_charges_enabled, 
        stripe_payouts_enabled,
        fee_acceptance_agreement,
        fee_accepted_at
      `)
      .eq('profile_id', user.id)
      .single();

    if (!freelancer) {
      return NextResponse.json(
        { error: 'Freelancer profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      hasConnectAccount: !!freelancer.stripe_connect_account_id,
      accountId: freelancer.stripe_connect_account_id,
      onboardingCompleted: freelancer.stripe_onboarding_completed,
      chargesEnabled: freelancer.stripe_charges_enabled,
      payoutsEnabled: freelancer.stripe_payouts_enabled,
      feeAccepted: freelancer.fee_acceptance_agreement,
      canReceivePayments: freelancer.stripe_onboarding_completed && 
                         freelancer.stripe_charges_enabled && 
                         freelancer.stripe_payouts_enabled
    });

  } catch (error: any) {
    console.error('Connect status error:', error);
    return NextResponse.json(
      { error: 'Failed to check setup status' },
      { status: 500 }
    );
  }
}