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

    // Get freelancer profile
    const { data: freelancer, error: freelancerError } = await supabase
      .from('freelancers')
      .select('stripe_account_id, profile_id')
      .eq('profile_id', user.id)
      .single();

    if (freelancerError) {
      return NextResponse.json({ error: 'Freelancer profile not found' }, { status: 404 });
    }

    // Check if already has Stripe account
    if (freelancer.stripe_account_id) {
      // Check if account is fully onboarded
      const account = await stripe.accounts.retrieve(freelancer.stripe_account_id);
      
      // If account setup is not complete, create new onboarding link
      if (!account.details_submitted || !account.charges_enabled) {
        const accountLink = await stripe.accountLinks.create({
          account: freelancer.stripe_account_id,
          refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=payment&setup=refresh`,
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=payment&setup=complete`,
          type: 'account_onboarding',
        });
        
        return NextResponse.json({
          accountId: freelancer.stripe_account_id,
          url: accountLink.url,
          isExisting: true,
          needsOnboarding: true
        });
      }
      
      // Account is complete, create login link
      const loginLink = await stripe.accounts.createLoginLink(freelancer.stripe_account_id);
      
      return NextResponse.json({
        accountId: freelancer.stripe_account_id,
        url: loginLink.url,
        isExisting: true,
        needsOnboarding: false
      });
    }

    // Get user email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single();

    // Create new Connect account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US', // Change based on your target country
      email: profile?.email || user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      business_profile: {
        name: profile?.full_name || 'Freelancer',
        product_description: 'Freelance services',
      },
    });

    // Save account ID to database
    await supabase
      .from('freelancers')
      .update({ stripe_account_id: account.id })
      .eq('profile_id', user.id);

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=payment&setup=refresh`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=payment&setup=complete`,
      type: 'account_onboarding',
    });

    return NextResponse.json({
      accountId: account.id,
      url: accountLink.url,
      isExisting: false
    });

  } catch (error: any) {
    console.error('Error creating Stripe Connect account:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create Stripe account' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get freelancer's Stripe account
    const { data: freelancer } = await supabase
      .from('freelancers')
      .select('stripe_account_id')
      .eq('profile_id', user.id)
      .single();

    if (!freelancer?.stripe_account_id) {
      return NextResponse.json({ 
        connected: false,
        account: null
      });
    }

    // Get account details from Stripe
    const account = await stripe.accounts.retrieve(freelancer.stripe_account_id);

    // Get account balance
    const balance = await stripe.balance.retrieve({
      stripeAccount: freelancer.stripe_account_id,
    });

    return NextResponse.json({
      connected: true,
      accountId: account.id,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      account: {
        id: account.id,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
        email: account.email,
        country: account.country,
      },
      balance: {
        available: balance.available,
        pending: balance.pending,
      },
    });

  } catch (error: any) {
    console.error('Error fetching Stripe account:', error);
    return NextResponse.json(
      { error: 'Failed to fetch account details' },
      { status: 500 }
    );
  }
}