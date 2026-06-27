import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { getStripe } from '@/lib/stripe';

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

    const stripe = getStripe();
    const serviceRole = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data: creator } = await serviceRole
      .from('creator_profiles')
      .select('id, stripe_account_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (!creator) {
      return Response.json({ error: 'Creator profile not found' }, { status: 404 });
    }

    let accountId = creator.stripe_account_id;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'JP',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: {
          creatorId: creator.id,
          userId: user.id,
        },
      });
      accountId = account.id;

      await serviceRole
        .from('creator_profiles')
        .update({ stripe_account_id: accountId })
        .eq('id', creator.id);
    }

    const appUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}`;

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl}/settings`,
      return_url: `${appUrl}/settings?connect=success`,
      type: 'account_onboarding',
    });

    return Response.json({ url: accountLink.url });
  } catch (error) {
    console.error('Connect onboard error:', error instanceof Error ? error.message : 'unknown');
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
