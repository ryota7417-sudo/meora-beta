'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BottomNav } from '@/components/ui/BottomNav';
import { CharAvatar } from '@/components/ui/CharacterSvg';
import { loadState, saveState, removeCharacter, deleteChatHistory, AppState, Character } from '@/lib/store';
import { createClient } from '@/lib/supabase';
import { resolveAuth } from '@/lib/auth';
import type { User } from '@supabase/supabase-js';

type Purchase = {
  id: string;
  listing_id: string | null;
  amount: number;
  created_at: string;
  status: string;
  market_listings: {
    name: string;
    type: string;
    photo_url: string | null;
  } | null;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

export default function SettingsPage() {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [purchasesLoading, setPurchasesLoading] = useState(true);
  const [state, setLocalState] = useState<AppState | null>(null);

  useEffect(() => {
    setLocalState(loadState());
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const { promise, cancel } = resolveAuth(supabase, { graceMs: 1500 });

    let active = true;
    promise.then((loggedIn) => {
      if (!active) return;
      if (!loggedIn) {
        router.replace('/onboarding');
        return;
      }
      supabase.auth.getUser().then(({ data }) => setUser(data.user));
      supabase
        .from('purchases')
        .select('id, listing_id, amount, created_at, status, market_listings(name, type, photo_url)')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          setPurchases((data as unknown as Purchase[]) ?? []);
          setPurchasesLoading(false);
        });
    });

    return () => { active = false; cancel(); };
  }, [router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await createClient().auth.signOut();
    router.replace('/onboarding');
  };

  const handleReset = () => {
    if (!confirmed) {
      setConfirmed(true);
      return;
    }
    localStorage.clear();
    router.replace('/onboarding');
  };

  const handleDeleteCharacter = (charId: string, charName: string) => {
    if (!state) return;
    if (!confirm(`${charName} を削除しますか？この操作は取り消せません。`)) return;
    const newState = removeCharacter(state, charId);
    saveState(newState);
    deleteChatHistory(charId);
    setLocalState(newState);
  };

  const editable: Character[] = state
    ? state.characters.filter(c => c.userCreated).length > 0
      ? state.characters.filter(c => c.userCreated)
      : state.characters
    : [];

  const typeLabel = (type: string) =>
    type === 'character' ? 'MEORA' : type === 'food' ? 'アイテム' : 'スキン';

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 'calc(96px + env(safe-area-inset-bottom))' }}>
      <div style={{ background: '#111', color: '#fff', padding: '14px 20px' }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 900 }}>
          設定
        </h1>
      </div>

      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* 自分のMEORAを編集 */}
        <div className="card" style={{ padding: '20px 16px' }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 800 }}>自分のMEORAを編集</h2>
          <p style={{ margin: '0 0 14px', fontSize: 14, color: '#888', lineHeight: 1.6 }}>
            名前・写真・性格・口調を編集できます。
          </p>
          {editable.length === 0 ? (
            <div style={{ fontSize: 15, color: '#888', lineHeight: 1.7 }}>
              まだMEORAがいません。
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', border: '2px solid #111', boxShadow: '4px 4px 0 #111', background: '#fff' }}>
              {editable.map((char, i) => (
                <div
                  key={char.id}
                  onClick={() => router.push(`/character/edit/${char.id}`)}
                  style={{ display: 'flex', alignItems: 'center', padding: '12px 12px', gap: 11, cursor: 'pointer', borderBottom: i < editable.length - 1 ? '1px solid #ddd' : 'none' }}
                >
                  <div style={{ width: 40, height: 40, border: '2px solid #111', flexShrink: 0, background: '#f0f0ea', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <CharAvatar photo={char.photo} name={char.name} size={36} />
                  </div>
                  <span style={{ flex: 1, fontSize: 16, fontWeight: 800, color: '#111', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{char.name}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteCharacter(char.id, char.name); }}
                    style={{ flexShrink: 0, fontSize: 14, fontWeight: 800, background: '#fff', color: '#e53935', border: '2px solid #e53935', boxShadow: '2px 2px 0 #e53935', padding: '3px 8px', cursor: 'pointer', borderRadius: 0, fontFamily: 'inherit' }}
                  >
                    削除
                  </button>
                  <span style={{ flexShrink: 0, fontSize: 14, fontWeight: 800, color: '#111', background: '#f7f5f0', border: '2px solid #111', padding: '3px 8px' }}>編集 →</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* アカウント */}
        <div className="card" style={{ padding: '20px 16px' }}>
          <h2 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 800 }}>アカウント</h2>

          {/* ログイン中のアカウント表示 */}
          <div style={{ marginBottom: 14, padding: '12px', background: '#f7f5f0', border: '2px solid #111' }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', color: '#888', marginBottom: 4, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              ログイン中
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#111', wordBreak: 'break-all' }}>
              {user ? user.email : '読み込み中...'}
            </div>
            {user?.user_metadata?.full_name && (
              <div style={{ fontSize: 14, color: '#666', marginTop: 2 }}>
                {user.user_metadata.full_name}
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              width: '100%',
              padding: '12px',
              background: '#fff',
              color: '#111',
              border: '2px solid #111',
              boxShadow: loggingOut ? 'none' : '3px 3px 0 #111',
              fontWeight: 800,
              fontSize: 16,
              cursor: loggingOut ? 'not-allowed' : 'pointer',
              opacity: loggingOut ? 0.6 : 1,
              transition: 'all 0.1s',
            }}
          >
            {loggingOut ? 'ログアウト中...' : 'ログアウト'}
          </button>
        </div>

        {/* 購入履歴 */}
        <div className="card" style={{ padding: '20px 16px' }}>
          <h2 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 800 }}>購入履歴</h2>

          {purchasesLoading ? (
            <div style={{ fontSize: 15, color: '#888', padding: '12px 0' }}>読み込み中...</div>
          ) : purchases.length === 0 ? (
            <div style={{ fontSize: 15, color: '#888', lineHeight: 1.7, padding: '12px 0', textAlign: 'center' }}>
              まだ購入履歴がありません
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', border: '2px solid #111', boxShadow: '4px 4px 0 #111', background: '#fff' }}>
              {purchases.map((p, i) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 12px',
                    gap: 11,
                    borderBottom: i < purchases.length - 1 ? '1px solid #ddd' : 'none',
                  }}
                >
                  {/* アイテム写真 */}
                  <div style={{ width: 40, height: 40, border: '2px solid #111', flexShrink: 0, background: '#f0f0ea', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {p.market_listings?.photo_url ? (
                      <img src={p.market_listings.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                    )}
                  </div>
                  {/* 名前 + 種別 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.market_listings?.name ?? (p.amount === 980 ? 'ぶどう' : p.amount === 480 ? 'みかん' : p.amount === 290 ? 'さくらんぼ' : 'アイテム')}
                    </div>
                    <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>
                      {p.market_listings ? typeLabel(p.market_listings.type) : 'アイテム'} · {formatDate(p.created_at)}
                    </div>
                  </div>
                  {/* 金額 */}
                  <div style={{ flexShrink: 0, fontSize: 16, fontWeight: 800, color: '#111', fontFamily: 'var(--font-mono)' }}>
                    ¥{p.amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* アプリについて */}
        <div className="card" style={{ padding: '20px 16px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 17, fontWeight: 800 }}>アプリについて</h2>
          <div style={{ fontSize: 15, color: '#555', lineHeight: 1.8 }}>
            <div>バージョン: 0.1.0</div>
            <div>MEORA — いつもそばに。僕と過ごすAI。</div>
          </div>
        </div>

        {/* 法令情報 */}
        <div className="card" style={{ padding: '20px 16px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 17, fontWeight: 800 }}>法令情報</h2>
          <div style={{ display: 'flex', flexDirection: 'column', border: '2px solid #111', boxShadow: '4px 4px 0 #111', background: '#fff' }}>
            {[
              { href: '/legal/terms', label: '利用規約' },
              { href: '/legal/privacy', label: 'プライバシーポリシー' },
              { href: '/legal/commerce', label: '特定商取引法に基づく表示' },
            ].map((item, i) => (
              <div
                key={item.href}
                onClick={() => router.push(item.href)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 12px', cursor: 'pointer',
                  borderBottom: i < 2 ? '1px solid #ddd' : 'none',
                }}
              >
                <span style={{ fontSize: 15, fontWeight: 800 }}>{item.label}</span>
                <span style={{ color: '#bbb', fontSize: 18, fontWeight: 800 }}>›</span>
              </div>
            ))}
          </div>
        </div>

        {/* お問い合わせ・フィードバック */}
        <div className="card" style={{ padding: '20px 16px' }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 800 }}>フィードバック・お問い合わせ</h2>
          <p style={{ margin: '0 0 14px', fontSize: 14, color: '#888', lineHeight: 1.6 }}>
            ご意見・ご要望・バグ報告をお聞かせください。より良いMEORAを作るためにお役立てします。
          </p>
          <a
            href="https://forms.gle/DfRvTLBLVJwH3Eog6"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              textAlign: 'center',
              background: '#111',
              color: '#fff',
              border: '2px solid #111',
              boxShadow: '3px 3px 0 #555',
              fontWeight: 800,
              fontSize: 15,
              padding: '12px',
              textDecoration: 'none',
              letterSpacing: '0.02em',
              marginBottom: 10,
            }}
          >
            フィードバックを送る
          </a>
          <a
            href="mailto:info@aritude.com"
            style={{
              display: 'block',
              textAlign: 'center',
              background: '#fff',
              color: '#111',
              border: '2px solid #111',
              boxShadow: '3px 3px 0 #111',
              fontWeight: 800,
              fontSize: 14,
              padding: '10px',
              textDecoration: 'none',
              letterSpacing: '0.02em',
            }}
          >
            メールで問い合わせる（info@aritude.com）
          </a>
        </div>

        {/* データ管理 */}
        <div className="card" style={{ padding: '20px 16px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 17, fontWeight: 800 }}>データ管理</h2>
          <p style={{ margin: '0 0 16px', fontSize: 15, color: '#555', lineHeight: 1.6 }}>
            全てのデータをリセットしてオンボーディングからやり直します。
          </p>
          <button
            onClick={handleReset}
            style={{
              width: '100%',
              padding: '12px',
              background: confirmed ? '#e53935' : '#fff',
              color: confirmed ? '#fff' : '#e53935',
              border: '2px solid #e53935',
              boxShadow: confirmed ? 'none' : '3px 3px 0 #e53935',
              fontWeight: 800,
              fontSize: 16,
              cursor: 'pointer',
              transition: 'all 0.1s',
            }}
          >
            {confirmed ? '本当にリセット（クリックで実行）' : 'データをリセット'}
          </button>
          {confirmed && (
            <p style={{ margin: '8px 0 0', fontSize: 14, color: '#e53935', fontWeight: 600 }}>
              この操作は取り消せません
            </p>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
