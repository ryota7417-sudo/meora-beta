'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadState, AppState, loadChatHistory } from '@/lib/store';
import { BottomNav } from '@/components/ui/BottomNav';
import { CharAvatar } from '@/components/ui/CharacterSvg';
import { CharacterYard } from '@/components/ui/CharacterYard';
import { createClient } from '@/lib/supabase';
import { resolveAuth } from '@/lib/auth';

// トーク一覧用のキャラごとプレビュー型
type ChatPreview = {
  text: string;   // 最後のメッセージ本文（無ければ空文字）
  ts: number;     // 最後のメッセージの timestamp（無ければ 0）
};

// 時刻の簡易表記。
// 当日: HH:MM / 前日: 昨日 / 同週(2〜6日前): 曜日 / それ以前: M/D
function formatChatTime(ts: number): string {
  if (!ts) return '';
  const now = new Date();
  const d = new Date(ts);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const oneDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.floor((startOfToday - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / oneDay);

  if (diffDays <= 0) {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }
  if (diffDays === 1) return '昨日';
  if (diffDays < 7) {
    const week = ['日', '月', '火', '水', '木', '金', '土'];
    return `${week[d.getDay()]}曜`;
  }
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [state, setState] = useState<AppState | null>(null);
  const [previews, setPreviews] = useState<Record<string, ChatPreview>>({});

  useEffect(() => {
    const supabase = createClient();

    // 認証解決は「肯定(session あり)は速攻採用 / 否定(null)は猶予と再確認の後に採用」。
    // ログイン直後の一瞬の session=null による /onboarding への誤バウンスを防ぐ。
    const { promise, cancel } = resolveAuth(supabase, { graceMs: 1500 });

    let active = true;
    promise.then((loggedIn) => {
      if (!active) return;

      if (!loggedIn) {
        // 未ログイン確定時のみオンボーディングへ。
        // オンボーディング完了済みの場合はstep 2（アカウント作成）から再開。
        const savedState = loadState();
        if (savedState.onboardingDone) {
          localStorage.setItem('meora-onboarding-step', '2');
        }
        router.replace('/onboarding');
        return;
      }

      // ここからはログイン済み確定。
      const s = loadState();
      if (!s.onboardingDone) {
        router.replace('/onboarding');
        return;
      }
      // 各キャラのトーク履歴から最後のメッセージ・時刻を集計
      const map: Record<string, ChatPreview> = {};
      s.characters.forEach(c => {
        const history = loadChatHistory(c.id);
        const last = history[history.length - 1];
        map[c.id] = last
          ? { text: last.content, ts: last.timestamp }
          : { text: '', ts: 0 };
      });
      setPreviews(map);
      setState(s);
    });

    return () => {
      active = false;
      cancel();
    };
  }, [router]);

  if (!state) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f5f0' }}>
        <span style={{ fontSize: 14, color: '#888' }}>読み込み中...</span>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#f7f5f0',
      height: '100vh',
      maxWidth: 390,
      margin: '0 auto',
      color: '#111111',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>

      {/* PAGE HEADER */}
      <header style={{
        flexShrink: 0,
        background: '#111111',
        padding: '12px 16px 8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 100,
        borderBottom: '2px solid #111',
      }}>
        <span style={{ color: '#f7f5f0', fontSize: 13, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-display)' }}>
          MEORA
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ background: '#f5a623', color: '#111', fontSize: 10, fontWeight: 800, padding: '2px 7px', border: '1.5px solid #111', boxShadow: '2px 2px 0 #f7f5f0', letterSpacing: '0.05em' }}>
            BETA
          </span>
        </div>
      </header>

      {/* 上部: キャラが歩く庭（空きスペースを広く占有） */}
      <div style={{ flex: 1, minHeight: 180, position: 'relative' }}>
        <CharacterYard characters={state.characters} />
      </div>

      {/* MAIN CONTENT（下部: トーク一覧） */}
      <main style={{
        flexShrink: 0,
        padding: '12px 14px',
        paddingBottom: 'calc(64px + 12px + env(safe-area-inset-bottom))',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        background: '#f7f5f0',
        backgroundImage: `
          repeating-linear-gradient(to right, rgba(0,0,0,0.07) 0px, rgba(0,0,0,0.07) 1px, transparent 1px, transparent 25px),
          repeating-linear-gradient(to bottom, rgba(0,0,0,0.07) 0px, rgba(0,0,0,0.07) 1px, transparent 1px, transparent 25px)
        `,
        borderTop: '2px solid #111',
      }}>

        {/* トーク一覧（LINE / ChatGPT ライク・最大3行分の高さでスクロール） */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: '#7a746c', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', padding: '0 2px' }}>
            トーク
          </span>

          {/* 約3行分(69px/行)の高さに制限してスクロール。＋ボタンは下に固定で残す。 */}
          <div style={{ display: 'flex', flexDirection: 'column', border: '2px solid #111', boxShadow: '4px 4px 0 #111', background: '#fff', maxHeight: 207, overflowY: 'auto' }}>

            {/* キャラ未所持の空状態 */}
            {state.characters.length === 0 && (
              <div style={{ padding: '20px 16px', textAlign: 'center', color: '#888', fontSize: 13, lineHeight: 1.7, borderBottom: '1px solid #ddd' }}>
                まだキャラがいません。<br />下のボタンからキャラを探す/作ることができます。
              </div>
            )}

            {state.characters.map((char) => {
              const preview = previews[char.id] ?? { text: '', ts: 0 };
              const hasHistory = !!preview.text;
              const previewText = hasHistory ? preview.text : 'タップして話しかけてみよう';
              const timeLabel = formatChatTime(preview.ts);

              return (
                <div
                  key={char.id}
                  onClick={() => router.push(`/chat/${char.id}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 12px',
                    gap: 11,
                    borderBottom: '1px solid #ddd',
                    cursor: 'pointer',
                    color: 'inherit',
                  }}
                >
                  {/* キャラアイコン（写真があれば写真、無ければイニシャル） */}
                  <div style={{ width: 44, height: 44, border: '2px solid #111', flexShrink: 0, background: '#f0f0ea', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <CharAvatar photo={char.photo} name={char.name} size={40} />
                  </div>

                  {/* 名前 + プレビュー */}
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#111', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{char.name}</span>
                      {timeLabel && (
                        <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, color: '#999', fontFamily: 'var(--font-mono)', letterSpacing: '0.02em' }}>{timeLabel}</span>
                      )}
                    </div>
                    <span style={{ fontSize: 12, color: hasHistory ? '#666' : '#aaa', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontStyle: hasHistory ? 'normal' : 'italic' }}>
                      {previewText}
                    </span>
                  </div>

                  {/* 矢印 */}
                  <span style={{ flexShrink: 0, color: '#bbb', fontSize: 18, fontWeight: 800, lineHeight: 1 }}>›</span>
                </div>
              );
            })}

            {/* ＋ 自分のキャラを作る */}
            <div
              style={{ display: 'flex', alignItems: 'center', padding: '12px 12px', gap: 11, cursor: 'pointer', background: '#f7f5f0', borderBottom: '1px solid #ddd' }}
              onClick={() => router.push('/character/new')}
            >
              <div style={{ width: 44, height: 44, border: '2px dashed #111', flexShrink: 0, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="11" y1="4" x2="11" y2="18" stroke="#111" strokeWidth="2.4" strokeLinecap="round"/>
                  <line x1="4" y1="11" x2="18" y2="11" stroke="#111" strokeWidth="2.4" strokeLinecap="round"/>
                </svg>
              </div>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 800, color: '#111', letterSpacing: '0.02em' }}>自分のキャラを作る</span>
              <span style={{ flexShrink: 0, color: '#bbb', fontSize: 18, fontWeight: 800, lineHeight: 1 }}>›</span>
            </div>

            {/* ＋ キャラを探す（クリエイターマーケットへ） */}
            <div
              style={{ display: 'flex', alignItems: 'center', padding: '12px 12px', gap: 11, cursor: 'pointer', background: '#f7f5f0' }}
              onClick={() => router.push('/market')}
            >
              <div style={{ width: 44, height: 44, border: '2px dashed #111', flexShrink: 0, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="11" cy="9" r="5" stroke="#111" strokeWidth="2.2"/>
                  <path d="M4 20 C4 16 18 16 18 20" stroke="#111" strokeWidth="2.2" strokeLinecap="round"/>
                </svg>
              </div>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 800, color: '#111', letterSpacing: '0.02em' }}>マーケットでキャラを探す</span>
              <span style={{ flexShrink: 0, color: '#bbb', fontSize: 18, fontWeight: 800, lineHeight: 1 }}>›</span>
            </div>

          </div>
        </div>

      </main>

      <BottomNav />
    </div>
  );
}
