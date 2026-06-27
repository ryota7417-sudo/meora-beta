import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { getStripe } from '@/lib/stripe';

const ALLOWED_AMOUNTS = [300, 600, 900, 1500, 3000, 5000, 10000];

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll().map(c => ({ name: c.name, value: c.value }));
          },
          setAll() {},
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const amount = Number(body.amount);
    const creatorId = String(body.creatorId ?? '').slice(0, 100);
    const creatorName = String(body.creatorName ?? '').slice(0, 100);

    if (!ALLOWED_AMOUNTS.includes(amount)) {
      return Response.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const stripe = getStripe();
    const appUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}`;

    // クリエイターのStripe Connectアカウントを取得
    let stripeAccountId: string | null = null;
    if (creatorId) {
      const serviceRole = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      );
      const { data: creator } = await serviceRole
        .from('creator_profiles')
        .select('stripe_account_id')
        .eq('id', creatorId)
        .limit(1)
        .single();

      if (creator?.stripe_account_id) {
        stripeAccountId = creator.stripe_account_id;
      }
    }

    // スキン・応援アイテム分配率: クリエイター85%
    const creatorSharePercent = 85;
    const creatorShare = Math.floor(amount * creatorSharePercent / 100);

    const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'jpy',
          unit_amount: amount,
          product_data: {
            name: `応援${creatorName ? ` - ${creatorName}` : ''}`,
            description: `${amount.toLocaleString()}円の応援`,
          },
        },
        quantity: 1,
      }],
      success_url: `${appUrl}/purchase/success?session_id={CHECKOUT_SESSION_ID}&type=tip&amount=${amount}`,
      cancel_url: `${appUrl}/market`,
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
        type: 'tip',
        amount: String(amount),
        creatorId,
        creatorName,
      },
    };

    // Connect分配: クリエイターのStripeアカウントがある場合のみ
    if (stripeAccountId) {
      sessionParams.payment_intent_data = {
        transfer_data: {
          destination: stripeAccountId,
          amount: creatorShare,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Tip error:', error instanceof Error ? error.message : 'unknown');
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
