import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * ログイン直後のセッション解決を堅牢に行うヘルパー。
 *
 * 背景:
 * ログイン直後は cookie のハイドレーション競合で、Supabase の初期セッション
 * 読込が整う前に onAuthStateChange の INITIAL_SESSION や getSession() が
 * 一瞬 session=null を返すことがある。これを「未ログイン」と即断すると
 * オンボーディングへ誤バウンスしてしまう(Googleログイン画面に戻る)。
 *
 * 方針:「肯定(session あり)は速攻採用 / 否定(null)は猶予と再確認の後に採用」
 *  1. onAuthStateChange を購読。session ありイベント(INITIAL_SESSION /
 *     SIGNED_IN で session あり)が来たら即「ログイン済み(true)」で確定。
 *  2. null を受け取っても即断しない。グレース期間(graceMs)待つ。その間に
 *     session ありイベントが来れば true で確定しタイマー解除。
 *     並行して getSession() による肯定確認も行い、取れたら即 true 確定。
 *  3. グレース期間が過ぎても一度も session が取れなければ、そこで初めて
 *     「未ログイン(false)」で確定。
 *  4. SIGNED_OUT(明示ログアウト)は即 false 確定。
 *
 * 返り値: ログイン済みなら true / 未ログインなら false。
 * cancel() を呼ぶとアンマウント時のクリーンアップ(購読解除・タイマー解除)を行う。
 */
export type ResolveAuthHandle = {
  promise: Promise<boolean>;
  cancel: () => void;
};

export function resolveAuth(
  supabase: SupabaseClient,
  options: { graceMs?: number } = {}
): ResolveAuthHandle {
  const graceMs = options.graceMs ?? 1500;

  let settled = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let resolvePromise!: (value: boolean) => void;

  const promise = new Promise<boolean>((res) => {
    resolvePromise = res;
  });

  const finish = (value: boolean) => {
    if (settled) return;
    settled = true;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    resolvePromise(value);
  };

  // 主軸: 認証イベント購読。session ありイベントは即 true 確定。
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (settled) return;
    if (event === 'SIGNED_OUT') {
      // 明示ログアウトは即 false。
      finish(false);
      return;
    }
    if (session) {
      // INITIAL_SESSION / SIGNED_IN / TOKEN_REFRESHED など session ありは即 true。
      finish(true);
      return;
    }
    // session=null のイベント(INITIAL_SESSION で null 等)は即断しない。
    // グレース期間中の肯定確認・後続イベントに委ねる。
    if (!timer) {
      timer = setTimeout(() => {
        // 猶予が過ぎても肯定が得られなければここで未ログイン確定。
        finish(false);
      }, graceMs);
    }
  });

  // 肯定確認: グレース期間に依存せず getUser() でもサーバー検証済みの認証を確認。
  // 取れたら即 true 確定。取れなくても false 確定はしない(タイマーに委ねる)。
  supabase.auth.getUser().then(({ data: { user } }) => {
    if (user) finish(true);
  }).catch(() => {
    // getUser 失敗は否定確定にしない(タイマー or 後続イベントに委ねる)。
  });

  const cancel = () => {
    settled = true;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    subscription.unsubscribe();
  };

  return { promise, cancel };
}
