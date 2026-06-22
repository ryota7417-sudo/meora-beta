'use client';
import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BottomNav } from '@/components/ui/BottomNav';
import { CharAvatar } from '@/components/ui/CharacterSvg';
import { ComingSoonToast } from '@/components/ui/ComingSoonToast';
import { getMarketCreator, getCharactersByCreator } from '@/lib/market-data';
import { HeartIcon, StarIcon } from '@/components/ui/Icons';

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
    <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.14em', color: '#7a746c', textTransform: 'uppercase', padding: '18px 16px 8px', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)' }}>
      {children}
      <span style={{ flex: 1, height: 1, background: '#cfcabf' }} />
    </div>
  );
}

export default function MarketShopPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const creator = getMarketCreator(id);
  const characters = creator ? getCharactersByCreator(creator.id) : [];

  const [following, setFollowing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showOshiModal, setShowOshiModal] = useState(false);
  const [oshiSet, setOshiSet] = useState(false);
  const [joinedPlan, setJoinedPlan] = useState(false);
  const [tipSheetOpen, setTipSheetOpen] = useState(false);

  if (!creator) {
    return (
      <div style={{ ...PAPER_BG, minHeight: '100vh', maxWidth: 390, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, color: '#111', padding: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 800 }}>このお店は見つかりませんでした。</div>
        <button
          onClick={() => router.push('/market')}
          style={{ background: '#111', color: '#fff', border: '2px solid #111', boxShadow: '3px 3px 0 #555', fontSize: 15, fontWeight: 800, padding: '10px 18px', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          マーケットへ戻る
        </button>
      </div>
    );
  }

  return (
    <div style={{ ...PAPER_BG, minHeight: '100vh', maxWidth: 390, margin: '0 auto', paddingBottom: 'calc(96px + env(safe-area-inset-bottom))', color: '#111' }}>
      {/* TOPBAR */}
      <div style={{ background: '#111', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 100 }}>
        <button
          onClick={() => router.back()}
          style={{ fontSize: 14, fontWeight: 700, color: '#fff', border: '2px solid #fff', padding: '4px 9px', background: 'transparent', cursor: 'pointer', borderRadius: 0, fontFamily: 'inherit' }}
        >
          ←
        </button>
        <span style={{ color: '#f7f5f0', fontSize: 14, letterSpacing: '0.12em', fontFamily: 'var(--font-mono)' }}>SHOP</span>
      </div>

      {/* SHOP HEADER */}
      <div style={{ margin: '14px 14px 0', background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111' }}>
        <div style={{ background: creator.bannerBg, borderBottom: '2px solid #111', height: 54, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 12px' }}>
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '0.14em', color: '#111', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
            {creator.storeName}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12, padding: '0 14px 14px', marginTop: -26 }}>
          <div style={{ width: 64, height: 64, border: '2px solid #111', boxShadow: '3px 3px 0 #111', background: creator.avatarBg, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <img src={creator.avatarUrl || '/characters/market_creator_default.png'} alt={creator.name} width={64} height={64} style={{ objectFit: 'cover' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0, paddingTop: 30 }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{creator.name}</div>
            <div style={{ fontSize: 13, color: '#7a746c', marginTop: 1 }}>{creator.handle}</div>
            <div style={{ display: 'flex', gap: 14, marginTop: 6 }}>
              <div>
                <b style={{ fontSize: 15, fontWeight: 800 }}>{creator.followers}</b>
                <span style={{ fontSize: 11, color: '#7a746c', display: 'block' }}>フォロワー</span>
              </div>
              <div>
                <b style={{ fontSize: 15, fontWeight: 800 }}>{characters.length}</b>
                <span style={{ fontSize: 11, color: '#7a746c', display: 'block' }}>MEORA</span>
              </div>
            </div>
          </div>
        </div>
        <div style={{ padding: '0 14px 12px', fontSize: 14, color: '#3a3530', lineHeight: 1.5 }}>{creator.bio}</div>
        <div style={{ display: 'flex', gap: 8, padding: '0 14px 14px' }}>
          <button
            onClick={() => setFollowing((f) => !f)}
            style={{
              flex: 1,
              fontSize: 14,
              fontWeight: 800,
              padding: '9px 0',
              cursor: 'pointer',
              border: '2px solid #111',
              boxShadow: '3px 3px 0 #111',
              background: following ? '#111' : '#fff',
              color: following ? '#fff' : '#111',
              fontFamily: 'inherit',
              borderRadius: 0,
            }}
          >
            {following ? 'フォロー中' : '＋ フォロー'}
          </button>
          {following && joinedPlan && (
            oshiSet ? (
              <span
                style={{ flex: 1, fontSize: 14, fontWeight: 800, padding: '9px 0', border: '2px solid #e8568a', boxShadow: '3px 3px 0 #e8568a', background: '#fce4ee', color: '#e8568a', fontFamily: 'inherit', borderRadius: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <StarIcon size={14} color="#e8568a" />
                推し設定中
              </span>
            ) : (
              <button
                onClick={() => setShowOshiModal(true)}
                style={{ flex: 1, fontSize: 14, fontWeight: 800, padding: '9px 0', cursor: 'pointer', border: '2px solid #e8568a', boxShadow: '3px 3px 0 #e8568a', background: '#fff', color: '#e8568a', fontFamily: 'inherit', borderRadius: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <StarIcon size={14} color="#e8568a" />
                推し
              </button>
            )
          )}
          <button
            onClick={() => setTipSheetOpen(true)}
            style={{ flex: 1, fontSize: 14, fontWeight: 800, padding: '9px 0', cursor: 'pointer', border: '2px solid #111', boxShadow: '3px 3px 0 #111', background: '#e8568a', color: '#fff', fontFamily: 'inherit', borderRadius: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <HeartIcon size={14} color="#fff" />
            投げ銭
          </button>
        </div>
      </div>

      {/* CHARACTERS */}
      <SectionLabel>CHARACTERS — 扱うMEORA</SectionLabel>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '8px 14px 4px', scrollbarWidth: 'none' }}>
        {characters.map((char) => (
            <div
              key={char.id}
              onClick={() => router.push(`/market/character/${char.id}`)}
              style={{ flexShrink: 0, width: 104, background: '#fff', border: '2px solid #111', boxShadow: '3px 3px 0 #111', cursor: 'pointer' }}
            >
              <div style={{ height: 82, borderBottom: '2px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'center', background: char.iconBg, overflow: 'hidden' }}>
                {char.photoUrl ? (
                  <img src={char.photoUrl} alt={char.name} style={{ width: 56, height: 56, objectFit: 'contain' }} />
                ) : (
                  <CharAvatar name={char.name} size={56} />
                )}
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, padding: '6px 8px 8px' }}>{char.name}</div>
            </div>
          ))}
      </div>

      {/* SUBSCRIPTION PLANS（スタブ） */}
      <SectionLabel>月額プラン</SectionLabel>
      {creator.plans.map((plan) => (
        <div
          key={plan.id}
          style={{ margin: '0 14px 12px', background: '#fff', border: '2px solid #111', boxShadow: plan.joined ? '4px 4px 0 #e8568a' : '4px 4px 0 #111' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '2px solid #111', background: plan.joined ? '#e8568a' : '#111', color: '#fff' }}>
            <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '0.04em' }}>{plan.name}</span>
            <span style={{ fontSize: 18, fontWeight: 800 }}>
              ¥{plan.price}
              <small style={{ fontSize: 12, fontWeight: 600, color: plan.joined ? '#ffd8e8' : '#bbb' }}>/月</small>
            </span>
          </div>
          <div style={{ padding: '12px 14px' }}>
            <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.04em', color: '#7a746c', marginBottom: 9 }}>
              {plan.joined ? '毎月うけとっている内容' : '加入すると、毎月この内容が届きます'}
            </p>
            {plan.perks.map((perk, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, fontSize: 14, fontWeight: 600, marginBottom: 8, alignItems: 'flex-start', lineHeight: 1.45 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    border: '1.5px solid',
                    borderColor: perk.kind === 'consume' ? '#111' : '#e8568a',
                    background: perk.kind === 'consume' ? '#f5a623' : '#fce4ee',
                    color: perk.kind === 'consume' ? '#111' : '#e8568a',
                    padding: '1px 5px',
                    flexShrink: 0,
                    marginTop: 1,
                    letterSpacing: '0.04em',
                  }}
                >
                  {perk.kind === 'consume' ? '消費型' : 'スキン'}
                </span>
                <span>{perk.text}</span>
              </div>
            ))}
            {plan.joined ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', marginTop: 8, background: '#fce4ee', color: '#e8568a', border: '2px solid #e8568a', fontSize: 14, fontWeight: 800, padding: '10px 0', textAlign: 'center' }}>
                <StarIcon size={14} color="#e8568a" />
                加入中
              </span>
            ) : (
              <button
                onClick={() => { setJoinedPlan(true); setToast('月額プラン加入（デモ）を反映しました。'); }}
                style={{ display: 'block', width: '100%', marginTop: 8, background: '#e8568a', color: '#fff', border: '2px solid #111', boxShadow: '3px 3px 0 #111', fontSize: 15, fontWeight: 800, padding: '10px 0', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 0 }}
              >
                加入して毎月うけとる →
              </button>
            )}
          </div>
        </div>
      ))}

      {/* ITEMS（スタブ） */}
      {creator.items.length > 0 && (
        <>
          <SectionLabel>ITEMS — アイテム</SectionLabel>
          <div style={{ margin: '0 14px', border: '2px solid #111', boxShadow: '4px 4px 0 #111', background: '#fff' }}>
            {creator.items.map((item, i) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderBottom: i === creator.items.length - 1 ? 'none' : '1px solid #ddd' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800 }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: '#7a746c', marginTop: 1, lineHeight: 1.4 }}>{item.desc}</div>
                </div>
                <span style={{ fontSize: 15, fontWeight: 800, flexShrink: 0 }}>¥{item.price}</span>
                {item.owned ? (
                  <span style={{ flexShrink: 0, background: '#eee', color: '#999', border: '2px solid #ccc', fontSize: 13, fontWeight: 800, padding: '6px 12px' }}>購入済み</span>
                ) : (
                  <button
                    onClick={() => setToast('アイテム購入は近日対応予定です。')}
                    style={{ flexShrink: 0, background: '#111', color: '#fff', border: '2px solid #111', boxShadow: '2px 2px 0 #555', fontSize: 13, fontWeight: 800, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    購入
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <p style={{ margin: '12px 16px 0', fontSize: 11, color: '#7a746c', lineHeight: 1.5 }}>
        ※ 月額プランは「月額金額相当のアイテムを毎月お届けする前払い型」です。
      </p>

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
              {[300, 600, 900, 1500, 3000, 5000, 10000].map((amount) => (
                <button
                  key={amount}
                  onClick={() => { setTipSheetOpen(false); setToast(`¥${amount.toLocaleString()}の投げ銭は近日対応予定です。`); }}
                  style={{ flex: '0 0 calc(33.33% - 6px)', background: '#fff', border: '2px solid #e8568a', boxShadow: '3px 3px 0 #e8568a', fontSize: 15, fontWeight: 800, padding: '12px 0', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 0, color: '#e8568a' }}
                >
                  ¥{amount.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
          <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
        </div>
      )}

      {showOshiModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', padding: 20 }}>
          <div style={{ width: 'min(340px, 100%)', padding: 24, background: '#f7f5f0', border: '2px solid #111', boxShadow: '4px 4px 0 #111' }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>推しに設定しますか？</div>
            <p style={{ fontSize: 14, color: '#3a3530', marginTop: 12, lineHeight: 1.6 }}>この決定は毎月1回しか設定できません</p>
            <p style={{ fontSize: 13, color: '#7a746c', marginTop: 8, lineHeight: 1.5 }}>※推しに設定すると月額プランの一部が推しのクリエイターに振り込まれます。</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                onClick={() => { setOshiSet(true); setShowOshiModal(false); }}
                style={{ flex: 1, background: '#e8568a', color: '#fff', border: '2px solid #111', boxShadow: '3px 3px 0 #111', fontSize: 14, fontWeight: 800, padding: '10px 0', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 0 }}
              >
                推しに設定する
              </button>
              <button
                onClick={() => setShowOshiModal(false)}
                style={{ flex: 1, background: '#fff', color: '#111', border: '2px solid #111', boxShadow: '3px 3px 0 #111', fontSize: 14, fontWeight: 800, padding: '10px 0', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 0 }}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
      <ComingSoonToast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}
