import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const { searchParams } = url;
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/onboarding';

  // リダイレクト先は常にリクエスト元のオリジンを使う。
  // 0.0.0.0 は localhost に正規化（ブラウザの localStorage が分離されるのを防ぐ）。
  const origin = url.hostname === '0.0.0.0'
    ? `${url.protocol}//localhost:${url.port}`
    : url.origin;

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/onboarding?error=auth_failed`);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
