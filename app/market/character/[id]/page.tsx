'use client';
import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CharAvatar } from '@/components/ui/CharacterSvg';
import { ComingSoonToast } from '@/components/ui/ComingSoonToast';
import { ReleaseSoonModal } from '@/components/ui/ReleaseSoonModal';
import { loadState, saveState, acquireCharacter, isCharacterOwned } from '@/lib/store';
import { getMarketCharacter, getMarketCreator, MARKET_SKIN_ITEMS } from '@/lib/market-data';
import { purchaseSkin, isSkinOwned, type OwnedSkin } from '@/lib/store';
import { GiftIcon, HeartIcon } from '@/components/ui/Icons';

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

const TIP_AMOUNTS = [300, 600, 900, 1500, 3000, 5000, 10000] as const;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.14em', color: '#7a746c', textTransform: 'uppercase', padding: '18px 16px 8px', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)' }}>
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
  const [tipSheetOpen, setTipSheetOpen] = useState(false);
  const [showReleaseSoon, setShowReleaseSoon] = useState(false);
  const processing = false;

  useEffect(() => {
    if (!char) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOwned(isCharacterOwned(loadState(), char.id));
  }, [char]);

  if (!char) {
    return (
      <div style={{ ...PAPER_BG, minHeight: '100vh', maxWidth: 390, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, color: '#111', padding: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 800 }}>このMEORAは見つかりませんでした。</div>
        <button
          onClick={() => router.push('/market')}
          style={{ background: '#111', color: '#fff', border: '2px solid #111', boxShadow: '3px 3px 0 #555', fontSize: 15, fontWeight: 800, padding: '10px 18px', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          マーケットへ戻る
        </button>
      </div>
    );
  }

  const handleTalk = () => {
    const state = loadState();
    if (!isCharacterOwned(state, char.id)) {
      saveState(acquireCharacter(state, char));
    }
    router.push(`/chat/${char.id}`);
  };

  const hasBuyPrice = char.buyPrice != null && char.buyPrice > 0;

  const handleBuy = () => {
    setToast('購入機能は近日対応予定です');
  };

  const handleTip = (_amount: number) => {
    setTipSheetOpen(false);
    setShowReleaseSoon(true);
  };

  return (
    <div style={{ ...PAPER_BG, minHeight: '100vh', maxWidth: 390, margin: '0 auto', paddingBottom: 'calc(168px + env(safe-area-inset-bottom))', color: '#111' }}>
      {/* TOPBAR */}
      <div style={{ background: '#111', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 100 }}>
        <button
          onClick={() => router.back()}
          style={{ fontSize: 14, fontWeight: 700, color: '#fff', border: '2px solid #fff', padding: '4px 9px', background: 'transparent', cursor: 'pointer', borderRadius: 0, fontFamily: 'inherit' }}
        >
          ←
        </button>
        <span style={{ color: '#f7f5f0', fontSize: 14, letterSpacing: '0.12em', fontFamily: 'var(--font-mono)' }}>CHARACTER</span>
      </div>

      {/* HERO */}
      <div style={{ margin: '14px 14px 0', background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', textAlign: 'center', padding: '18px 16px 16px' }}>
        <div style={{ width: 108, height: 108, border: '2px solid #111', boxShadow: '4px 4px 0 #111', background: char.iconBg, margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {char.photoUrl ? (
            <img src={char.photoUrl} alt={char.name} style={{ width: 108, height: 108, objectFit: 'contain', display: 'block' }} />
          ) : (
            <CharAvatar name={char.name} size={108} />
          )}
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>{char.name}</div>
        <div style={{ fontSize: 15, color: '#3a3530', marginTop: 6, lineHeight: 1.5 }}>
          {char.catchphrase}
          <br />
          {char.tagline}
        </div>
        {creator && (
          <div
            onClick={() => router.push(`/market/shop/${creator.id}`)}
            style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 7, border: '2px solid #111', padding: '5px 10px', cursor: 'pointer', background: '#f7f5f0' }}
          >
            <div style={{ width: 22, height: 22, border: '1.5px solid #111', overflow: 'hidden', flexShrink: 0, background: creator.avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={creator.avatarUrl || '/characters/market_creator_default.png'} alt={creator.name} width={22} height={22} style={{ objectFit: 'cover' }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 800 }}>{creator.name}</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#7a746c' }}>お店へ ›</span>
          </div>
        )}
      </div>

      {/* ABOUT */}
      <SectionLabel>ABOUT</SectionLabel>
      <div style={{ margin: '0 14px', background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: 14, fontSize: 15, color: '#3a3530', lineHeight: 1.6 }}>
        <b style={{ color: '#111' }}>性格:</b> {char.intro.personality}
        <br />
        <b style={{ color: '#111' }}>口調:</b> {char.intro.tone}
        <br />
        <b style={{ color: '#111' }}>得意な話題:</b> {char.intro.topics}
      </div>

      {/* RELATED ITEMS */}
      {char.items.length > 0 && (
        <>
          <SectionLabel>RELATED ITEMS</SectionLabel>
          <div style={{ margin: '0 14px', border: '2px solid #111', boxShadow: '4px 4px 0 #111', background: '#fff' }}>
            {char.items.map((item, i) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderBottom: i === char.items.length - 1 ? 'none' : '1px solid #ddd' }}>
                <div style={{ width: 38, height: 38, border: '2px solid #111', flexShrink: 0, background: '#fce4ee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><GiftIcon size={20} color="#111" /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800 }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: '#7a746c', marginTop: 1 }}>{item.desc}</div>
                </div>
                <span style={{ fontSize: 15, fontWeight: 800, flexShrink: 0 }}>¥{item.price}</span>
                <button
                  onClick={() => setToast('アイテム購入は近日対応予定です。')}
                  style={{ flexShrink: 0, background: '#111', color: '#fff', border: '2px solid #111', boxShadow: '2px 2px 0 #555', fontSize: 13, fontWeight: 800, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  購入
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* SKINS */}
      {(() => {
        const skins = MARKET_SKIN_ITEMS.filter(s => s.characterId === char.id);
        if (skins.length === 0) return null;
        return (
          <>
            <SectionLabel>SKINS</SectionLabel>
            <div style={{ margin: '0 14px', border: '2px solid #111', boxShadow: '4px 4px 0 #111', background: '#fff' }}>
              {skins.map((skin, i) => {
                const alreadyOwned = isSkinOwned(skin.id);
                return (
                  <div key={skin.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderBottom: i === skins.length - 1 ? 'none' : '1px solid #ddd' }}>
                    <div style={{ width: 48, height: 48, border: '2px solid #111', flexShrink: 0, background: '#f7f5f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {skin.photoUrl ? (
                        <img src={skin.photoUrl} alt={skin.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <GiftIcon size={20} color="#111" />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 800 }}>{skin.name}</div>
                      <div style={{ fontSize: 12, color: '#7a746c', marginTop: 1 }}>{skin.desc}</div>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 800, flexShrink: 0 }}>¥{skin.price}</span>
                    {alreadyOwned ? (
                      <span style={{ flexShrink: 0, background: '#eee', color: '#999', border: '2px solid #ccc', fontSize: 13, fontWeight: 800, padding: '6px 12px' }}>購入済み</span>
                    ) : (
                      <button
                        onClick={() => {
                          if (!skin.spriteUrl || !skin.slot) return;
                          const ownedSkin: OwnedSkin = { id: skin.id, name: skin.name, characterId: char.id, iconUrl: skin.photoUrl || '', spriteUrl: skin.spriteUrl, slot: skin.slot };
                          purchaseSkin(ownedSkin);
                          setToast(`${skin.name}を購入しました。トーク画面の「きせかえ」から着替えられます。`);
                        }}
                        style={{ flexShrink: 0, background: '#111', color: '#fff', border: '2px solid #111', boxShadow: '2px 2px 0 #555', fontSize: 13, fontWeight: 800, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        購入
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        );
      })()}

      {/* STICKY CTA FOOTER */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 390, background: '#fff', borderTop: '2px solid #111', padding: '10px 14px calc(10px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 8, zIndex: 200 }}>
        <button
          onClick={owned ? handleTalk : hasBuyPrice ? handleBuy : handleTalk}
          style={{ background: '#111', color: '#fff', border: '2px solid #111', boxShadow: '3px 3px 0 #555', fontSize: 17, fontWeight: 800, padding: '13px 0', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 0 }}
        >
          {owned ? '話す →' : hasBuyPrice ? `¥${char.buyPrice!.toLocaleString()} で購入する →` : '入手して話す →'}
        </button>
        <button
          onClick={() => setTipSheetOpen(true)}
          disabled={processing}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 13, fontWeight: 800, color: '#e8568a', background: 'transparent', border: 'none', padding: '2px 0 0', cursor: processing ? 'wait' : 'pointer', fontFamily: 'inherit' }}
        >
          <HeartIcon size={13} color="#e8568a" />
          このコを作ったクリエイターを応援する（投げ銭）
        </button>
      </div>

      {/* 投げ銭ボトムシート */}
      {tipSheetOpen && (
        <div
          onClick={() => setTipSheetOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 390, background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: '0 0 env(safe-area-inset-bottom)', animation: 'slideUp 0.2s ease-out' }}
          >
            <div style={{ padding: '14px 16px 10px', borderBottom: '2px solid #111', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 16, fontWeight: 800 }}>投げ銭（応援）</span>
              <button onClick={() => setTipSheetOpen(false)} style={{ fontSize: 14, fontWeight: 800, background: 'transparent', border: '2px solid #111', padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 0 }}>閉じる</button>
            </div>
            <div style={{ padding: '8px 16px 14px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {TIP_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  onClick={() => handleTip(amount)}
                  disabled={processing}
                  style={{ flex: '0 0 calc(33.33% - 6px)', background: '#fff', border: '2px solid #e8568a', boxShadow: '3px 3px 0 #e8568a', fontSize: 15, fontWeight: 800, padding: '12px 0', cursor: processing ? 'wait' : 'pointer', fontFamily: 'inherit', borderRadius: 0, color: '#e8568a', opacity: processing ? 0.5 : 1 }}
                >
                  ¥{amount.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
          <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
        </div>
      )}

      <ComingSoonToast message={toast} onClose={() => setToast(null)} />
      {showReleaseSoon && <ReleaseSoonModal onClose={() => setShowReleaseSoon(false)} />}
    </div>
  );
}
