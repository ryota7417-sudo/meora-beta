'use client';
import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CharAvatar } from '@/components/ui/CharacterSvg';
import { ComingSoonToast } from '@/components/ui/ComingSoonToast';
import { loadState, saveState, acquireCharacter, isCharacterOwned } from '@/lib/store';
import { getMarketCharacter, getMarketCreator } from '@/lib/market-data';
import { GiftIcon, HeartIcon, StatusDotIcon, CheckIcon } from '@/components/ui/Icons';

const PAPER_BG = {
  backgroundColor: '#f7f5f0',
  backgroundImage: `
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E"),
    repeating-linear-gradient(to right, rgba(0,0,0,0.14) 0px, rgba(0,0,0,0.14) 1px, transparent 1px, transparent 25px),
    repeating-linear-gradient(to bottom, rgba(0,0,0,0.14) 0px, rgba(0,0,0,0.14) 1px, transparent 1px, transparent 25px),
    repeating-linear-gradient(to right, rgba(0,0,0,0.07) 0px, rgba(0,0,0,0.07) 1px, transparent 1px, transparent 5px),
    repeating-linear-gradient(to bottom, rgba(0,0,0,0.07) 0px, rgba(0,0,0,0.07) 1px, transparent 1px, transparent 5px)
  `,
} as const;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: '#7a746c', textTransform: 'uppercase', padding: '18px 16px 8px', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)' }}>
      {children}
      <span style={{ flex: 1, height: 1, background: '#cfcabf' }} />
    </div>
  );
}

