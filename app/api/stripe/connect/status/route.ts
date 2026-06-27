import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { getStripe } from '@/lib/stripe';

export async function GET(req: NextRequest) {
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

    if (!creator || !creator.stripe_account_id) {
      return Response.json({ connected: false, chargesEnabled: false, payoutsEnabled: false });
    }

    const stripe = getStripe();
    const account = await stripe.accounts.retrieve(creator.stripe_account_id);

    return Response.json({
      connected: true,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      accountId: account.id,
    });
  } catch (error) {
    console.error('Connect status error:', error instanceof Error ? error.message : 'unknown');
    return Response.json({ connected: false, chargesEnabled: false, payoutsEnabled: false });
  }
}
