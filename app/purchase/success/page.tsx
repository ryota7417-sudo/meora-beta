'use client';
import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { loadWallet, saveWallet, refreshWallet, changePlan, purchaseSpotToWallet, ENERGY_CONFIG, type SpotKey, type PlanId } from '@/lib/energy';

type PurchaseRecord = {
  id: string;
  character_id: string;
  amount: number;
  status: string;
};

const PROCESSED_KEY = 'meora-processed-sessions';

function getProcessedSessions(): string[] {
  try {
    const raw = localStorage.getItem(PROCESSED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function markSessionProcessed(sessionId: string) {
  const list = getProcessedSessions();
  if (!list.includes(sessionId)) {
    list.push(sessionId);
    localStorage.setItem(PROCESSED_KEY, JSON.stringify(list.slice(-50)));
  }
}

function spotKeyFromAmount(amount: number): SpotKey {
  if (amount === 980) return 'grape';
  if (amount === 480) return 'mikan';
  return 'cherry';
}

function spotLabelFromKey(key: SpotKey): string {
  return ENERGY_CONFIG.spotItems[key]?.label ?? 'アイテム';
}

export default function PurchaseSuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f5f0' }}>
        <span style={{ fontSize: 16, color: '#888' }}>...</span>
      </div>
    }>
      <PurchaseSuccessContent />
    </Suspense>
  );
}

function PurchaseSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const purchaseType = searchParams.get('type');

  const [status, setStatus] = useState<'loading' | 'completed' | 'timeout'>('loading');
  const [purchase, setPurchase] = useState<PurchaseRecord | null>(null);
  const [subPlanId, setSubPlanId] = useState<PlanId | null>(null);
  const polled = useRef(false);

  useEffect(() => {
    if (!sessionId || polled.current) return;
    polled.current = true;

    const alreadyProcessed = getProcessedSessions().includes(sessionId);

    if (purchaseType === 'tip') {
      markSessionProcessed(sessionId);
      setStatus('completed');
    } else if (purchaseType === 'subscription') {
      handleSubscription(sessionId, alreadyProcessed);
    } else {
      handleSpotPurchase(sessionId, alreadyProcessed);
    }
  }, [sessionId, purchaseType]);

  async function handleSubscription(sid: string, alreadyProcessed: boolean) {
    let attempts = 0;
    const maxAttempts = 15;

    const poll = async () => {
      try {
        const res = await fetch('/api/subscription');
        const data = await res.json();
        if (data.planId && data.planId !== 'free' && data.status === 'active') {
          setSubPlanId(data.planId as PlanId);

          if (!alreadyProcessed) {
            const wallet = refreshWallet(loadWallet());
            changePlan(wallet, data.planId as PlanId);
            saveWallet(wallet);
            markSessionProcessed(sid);
          }

          setStatus('completed');
          return;
        }
      } catch {}

      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(poll, 1500);
      } else {
        setStatus('timeout');
      }
    };

    poll();
  }

  function handleSpotPurchase(sid: string, alreadyProcessed: boolean) {
    const supabase = createClient();
    let attempts = 0;
    const maxAttempts = 10;

    const poll = async () => {
      const { data } = await supabase
        .from('purchases')
        .select('id, character_id, amount, status')
        .eq('stripe_session_id', sid)
        .single();

      if (data && data.status === 'completed') {
        setPurchase(data as PurchaseRecord);

        if (!alreadyProcessed) {
          const key = spotKeyFromAmount(data.amount);
          const wallet = refreshWallet(loadWallet());
          purchaseSpotToWallet(wallet, key);
          saveWallet(wallet);
          markSessionProcessed(sid);
        }

        setStatus('completed');
        return;
      }

      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(poll, 1000);
      } else {
        setStatus('timeout');
      }
    };

    poll();
  }

  const isSubscription = purchaseType === 'subscription';
  const isTip = purchaseType === 'tip';
  const tipAmount = searchParams.get('amount');

  const PLAN_LABELS: Record<string, string> = { light: 'ライトプラン', standard: 'スタンダードプラン' };
  const PLAN_PRICES: Record<string, number> = { light: 680, standard: 1480 };

  const purchasedSpotKey = purchase ? spotKeyFromAmount(purchase.amount) : 'cherry';
  const itemLabel = purchase ? spotLabelFromKey(purchasedSpotKey) : 'アイテム';
  const messagesGranted = purchase ? (ENERGY_CONFIG.spotItems[purchasedSpotKey]?.messagesGranted ?? 0) : 0;

  return (
    <div style={{
      backgroundColor: '#f8f8f4',
      backgroundImage: 'linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)',
      backgroundSize: '24px 24px',
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      padding: '24px 16px 48px',
    }}>
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '14px 0 12px', marginBottom: 20, borderBottom: '2px solid #111' }}>
          <div />
          <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '0.04em', textAlign: 'center', whiteSpace: 'nowrap' }}>
            {status === 'loading' ? '決済を確認中...' : isSubscription ? 'プラン登録完了' : '購入完了'}
          </div>
          <div />
        </div>

        {status === 'loading' && (
          <div style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 16, color: '#555', lineHeight: 1.8 }}>
              決済を確認しています...
            </div>
          </div>
        )}

        {status === 'completed' && isSubscription && subPlanId && (
          <div style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: '28px 20px', textAlign: 'center' }}>
            <div style={{ marginBottom: 16 }}>
              <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12l3 3 5-5" />
              </svg>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#111', marginBottom: 12 }}>
              {PLAN_LABELS[subPlanId] || subPlanId} に登録しました
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#888', letterSpacing: '0.1em', marginBottom: 4 }}>月額</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#111', fontFamily: 'var(--font-mono)' }}>{(PLAN_PRICES[subPlanId] || 0).toLocaleString()}円/月</div>
              </div>
            </div>
            <div style={{ fontSize: 14, color: '#666', lineHeight: 1.6 }}>
              毎日のメッセージ上限がアップグレードされました。
            </div>
          </div>
        )}

        {status === 'completed' && isTip && (
          <div style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: '28px 20px', textAlign: 'center' }}>
            <div style={{ marginBottom: 16 }}>
              <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#e8568a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#111', marginBottom: 12 }}>
              応援ありがとうございます
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#e8568a', fontFamily: 'var(--font-mono)', marginBottom: 16 }}>
              ¥{Number(tipAmount || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: 14, color: '#666', lineHeight: 1.6 }}>
              クリエイターへの応援が届きました。
            </div>
          </div>
        )}

        {status === 'completed' && !isSubscription && !isTip && purchase && (
          <div style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: '28px 20px', textAlign: 'center' }}>
            <div style={{ marginBottom: 16 }}>
              <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12l3 3 5-5" />
              </svg>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#111', marginBottom: 12 }}>
              {itemLabel} を購入しました
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#888', letterSpacing: '0.1em', marginBottom: 4 }}>金額</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#111', fontFamily: 'var(--font-mono)' }}>{purchase.amount.toLocaleString()}円</div>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#888', letterSpacing: '0.1em', marginBottom: 4 }}>追加通数</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#e8568a', fontFamily: 'var(--font-mono)' }}>+{messagesGranted}通</div>
              </div>
            </div>
            <div style={{ fontSize: 14, color: '#666', lineHeight: 1.6 }}>
              ボーナス通数が追加されました。
            </div>
          </div>
        )}

        {status === 'timeout' && (
          <div style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: '28px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#111', marginBottom: 12 }}>
              決済は完了しました
            </div>
            <div style={{ fontSize: 15, color: '#555', lineHeight: 1.7 }}>
              {isSubscription ? 'プランは間もなく反映されます。' : 'ボーナス通数は間もなく反映されます。'}
              <br />しばらくしてからダッシュボードをご確認ください。
            </div>
          </div>
        )}

        <button
          onClick={() => router.replace('/dashboard')}
          style={{
            width: '100%',
            marginTop: 20,
            background: '#111',
            color: '#fff',
            border: '2px solid #111',
            boxShadow: '4px 4px 0 #555',
            padding: '14px 20px',
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: '0.06em',
            cursor: 'pointer',
            borderRadius: 0,
            fontFamily: 'inherit',
          }}
        >
          ダッシュボードに戻る
        </button>
      </div>
    </div>
  );
}
