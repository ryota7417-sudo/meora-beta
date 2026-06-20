'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BottomNav } from '@/components/ui/BottomNav';
import { CharAvatar } from '@/components/ui/CharacterSvg';
import { loadState, saveState, removeCharacter, deleteChatHistory, AppState, Character } from '@/lib/store';
import { createClient } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

type Purchase = {
  id: string;
  listing_id: string;
  amount: number;
  created_at: string;
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
  const [state, setLocalState] = useState<AppState | null>(() => loadState());

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    supabase
      .from('purchases')
      .select('id, listing_id, amount, created_at, market_listings(name, type, photo_url)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setPurchases((data as unknown as Purchase[]) ?? []);
        setPurchasesLoading(false);
      });
  }, []);

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
    type === 'character' ? 'MEORA' : type === 'food' ? 'お食事' : 'スキン';

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 'calc(96px + env(safe-area-inset-bottom))' }}>
      <div style={{ background: '#111', color: '#fff', padding: '14px 20px' }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 900 }}>
          設定
        </h1>
      </div>

      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* 自分のMEORAを編集 */}
        <div className="card" style={{ padding: '20px 16px' }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 800 }}>自分のMEORAを編集</h2>
          <p style={{ margin: '0 0 14px', fontSize: 12, color: '#888', lineHeight: 1.6 }}>
            名前・写真・性格・口調を編集できます。
          </p>
          {editable.length === 0 ? (
            <div style={{ fontSize: 13, color: '#888', lineHeight: 1.7 }}>
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
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 800, color: '#111', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{char.name}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteCharacter(char.id, char.name); }}
                    style={{ flexShrink: 0, fontSize: 12, fontWeight: 800, background: '#fff', color: '#e53935', border: '2px solid #e53935', boxShadow: '2px 2px 0 #e53935', padding: '3px 8px', cursor: 'pointer', borderRadius: 0, fontFamily: 'inherit' }}
                  >
                    削除
                  </button>
                  <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 800, color: '#111', background: '#f7f5f0', border: '2px solid #111', padding: '3px 8px' }}>編集 →</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* アカウント */}
        <div className="card" style={{ padding: '20px 16px' }}>
          <h2 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 800 }}>アカウント</h2>

          {/* ログイン中のアカウント表示 */}
          <div style={{ marginBottom: 14, padding: '12px', background: '#f7f5f0', border: '2px solid #111' }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: '#888', marginBottom: 4, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              ログイン中
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#111', wordBreak: 'break-all' }}>
              {user ? user.email : '読み込み中...'}
            </div>
            {user?.user_metadata?.full_name && (
              <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
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
              fontSize: 14,
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
          <h2 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 800 }}>購入履歴</h2>

          {purchasesLoading ? (
            <div style={{ fontSize: 13, color: '#888', padding: '12px 0' }}>読み込み中...</div>
          ) : purchases.length === 0 ? (
            <div style={{ fontSize: 13, color: '#888', lineHeight: 1.7, padding: '12px 0', textAlign: 'center' }}>
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
                      <span style={{ fontSize: 18 }}>🛍</span>
                    )}
                  </div>
                  {/* 名前 + 種別 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.market_listings?.name ?? 'アイテム'}
                    </div>
                    <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                      {p.market_listings ? typeLabel(p.market_listings.type) : ''} · {formatDate(p.created_at)}
                    </div>
                  </div>
                  {/* 金額 */}
                  <div style={{ flexShrink: 0, fontSize: 14, fontWeight: 800, color: '#111', fontFamily: 'var(--font-mono)' }}>
                    ¥{p.amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* アプリについて */}
        <div className="card" style={{ padding: '20px 16px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800 }}>アプリについて</h2>
          <div style={{ fontSize: 13, color: '#555', lineHeight: 1.8 }}>
            <div>バージョン: 0.1.0</div>
            <div>MEORA — いつもそばに。僕と過ごすAI。</div>
          </div>
        </div>

        {/* データ管理 */}
        <div className="card" style={{ padding: '20px 16px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800 }}>データ管理</h2>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#555', lineHeight: 1.6 }}>
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
              fontSize: 14,
              cursor: 'pointer',
              transition: 'all 0.1s',
            }}
          >
            {confirmed ? '本当にリセット（クリックで実行）' : 'データをリセット'}
          </button>
          {confirmed && (
            <p style={{ margin: '8px 0 0', fontSize: 12, color: '#e53935', fontWeight: 600 }}>
              この操作は取り消せません
            </p>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
