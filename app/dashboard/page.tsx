'use client';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loadState, AppState, loadChatHistory, getEquippedSkinUrls } from '@/lib/store';
import {
  type Wallet,
  loadWallet,
  saveWallet,
  refreshWallet,
  changePlan,
  getPlan,
  getMonthlyLimit,
  getRemainingMessages,
  ENERGY_CONFIG,
  PlanId,
  SpotKey,
} from '@/lib/energy';
import { BottomNav } from '@/components/ui/BottomNav';
import { CharAvatar } from '@/components/ui/CharacterSvg';
import { CharacterYard } from '@/components/ui/CharacterYard';
import { createClient } from '@/lib/supabase';
import { resolveAuth } from '@/lib/auth';
import { fullSync } from '@/lib/sync';

type ChatPreview = {
  text: string;
  ts: number;
};

function SpotIcon({ spotKey }: { spotKey: SpotKey }) {
  const common = { width: 22, height: 22, fill: 'none', stroke: '#111', strokeWidth: 2 } as const;
  switch (spotKey) {
    case 'cherry':
      return (
        <svg viewBox="0 0 24 24" {...common} strokeLinejoin="round" strokeLinecap="round">
          <circle cx="9" cy="16" r="4" />
          <circle cx="16" cy="16" r="4" />
          <path d="M9 12C9 8 12 5 12 5" />
          <path d="M16 12C16 8 12 5 12 5" />
          <path d="M12 5C14 4 16 4.5 17 5" />
        </svg>
      );
    case 'mikan':
      return (
        <svg viewBox="0 0 24 24" {...common} strokeLinejoin="round" strokeLinecap="round">
          <circle cx="12" cy="14" r="6" />
          <path d="M12 8V6" />
          <path d="M10 7C11 5 13 5 14 7" />
        </svg>
      );
    case 'grape':
      return (
        <svg viewBox="0 0 24 24" {...common} strokeLinejoin="round" strokeLinecap="round">
          <circle cx="12" cy="10" r="2.5" />
          <circle cx="8.5" cy="14" r="2.5" />
          <circle cx="15.5" cy="14" r="2.5" />
          <circle cx="12" cy="18" r="2.5" />
          <path d="M12 7.5V5" />
          <path d="M10 6C11 4 13 4 14 6" />
        </svg>
      );
  }
}

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
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f5f0' }}>
        <span style={{ fontSize: 16, color: '#888' }}>読み込み中...</span>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<AppState | null>(null);
  const [previews, setPreviews] = useState<Record<string, ChatPreview>>({});
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [showShop, setShowShop] = useState(searchParams.get('shop') === '1');
  const [toast, setToast] = useState('');


  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const [purchasing, setPurchasing] = useState(false);

  const doPurchaseSpot = async (spotKey: SpotKey) => {
    if (purchasing) return;
    setPurchasing(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spotKey }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        showToast(data.error || '購入処理に失敗しました');
        setPurchasing(false);
      }
    } catch {
      showToast('購入処理に失敗しました');
      setPurchasing(false);
    }
  };

  const [subscribing, setSubscribing] = useState(false);
  const [subStatus, setSubStatus] = useState<{ planId: string; status: string; cancelAtPeriodEnd?: boolean } | null>(null);

  const doSubscribe = async (planId: PlanId) => {
    if (subscribing || planId === 'free') return;
    setSubscribing(true);
    try {
      const res = await fetch('/api/stripe/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (data.upgraded && wallet) {
        const w = changePlan(wallet, data.planId as PlanId);
        saveWallet(w);
        setWallet({ ...w });
        setSubStatus({ planId: data.planId, status: 'active' });
        showToast(`${getPlan(data.planId).label}にアップグレードしました`);
        setSubscribing(false);
      } else if (data.url) {
        window.location.href = data.url;
      } else {
        showToast(data.error || 'プラン登録に失敗しました');
        setSubscribing(false);
      }
    } catch {
      showToast('プラン登録に失敗しました');
      setSubscribing(false);
    }
  };

  const doOpenPortal = async () => {
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        showToast('ポータルを開けませんでした');
      }
    } catch {
      showToast('ポータルを開けませんでした');
    }
  };

  useEffect(() => {
    const supabase = createClient();

    const { promise, cancel } = resolveAuth(supabase, { graceMs: 1500 });

    let active = true;
    promise.then((loggedIn) => {
      if (!active) return;

      if (!loggedIn) {
        const savedState = loadState();
        if (savedState.onboardingDone) {
          localStorage.setItem('meora-onboarding-step', '2');
        }
        router.replace('/onboarding');
        return;
      }

      const s = loadState();
      if (!s.onboardingDone) {
        router.replace('/onboarding');
        return;
      }
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
      const w = refreshWallet(loadWallet());
      saveWallet(w);
      setWallet(w);

      // クラウド同期（バックグラウンド）
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user && active) {
          fullSync(user.id).then(result => {
            if (!active) return;
            if (result.charactersSynced > 0) {
              const refreshed = loadState();
              setState(refreshed);
              const refreshedMap: Record<string, ChatPreview> = {};
              refreshed.characters.forEach(c => {
                const history = loadChatHistory(c.id);
                const last = history[history.length - 1];
                refreshedMap[c.id] = last
                  ? { text: last.content, ts: last.timestamp }
                  : { text: '', ts: 0 };
              });
              setPreviews(refreshedMap);
            }
          }).catch(() => {});
        }
      });

      fetch('/api/subscription').then(r => r.json()).then(data => {
        if (!active) return;
        setSubStatus(data);
        if (data.planId && data.planId !== 'free' && data.status === 'active') {
          const updated = changePlan(w, data.planId as PlanId);
          saveWallet(updated);
          setWallet({ ...updated });
        }
      }).catch(() => {});
    });

    return () => {
      active = false;
      cancel();
    };
  }, [router]);

  if (!state || !wallet) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f5f0' }}>
        <span style={{ fontSize: 16, color: '#888' }}>読み込み中...</span>
      </div>
    );
  }

  const remaining = getRemainingMessages(wallet);
  const monthlyLimit = getMonthlyLimit(wallet);
  const plans = Object.values(ENERGY_CONFIG.plans);
  const spotEntries = (Object.keys(ENERGY_CONFIG.spotItems) as SpotKey[]).map((key) => ({
    key,
    ...ENERGY_CONFIG.spotItems[key],
  }));

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#f7f5f0', fontSize: 15, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-display)' }}>
            MEORA
          </span>
          <span style={{ background: '#f5a623', color: '#111', fontSize: 12, fontWeight: 800, padding: '2px 7px', border: '1.5px solid #111', boxShadow: '2px 2px 0 #f7f5f0', letterSpacing: '0.05em' }}>
            BETA
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setShowShop(true)}
            style={{
              background: '#fff',
              color: '#111',
              border: '2px solid #111',
              boxShadow: '2px 2px 0 #f7f5f0',
              padding: '2px 8px',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              borderRadius: 0,
              fontFamily: 'inherit',
            }}
          >
            ショップ
          </button>
        </div>
      </header>

      {/* 上部: MEORAが歩く庭 */}
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

        {/* トーク一覧 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.14em', color: '#7a746c', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', padding: '0 2px' }}>
            トーク
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', border: '2px solid #111', boxShadow: '4px 4px 0 #111', background: '#fff', maxHeight: 207, overflowY: 'auto' }}>

            {state.characters.length === 0 && (
              <div style={{ padding: '20px 16px', textAlign: 'center', color: '#888', fontSize: 15, lineHeight: 1.7, borderBottom: '1px solid #ddd' }}>
                まだMEORAがいません。<br />下のボタンからMEORAを探す/作ることができます。
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
                  <div style={{ width: 44, height: 44, border: '2px solid #111', flexShrink: 0, background: '#f0f0ea', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                    <CharAvatar photo={char.photo} name={char.name} size={40} />
                    {(() => {
                      const skins = getEquippedSkinUrls(char.id);
                      return (
                        <>
                          {skins.wear && <img src={skins.wear} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />}
                          {skins.hat && <img src={skins.hat} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />}
                        </>
                      );
                    })()}
                  </div>

                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: '#111', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{char.name}</span>
                      {timeLabel && (
                        <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, color: '#999', fontFamily: 'var(--font-mono)', letterSpacing: '0.02em' }}>{timeLabel}</span>
                      )}
                    </div>
                    <span style={{ fontSize: 14, color: hasHistory ? '#666' : '#aaa', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontStyle: hasHistory ? 'normal' : 'italic' }}>
                      {previewText}
                    </span>
                  </div>

                  <span style={{ flexShrink: 0, color: '#bbb', fontSize: 20, fontWeight: 800, lineHeight: 1 }}>›</span>
                </div>
              );
            })}

            {!state.characters.some(c => c.userCreated) && (
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
                <span style={{ flex: 1, fontSize: 16, fontWeight: 800, color: '#111', letterSpacing: '0.02em' }}>自分のMEORAを作る</span>
                <span style={{ flexShrink: 0, color: '#bbb', fontSize: 20, fontWeight: 800, lineHeight: 1 }}>›</span>
              </div>
            )}

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
              <span style={{ flex: 1, fontSize: 16, fontWeight: 800, color: '#111', letterSpacing: '0.02em' }}>マーケットでMEORAを探す</span>
              <span style={{ flexShrink: 0, color: '#bbb', fontSize: 20, fontWeight: 800, lineHeight: 1 }}>›</span>
            </div>

          </div>
        </div>

      </main>

      {/* ショップ オーバーレイ */}
      {showShop && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100000,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }} onClick={() => setShowShop(false)}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 390,
              background: '#f8f8f4',
              border: '2px solid #111',
              borderBottom: 'none',
              boxShadow: '0 -4px 0 #111',
              padding: '20px 16px calc(80px + env(safe-area-inset-bottom))',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>ショップ</h2>
              <button onClick={() => setShowShop(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#111', padding: 4, display: 'flex', alignItems: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <line x1="3" y1="3" x2="15" y2="15" stroke="#111" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="15" y1="3" x2="3" y2="15" stroke="#111" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {toast && (
              <div style={{ background: '#e8f5e9', border: '2px solid #111', padding: '10px 14px', marginBottom: 12, fontSize: 15, fontWeight: 700, color: '#2e7d32' }}>
                {toast}
              </div>
            )}

            {/* 残り通数 */}
            <div style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', color: '#7a746c', marginBottom: 8 }}>今月の残りメッセージ</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#111' }}>
                  {remaining.monthly}
                </span>
                <span style={{ fontSize: 14, color: '#888' }}>
                  / {monthlyLimit}通
                </span>
              </div>
              {remaining.bonus > 0 && (
                <div style={{ fontSize: 13, color: '#e8568a', fontWeight: 700, marginTop: 4 }}>
                  + ボーナス {remaining.bonus}通（180日間有効）
                </div>
              )}
            </div>

            {/* フルーツショップ（スポット購入） */}
            <div style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', color: '#7a746c', marginBottom: 10 }}>アイテムショップ</div>
              <div style={{ fontSize: 11, color: '#999', marginBottom: 10 }}>
                購入するとボーナス通数が追加されます（180日間有効）
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {spotEntries.map((item) => (
                  <button key={item.key} onClick={() => doPurchaseSpot(item.key)}
                    disabled={purchasing}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '12px 14px', background: '#f8f8f4', border: '2px solid #111',
                      boxShadow: '2px 2px 0 #111', cursor: purchasing ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit', opacity: purchasing ? 0.5 : 1, width: '100%',
                    }}>
                    <SpotIcon spotKey={item.key} />
                    <div style={{ textAlign: 'left', flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 800 }}>{item.label}</div>
                      <div style={{ fontSize: 12, color: '#888' }}>+{item.messagesGranted}通</div>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#e8568a', flexShrink: 0 }}>
                      {item.priceYen}円
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 月額プラン */}
            <div style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', color: '#7a746c', marginBottom: 4 }}>月額プラン</div>
              <div style={{ fontSize: 11, color: '#999', marginBottom: 10 }}>
                毎日のメッセージ上限がアップグレードされます
              </div>

              {(() => {
                const currentPlanId = subStatus?.planId ?? 'free';
                const isSubscribed = subStatus && currentPlanId !== 'free' && subStatus.status === 'active';
                const planOrder: PlanId[] = ['free', 'light', 'standard'];
                const currentIdx = planOrder.indexOf(currentPlanId as PlanId);

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {isSubscribed && (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <span style={{ background: '#e8568a', color: '#fff', fontSize: 11, fontWeight: 800, padding: '2px 8px', border: '1.5px solid #111' }}>
                            加入中
                          </span>
                          <span style={{ fontSize: 15, fontWeight: 800 }}>
                            {getPlan(currentPlanId as PlanId).label}
                          </span>
                        </div>
                        {subStatus.cancelAtPeriodEnd && (
                          <div style={{ fontSize: 12, color: '#c62828' }}>
                            次回更新日に解約されます
                          </div>
                        )}
                      </>
                    )}

                    {plans.filter(p => p.id !== 'free' && p.id !== currentPlanId).map((p) => {
                      const idx = planOrder.indexOf(p.id);
                      const isUpgrade = idx > currentIdx;
                      return (
                        <button key={p.id} onClick={() => doSubscribe(p.id)}
                          disabled={subscribing}
                          style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '12px 14px', background: '#f8f8f4', border: '2px solid #111',
                            boxShadow: '2px 2px 0 #111', cursor: subscribing ? 'not-allowed' : 'pointer',
                            fontFamily: 'inherit', opacity: subscribing ? 0.5 : 1, width: '100%',
                          }}>
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: 14, fontWeight: 800 }}>
                              {isSubscribed ? (isUpgrade ? 'アップグレード: ' : 'ダウングレード: ') : ''}{p.label}
                            </div>
                            <div style={{ fontSize: 11, color: '#888' }}>
                              {p.monthlyLimit}通/月
                            </div>
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 800, fontFamily: 'var(--font-mono)', color: isUpgrade || !isSubscribed ? '#e8568a' : '#888' }}>
                            {p.priceYen}円/月
                          </div>
                        </button>
                      );
                    })}

                    {/* 無料プランの表示 */}
                    {!isSubscribed && (
                      <div style={{
                        padding: '12px 14px', background: '#f0f0ea', border: '2px solid #111',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800 }}>現在: 無料プラン</div>
                          <div style={{ fontSize: 11, color: '#888' }}>約50通/月</div>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#888' }}>0円</div>
                      </div>
                    )}

                    {isSubscribed && (
                      <button onClick={doOpenPortal}
                        style={{
                          width: '100%', padding: '10px', background: '#f8f8f4', border: '2px solid #111',
                          boxShadow: '2px 2px 0 #111', fontSize: 13, fontWeight: 800, cursor: 'pointer',
                          fontFamily: 'inherit', marginTop: 4,
                        }}>
                        プランを管理する（解約）
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
