import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { priceId } = await request.json();
  if (!priceId) {
    return NextResponse.json({ error: 'Missing priceId' }, { status: 400 });
  }

  // Check if user already has a Stripe customer
  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single();

  let customerId = sub?.stripe_customer_id;

  if (!customerId) {
    // Create Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;

    // Save customer ID
    await supabaseAdmin.from('subscriptions').upsert({
      user_id: user.id,
      stripe_customer_id: customerId,
      status: 'free',
    });
  }

  const origin = request.headers.get('origin') || 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/billing?payment=success`,
    cancel_url: `${origin}/billing?payment=canceled`,
    metadata: { user_id: user.id },
  });

  return NextResponse.json({ url: session.url });
}
