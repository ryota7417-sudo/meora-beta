'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadState, AppState, loadChatHistory } from '@/lib/store';
import {
  Energy,
  loadEnergy,
  saveEnergy,
  refreshEnergy,
  purchaseSpot,
  changePlan,
  getMeterLevel,
  getMeterStatusText,
  getDailyMeals,
  getPlan,
  ENERGY_CONFIG,
  PlanId,
  SpotKey,
  MealKey,
} from '@/lib/energy';
import { BottomNav } from '@/components/ui/BottomNav';
import { SatietyMeter } from '@/components/ui/SatietyMeter';
import { CharAvatar } from '@/components/ui/CharacterSvg';
import { CharacterYard } from '@/components/ui/CharacterYard';
import { createClient } from '@/lib/supabase';
import { resolveAuth } from '@/lib/auth';

// トーク一覧用のMEORAごとプレビュー型
type ChatPreview = {
  text: string;   // 最後のメッセージ本文（無ければ空文字）
  ts: number;     // 最後のメッセージの timestamp（無ければ 0）
};

// モノクロSVGのお食事アイコン（色付き絵文字は使わない）
function MealIcon({ mealKey }: { mealKey: MealKey }) {
  const common = { width: 22, height: 22, fill: 'none', stroke: '#111', strokeWidth: 2 } as const;
  switch (mealKey) {
    case 'onigiri':
      return <svg viewBox="0 0 24 24" {...common} strokeLinejoin="round"><path d="M12 4 4 19h16L12 4Z"/><rect x="9" y="13" width="6" height="5" fill="#111" stroke="none"/></svg>;
    case 'sandwich':
      return <svg viewBox="0 0 24 24" {...common} strokeLinejoin="round"><path d="M4 18 12 6l8 12H4Z"/><path d="M7 18h10"/></svg>;
    case 'nikujaga':
      return <svg viewBox="0 0 24 24" {...common}><path d="M4 13a8 4 0 0 0 16 0"/><path d="M4 13a8 4 0 0 1 16 0"/><path d="M6 17h12"/></svg>;
    case 'omurice':
      return <svg viewBox="0 0 24 24" {...common}><ellipse cx="12" cy="13" rx="9" ry="5"/><path d="M7 11c2-2 8-2 10 0"/></svg>;
    case 'sushi':
      return <svg viewBox="0 0 24 24" {...common}><rect x="4" y="9" width="16" height="7" rx="2"/><path d="M4 12h16"/></svg>;
  }
}

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
  const [energy, setEnergy] = useState<Energy | null>(null);
  const [showKitchen, setShowKitchen] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const doPurchaseSpot = (spotKey: SpotKey) => {
    const next = refreshEnergy(loadEnergy());
    const res = purchaseSpot(next, spotKey);
    if (!res) return;
    saveEnergy(next);
    setEnergy({ ...next });
    showToast(`${ENERGY_CONFIG.meals[ENERGY_CONFIG.spotItems[spotKey].mealKey].label}を購入しました！（仮）`);
  };

  const doChangePlan = (planId: PlanId) => {
    const next = changePlan(refreshEnergy(loadEnergy()), planId);
    saveEnergy(next);
    setEnergy({ ...next });
    showToast(`${getPlan(planId).label}に変更しました（仮）`);
  };

  useEffect(() => {
    const supabase = createClient();

    // 認証解決は「肯定(session あり)は速攻採用 / 否定(null)は猶予と再確認の後に採用」。
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
      // 満腹度を最新化（毎朝5時の食事配布・24h失効を自動反映）して保存。
      const e = refreshEnergy(loadEnergy());
      saveEnergy(e);
      setEnergy(e);
    });

    return () => {
      active = false;
      cancel();
    };
  }, [router]);

  if (!state || !energy) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f5f0' }}>
        <span style={{ fontSize: 16, color: '#888' }}>読み込み中...</span>
      </div>
    );
  }

  const plan = getPlan(energy.plan);
  const dailyMeals = getDailyMeals(energy.plan);
  const spotEntries = (Object.keys(ENERGY_CONFIG.spotItems) as SpotKey[]).map((key) => ({
    key,
    ...ENERGY_CONFIG.spotItems[key],
    ...ENERGY_CONFIG.meals[ENERGY_CONFIG.spotItems[key].mealKey],
  }));
  const plans = Object.values(ENERGY_CONFIG.plans);

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
          <button onClick={() => setShowKitchen(true)} aria-label="満腹メーター・ごはん"
            style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
            <SatietyMeter energy={energy} dark />
          </button>
          <button
            onClick={() => setShowKitchen(true)}
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
            ごはん
          </button>
        </div>
      </header>

      {/* 上部: MEORAが歩く庭（空きスペースを広く占有） */}
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
                  <div style={{ width: 44, height: 44, border: '2px solid #111', flexShrink: 0, background: '#f0f0ea', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <CharAvatar photo={char.photo} name={char.name} size={40} />
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

            {/* ＋ 自分のMEORAを作る（自作MEORAが無い場合のみ表示） */}
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

            {/* ＋ MEORAを探す（クリエイターマーケットへ） */}
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

      {/* ごはん / ショップ オーバーレイ */}
      {showKitchen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }} onClick={() => setShowKitchen(false)}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>ごはん</h2>
              <button onClick={() => setShowKitchen(false)}
                style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#111', fontWeight: 800 }}>✕</button>
            </div>

            {toast && (
              <div style={{ background: '#e8f5e9', border: '2px solid #111', padding: '10px 14px', marginBottom: 12, fontSize: 15, fontWeight: 700, color: '#2e7d32' }}>
                {toast}
              </div>
            )}

            {/* 満腹メーター */}
            <div style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: 14, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <SatietyMeter energy={energy} />
              <strong style={{ fontSize: 16 }}>{getMeterStatusText(getMeterLevel(energy))}</strong>
            </div>

            {/* 毎日のごはん */}
            <div style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', color: '#7a746c', marginBottom: 4 }}>毎日のごはん（{plan.label}）</div>
              <p style={{ fontSize: 13, color: '#888', margin: '0 0 10px', lineHeight: 1.6 }}>毎朝5時に届きます。その日のうちに食べないと翌朝には新しい食事に切り替わります（貯められません）。</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {dailyMeals.map((meal) => (
                  <div key={meal.key} style={{ display: 'flex', alignItems: 'center', gap: 10, border: '2px solid #111', padding: '8px 10px', background: '#fff' }}>
                    <MealIcon mealKey={meal.key} />
                    <span style={{ fontWeight: 800 }}>{meal.label}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 12, color: '#888' }}>満腹メーター +{meal.meterRecovery}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* スポット購入 */}
            <div style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', color: '#7a746c', marginBottom: 4 }}>スポットで買えるごはん</div>
              <p style={{ fontSize: 13, color: '#888', margin: '0 0 10px', lineHeight: 1.6 }}>買ったごはんは失効しません。毎日のごはんを使い切ったあとに消費されます。</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {spotEntries.map((item) => (
                  <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 10, border: '2px solid #111', padding: '8px 10px', background: '#fff' }}>
                    <MealIcon mealKey={item.mealKey} />
                    <span style={{ fontWeight: 800 }}>{item.label}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 12, color: '#888' }}>満腹メーター +{item.meterRecovery}</span>
                    <button onClick={() => doPurchaseSpot(item.key)}
                      style={{ background: '#111', color: '#fff', border: '2px solid #111', boxShadow: '2px 2px 0 #555', padding: '6px 10px', fontSize: 13, fontWeight: 800, cursor: 'pointer', borderRadius: 0, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                      ¥{item.priceYen}で買う
                    </button>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 12, color: '#aaa', margin: '10px 0 0' }}>※ 決済は準備中のため、いまは「仮購入」としてその場で反映されます。</p>
            </div>

            {/* プラン */}
            <div style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', color: '#7a746c', marginBottom: 10 }}>プラン</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {plans.map((p) => {
                  const active = p.id === energy.plan;
                  const mealLabels = p.dailyMeals.map((k: MealKey) => ENERGY_CONFIG.meals[k].label).join('・');
                  return (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, border: active ? '2px solid #e8568a' : '2px solid #111', boxShadow: active ? '4px 4px 0 #e8568a' : 'none', padding: '10px 12px', background: '#fff' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <strong>{p.label}</strong>
                        <span style={{ fontSize: 12, color: '#888' }}>{p.priceYen === 0 ? '無料' : `月額¥${p.priceYen}`}・毎日：{mealLabels}</span>
                      </div>
                      {active ? (
                        <span style={{ fontSize: 12, fontWeight: 800, background: '#e8568a', color: '#fff', padding: '3px 8px', border: '2px solid #111' }}>利用中</span>
                      ) : (
                        <button onClick={() => doChangePlan(p.id)}
                          style={{ background: '#111', color: '#fff', border: '2px solid #111', boxShadow: '2px 2px 0 #555', padding: '6px 10px', fontSize: 13, fontWeight: 800, cursor: 'pointer', borderRadius: 0, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                          {p.priceYen === 0 ? '無料に戻す' : 'このプランにする'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              <p style={{ fontSize: 12, color: '#aaa', margin: '10px 0 0' }}>※ 決済は準備中のため、プラン変更は「仮」としてその場で反映されます。</p>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
