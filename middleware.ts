import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Supabase 公式 Next.js App Router 向けセッション更新ミドルウェア。
// @supabase/ssr の createServerClient を使い、リクエスト/レスポンス間で
// cookie を正しく get/set しながら supabase.auth.getUser() を呼んで
// セッション(=cookie)を最新化する。これにより auth/callback で発行された
// セッション cookie がクライアントの getSession() 前に確実に同期され、
// 「Googleログイン後にスプラッシュへ戻る」断続的レースを根本から解消する。
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // env が無い環境ではセッション更新をスキップ(ビルド/プレビュー安全策)。
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // まず request 側へ反映(後続の getUser が新しい cookie を読めるように)
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        // response を作り直し、ブラウザへ Set-Cookie を返す
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // 重要: createServerClient と getUser() の間に処理を挟まないこと。
  // ここでセッションを更新し、期限切れトークンをリフレッシュする。
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    // 以下を除く全リクエストにマッチ:
    // - _next/static (静的ファイル)
    // - _next/image (画像最適化)
    // - favicon.ico
    // - 画像など静的アセット拡張子
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|txt|woff|woff2|ttf|otf|mp4|webm)$).*)',
  ],
};