export default function MarketCharacterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const char = getMarketCharacter(id);
  const creator = char ? getMarketCreator(char.creatorId) : undefined;

  const [owned, setOwned] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!char) return;
    // localStorage（外部ソース）からの初期同期。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOwned(isCharacterOwned(loadState(), char.id));
  }, [char]);

  if (!char) {
    return (
      <div style={{ ...PAPER_BG, minHeight: '100vh', maxWidth: 390, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, color: '#111', padding: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 800 }}>このキャラは見つかりませんでした。</div>
        <button
          onClick={() => router.push('/market')}
          style={{ background: '#111', color: '#fff', border: '2px solid #111', boxShadow: '3px 3px 0 #555', fontSize: 13, fontWeight: 800, padding: '10px 18px', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          マーケットへ戻る
        </button>
      </div>
    );
  }

  // メインCTA: 入手して話す（実機能）。入手済みならそのまま /chat へ。
  const handleTalk = () => {
    const state = loadState();
    if (!isCharacterOwned(state, char.id)) {
      saveState(acquireCharacter(state, char));
    }
    router.push(`/chat/${char.id}`);
  };

  const isFree = char.accessTier === 'free';

  return (
    <div style={{ ...PAPER_BG, minHeight: '100vh', maxWidth: 390, margin: '0 auto', paddingBottom: 'calc(168px + env(safe-area-inset-bottom))', color: '#111' }}>
      {/* TOPBAR */}
      <div style={{ background: '#111', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 100 }}>
        <button
          onClick={() => router.back()}
          style={{ fontSize: 12, fontWeight: 700, color: '#fff', border: '2px solid #fff', padding: '4px 9px', background: 'transparent', cursor: 'pointer', borderRadius: 0, fontFamily: 'inherit' }}
        >
          ←
        </button>
        <span style={{ color: '#f7f5f0', fontSize: 12, letterSpacing: '0.12em', fontFamily: 'var(--font-mono)' }}>CHARACTER</span>
      </div>

      {/* HERO */}
      <div style={{ margin: '14px 14px 0', background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', textAlign: 'center', padding: '18px 16px 16px' }}>
        <div style={{ width: 108, height: 108, border: '2px solid #111', boxShadow: '4px 4px 0 #111', background: char.iconBg, margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <CharAvatar name={char.name} size={108} />
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>{char.name}</div>
        <div style={{ fontSize: 13, color: '#3a3530', marginTop: 6, lineHeight: 1.5 }}>
          {char.catchphrase}
          <br />
          {char.tagline}
        </div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 10, flexWrap: 'wrap' }}>
          {char.tags.map((t) => (
            <span key={t} style={{ fontSize: 10, fontWeight: 700, color: '#e8568a', background: '#fce4ee', border: '1.5px solid #e8568a', padding: '2px 8px' }}>
              #{t}
            </span>
          ))}
        </div>
        {creator && (
          <div
            onClick={() => router.push(`/market/shop/${creator.id}`)}
            style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 7, border: '2px solid #111', padding: '5px 10px', cursor: 'pointer', background: '#f7f5f0' }}
          >
            <div style={{ width: 22, height: 22, border: '1.5px solid #111', overflow: 'hidden', flexShrink: 0, background: creator.avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CharAvatar name={creator.name} size={22} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 800 }}>{creator.name}</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#7a746c' }}>お店へ ›</span>
          </div>
        )}
      </div>

      {/* ABOUT */}
      <SectionLabel>ABOUT</SectionLabel>
      <div style={{ margin: '0 14px', background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: 14, fontSize: 13, color: '#3a3530', lineHeight: 1.6 }}>
        <b style={{ color: '#111' }}>性格:</b> {char.intro.personality}
        <br />
        <b style={{ color: '#111' }}>口調:</b> {char.intro.tone}
        <br />
        <b style={{ color: '#111' }}>得意な話題:</b> {char.intro.topics}
      </div>

      {/* FREE */}
      <SectionLabel>FREE — 無料で話せる範囲</SectionLabel>
      <div style={{ margin: '0 14px', background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111' }}>
        <div style={{ padding: '10px 14px', borderBottom: '2px solid #111', fontSize: 12, fontWeight: 800, letterSpacing: '0.04em', background: '#3db33d', color: '#fff', display: 'flex', alignItems: 'center', gap: 7 }}>
          <StatusDotIcon size={14} color="#fff" />
          無料プランでできること
        </div>
        <div style={{ padding: '12px 14px' }}>
          {char.freePoints.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, fontWeight: 600, marginBottom: i === char.freePoints.length - 1 ? 0 : 7, alignItems: 'flex-start', lineHeight: 1.45 }}>
              <CheckIcon size={14} color="#3db33d" style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{p}</span>
            </div>
          ))}
          <div style={{ marginTop: 10, fontSize: 10, color: '#7a746c', lineHeight: 1.5 }}>
            ※ 入手すると、まずは無料でこのコと話せます。お腹がすいたら毎朝のお食事（HP回復）を待ってね。
          </div>
        </div>
      </div>

      {/* SUBSCRIBE（スタブ） */}
      <SectionLabel>SUBSCRIBE — 加入で毎月届く</SectionLabel>
      <div style={{ margin: '0 14px', background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111' }}>
        <div style={{ padding: '10px 14px', borderBottom: '2px solid #111', fontSize: 12, fontWeight: 800, letterSpacing: '0.04em', background: '#e8568a', color: '#fff', display: 'flex', alignItems: 'center', gap: 7 }}>
          <GiftIcon size={15} color="#fff" />
          加入すると毎月これが届く
        </div>
        <div style={{ padding: '12px 14px' }}>
          <p style={{ fontSize: 10, fontWeight: 800, color: '#7a746c', marginBottom: 9, letterSpacing: '0.02em' }}>
            サブスクは「月額金額相当のアイテムを毎月お届けする前払い型」です。
          </p>
          {char.subPoints.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, fontWeight: 600, marginBottom: 7, alignItems: 'flex-start', lineHeight: 1.45 }}>
              <span
                style={{
                  fontSize: 8,
                  fontWeight: 800,
                  border: '1.5px solid',
                  borderColor: p.kind === 'consume' ? '#111' : '#e8568a',
                  background: p.kind === 'consume' ? '#f5a623' : '#fce4ee',
                  color: p.kind === 'consume' ? '#111' : '#e8568a',
                  padding: '1px 5px',
                  flexShrink: 0,
                  marginTop: 1,
                  letterSpacing: '0.04em',
                }}
              >
                {p.kind === 'consume' ? '消費型' : 'スキン'}
              </span>
              <span>{p.text}</span>
            </div>
          ))}
          <p style={{ fontSize: 9, color: '#7a746c', lineHeight: 1.5, marginTop: 9, borderTop: '1px solid #eee', paddingTop: 8 }}>
            ※ 付与内容はクリエイターが設定。消費型（おにぎり）の毎月の付与数には上限があります（上限は要検討）。
          </p>
        </div>
        <button
          onClick={() => setToast('サブスク加入は近日対応予定です。今は無料で話せます！')}
          style={{ display: 'block', width: '100%', background: '#e8568a', color: '#fff', border: 'none', borderTop: '2px solid #111', fontSize: 13, fontWeight: 800, padding: '11px 0', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          加入して毎月うけとる →
        </button>
      </div>

      {/* RELATED ITEMS（スタブ） */}
      {char.items.length > 0 && (
        <>
          <SectionLabel>RELATED ITEMS — 関連アイテム</SectionLabel>
          <div style={{ margin: '0 14px', border: '2px solid #111', boxShadow: '4px 4px 0 #111', background: '#fff' }}>
            {char.items.map((item, i) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderBottom: i === char.items.length - 1 ? 'none' : '1px solid #ddd' }}>
                <div style={{ width: 38, height: 38, border: '2px solid #111', flexShrink: 0, background: '#fce4ee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><GiftIcon size={20} color="#111" /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800 }}>{item.name}</div>
                  <div style={{ fontSize: 10, color: '#7a746c', marginTop: 1 }}>{item.desc}</div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 800, flexShrink: 0 }}>¥{item.price}</span>
                <button
                  onClick={() => setToast('アイテム購入は近日対応予定です。')}
                  style={{ flexShrink: 0, background: '#111', color: '#fff', border: '2px solid #111', boxShadow: '2px 2px 0 #555', fontSize: 11, fontWeight: 800, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  購入
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* STICKY CTA FOOTER */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 390, background: '#fff', borderTop: '2px solid #111', padding: '10px 14px calc(10px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 8, zIndex: 200 }}>
        <button
          onClick={handleTalk}
          style={{ background: '#111', color: '#fff', border: '2px solid #111', boxShadow: '3px 3px 0 #555', fontSize: 15, fontWeight: 800, padding: '13px 0', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 0 }}
        >
          {owned ? '話す →' : isFree ? '無料で話す →' : '入手して話す →'}
        </button>
        <button
          onClick={() => setToast('サブスク加入は近日対応予定です。今は無料で話せます！')}
          style={{ background: '#fff', color: '#e8568a', border: '2px solid #e8568a', fontSize: 12, fontWeight: 800, padding: '9px 0', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 0 }}
        >
          加入で毎月うけとる ¥{char.subPrice}/月
        </button>
        <button
          onClick={() => setToast('投げ銭（応援）は近日対応予定です。')}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 11, fontWeight: 800, color: '#e8568a', background: 'transparent', border: 'none', padding: '2px 0 0', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <HeartIcon size={13} color="#e8568a" />
          このコを作ったクリエイターを応援する（投げ銭）
        </button>
      </div>

      <ComingSoonToast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}
