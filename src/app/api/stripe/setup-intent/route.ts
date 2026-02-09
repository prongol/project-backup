import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get client profile
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('stripe_customer_id')
      .eq('user_id', session.user.id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client profile not found' }, { status: 404 });
    }

    let customerId = client.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        metadata: {
          user_id: session.user.id,
        },
      });

      customerId = customer.id;

      // Update client with Stripe customer ID
      await supabase
        .from('clients')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', session.user.id);
    }

    // Create setup intent for collecting payment method
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
    });

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      customerId,
    });
  } catch (error: any) {
    console.error('Error creating setup intent:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create setup intent' },
      { status: 500 }
    );
  }
}
