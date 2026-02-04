import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

// POST /api/stripe/customer-portal - Create checkout session for client to add payment method
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get client profile
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('stripe_customer_id')
      .eq('profile_id', user.id)
      .single();

    if (clientError) {
      return NextResponse.json({ error: 'Client profile not found' }, { status: 404 });
    }

    let customerId = client.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', user.id)
        .single();

      const customer = await stripe.customers.create({
        email: profile?.email || user.email,
        name: profile?.full_name,
        metadata: {
          user_id: user.id,
          role: 'client',
        },
      });

      customerId = customer.id;

      // Save customer ID to database
      await supabase
        .from('clients')
        .update({ stripe_customer_id: customerId })
        .eq('profile_id', user.id);
    }

    // Create Checkout Session for payment method setup
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'setup',
      payment_method_types: ['card'],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=payment&setup=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=payment`,
    });

    return NextResponse.json({
      url: session.url,
    });

  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
