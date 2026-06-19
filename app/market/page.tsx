'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BottomNav } from '@/components/ui/BottomNav';
import { CharAvatar } from '@/components/ui/CharacterSvg';
import {
  MARKET_CREATORS,
  PICKUP_CHARACTERS,
  RANKING_CHARACTERS,
  DEFAULT_FOOD_ITEMS,
  MARKET_SKIN_ITEMS,
  type MarketCharacter,
  type FoodItem,
  type MarketSkinItem,
} from '@/lib/market-data';
import { createClient } from '@/lib/supabase';

type DbListing = {
  id: string;
  creator_id: string;
  type: 'character' | 'food' | 'skin';
  name: string;
  description: string | null;
  price: number;
  photo_url: string | null;
  sprite_idle: string | null;
  hp_bonus: number | null;
  creator_profiles: { display_name: string } | null;
};

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

type TabType = 'character' | 'food' | 'skin';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: '#7a746c', textTransform: 'uppercase', padding: '18px 16px 8px', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)' }}>
      {children}
      <span style={{ flex: 1, height: 1, background: '#cfcabf' }} />
    </div>
  );
}

function CharacterIcon({ char, size }: { char: MarketCharacter; size: number }) {
  if (char.photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={char.photoUrl} alt={char.name} style={{ width: size, height: size, objectFit: 'contain', display: 'block' }} />
    );
  }
  return <CharAvatar name={char.name} size={size} />;
}

export default function MarketPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('character');
  const [dbListings, setDbListings] = useState<DbListing[]>([]);

  useEffect(() => {
    const supabase = createClient();

    const fetchListings = async () => {
      const { data } = await supabase
        .from('market_listings')
        .select('id, creator_id, type, name, description, price, photo_url, sprite_idle, hp_bonus, creator_profiles(display_name)')
        .eq('status', 'active')
        .order('sort_order', { ascending: true });
      if (data) setDbListings(data as unknown as DbListing[]);
    };

    fetchListings();

    // リアルタイム: クリエイターが出品したら即マーケットに反映
    const channel = supabase
      .channel('market_listings_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'market_listings' }, () => {
        fetchListings();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const dbChars   = dbListings.filter(l => l.type === 'character');
  const dbFoods   = dbListings.filter(l => l.type === 'food');
  const dbSkins   = dbListings.filter(l => l.type === 'skin');

  const goChar = (id: string) => router.push(`/market/character/${id}`);
  const goShop = (id: string) => router.push(`/market/shop/${id}`);

  const tabs: { key: TabType; label: string }[] = [
    { key: 'character', label: 'MEORA' },
    { key: 'food',      label: 'お食事' },
    { key: 'skin',      label: 'スキン' },
  ];

  return (
    <div style={{ ...PAPER_BG, minHeight: '100vh', maxWidth: 390, margin: '0 auto', paddingBottom: 'calc(96px + env(safe-area-inset-bottom))', color: '#111' }}>
      {/* HEADER */}
      <div style={{ background: '#111', padding: '11px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, borderBottom: '2px solid #111' }}>
        <span style={{ color: '#f7f5f0', fontSize: 13, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'var(--font-display)' }}>
          MEORA MARKET
        </span>
        <span style={{ background: '#e8568a', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 7px', border: '1.5px solid #fff', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>
          BETA
        </span>
      </div>

      {/* SEARCH */}
      <div style={{ padding: '14px 14px 6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: '10px 12px' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5" stroke="#111" strokeWidth="2" />
            <path d="M11 11L15 15" stroke="#111" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            placeholder="MEORA・お店・タグで探す"
            style={{ border: 'none', outline: 'none', flex: 1, fontSize: 13, fontFamily: 'inherit', background: 'transparent', color: '#111' }}
          />
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', padding: '10px 14px 0', gap: 0, borderBottom: '2px solid #111' }}>
        {tabs.map(tab => {
          const on = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                padding: '10px 0',
                fontSize: 13,
                fontWeight: 800,
                fontFamily: 'inherit',
                background: on ? '#111' : '#fff',
                color: on ? '#fff' : '#111',
                border: '2px solid #111',
                borderBottom: on ? '2px solid #111' : '2px solid #111',
                cursor: 'pointer',
                borderRadius: 0,
                letterSpacing: '0.04em',
                marginRight: -2,
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ===== TAB: MEORA ===== */}
      {activeTab === 'character' && (
        <>
          {/* PICK UP */}
          <SectionLabel>PICK UP</SectionLabel>
          <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {PICKUP_CHARACTERS.map((char) => (
              <PickupCard key={char.id} char={char} onClick={() => goChar(char.id)} />
            ))}
          </div>

          {/* POPULAR CREATORS */}
          <SectionLabel>POPULAR CREATORS</SectionLabel>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '8px 14px 4px', scrollbarWidth: 'none' }}>
            {MARKET_CREATORS.map((creator) => (
              <div key={creator.id} onClick={() => goShop(creator.id)} style={{ flexShrink: 0, width: 96, textAlign: 'center', cursor: 'pointer' }}>
                <div style={{ width: 64, height: 64, border: '2px solid #111', boxShadow: '3px 3px 0 #111', margin: '0 auto 6px', background: creator.avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <img src="/characters/market_creator_default.png" alt={creator.name} width={64} height={64} style={{ objectFit: 'cover' }} />
                </div>
                <div style={{ fontSize: 11, fontWeight: 800, lineHeight: 1.2 }}>{creator.name}</div>
                <div style={{ fontSize: 9, color: '#7a746c', marginTop: 2 }}>{creator.followers} フォロー</div>
              </div>
            ))}
          </div>

          {/* RANKING */}
          <SectionLabel>RANKING — 今週</SectionLabel>
          <div style={{ margin: '0 14px', border: '2px solid #111', boxShadow: '4px 4px 0 #111', background: '#fff' }}>
            {RANKING_CHARACTERS.map((char, i) => {
              const isLast = i === RANKING_CHARACTERS.length - 1;
              const top = i < 3;
              return (
                <div key={char.id} onClick={() => goChar(char.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderBottom: isLast ? 'none' : '1px solid #ddd', cursor: 'pointer' }}>
                  <span style={{ fontSize: 14, fontWeight: 800, width: 22, textAlign: 'center', color: top ? '#e8568a' : '#111' }}>{i + 1}</span>
                  <div style={{ width: 38, height: 38, border: '2px solid #111', flexShrink: 0, background: char.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <CharacterIcon char={char} size={38} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{char.name}</div>
                    <div style={{ fontSize: 10, color: '#7a746c', marginTop: 1 }}>@{char.creatorId}</div>
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#555', textAlign: 'right', flexShrink: 0 }}>
                    入手 {char.acquiredCount.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* クリエイター出品MEORA (Supabase Realtime) */}
          {dbChars.length > 0 && (
            <>
              <SectionLabel>NEW — クリエイター出品</SectionLabel>
              <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {dbChars.map(listing => (
                  <DbCharCard key={listing.id} listing={listing} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ===== TAB: お食事 ===== */}
      {activeTab === 'food' && (
        <>
          <SectionLabel>お食事アイテム</SectionLabel>
          <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 12, color: '#7a746c', lineHeight: 1.6, padding: '0 2px 8px' }}>
              MEORAに食事を与えて満腹度を回復しましょう。毎日おにぎり1個が無料で届きます。
            </div>
            {DEFAULT_FOOD_ITEMS.map(item => (
              <FoodCard key={item.id} item={item} />
            ))}
          </div>

          {dbFoods.length > 0 ? (
            <>
              <SectionLabel>クリエイターのお食事</SectionLabel>
              <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {dbFoods.map(listing => (
                  <DbFoodCard key={listing.id} listing={listing} />
                ))}
              </div>
            </>
          ) : (
            <>
              <SectionLabel>クリエイターのお食事</SectionLabel>
              <div style={{ padding: '0 14px' }}>
                <div style={{ border: '2px solid #111', background: '#fff', boxShadow: '4px 4px 0 #111', padding: '16px 14px', textAlign: 'center', color: '#888', fontSize: 12 }}>
                  COMING SOON
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ===== TAB: スキン ===== */}
      {activeTab === 'skin' && (
        <>
          <SectionLabel>スキンアイテム</SectionLabel>
          <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 12, color: '#7a746c', lineHeight: 1.6, padding: '0 2px 8px' }}>
              MEORAの見た目を変えるスキンです。クリエイターが出品しています。
            </div>
            {MARKET_SKIN_ITEMS.map(item => (
              <SkinCard key={item.id} item={item} />
            ))}
            {dbSkins.map(listing => (
              <DbSkinCard key={listing.id} listing={listing} />
            ))}
          </div>
        </>
      )}

      <BottomNav />
    </div>
  );
}

function DbCharCard({ listing }: { listing: DbListing }) {
  return (
    <div style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 12, padding: '14px 14px 10px' }}>
        <div style={{ width: 64, height: 64, border: '2px solid #111', flexShrink: 0, background: '#f7f5f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {listing.photo_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={listing.photo_url} alt={listing.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            : <CharAvatar name={listing.name} size={64} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1.2 }}>{listing.name}</div>
          {listing.description && (
            <div style={{ fontSize: 12, color: '#555', marginTop: 4, lineHeight: 1.4 }}>{listing.description}</div>
          )}
          <div style={{ fontSize: 10, color: '#7a746c', marginTop: 6 }}>
            by <b style={{ color: '#111', fontWeight: 700 }}>@{listing.creator_profiles?.display_name ?? '???'}</b>
          </div>
        </div>
      </div>
      <div style={{ borderTop: '2px solid #111', display: 'flex' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '9px 12px' }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>
            {listing.price === 0 ? '無料' : `${listing.price.toLocaleString()}円`}
          </span>
        </div>
        <div style={{ flexShrink: 0, background: '#111', color: '#fff', fontSize: 12, fontWeight: 800, padding: '0 16px', display: 'flex', alignItems: 'center', borderLeft: '2px solid #111' }}>
          話す ›
        </div>
      </div>
    </div>
  );
}

function DbFoodCard({ listing }: { listing: DbListing }) {
  return (
    <div style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px' }}>
      <div style={{ flexShrink: 0, width: 52, height: 52, border: '2px solid #111', background: '#f7f5f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 800 }}>
          {listing.name}
          {listing.hp_bonus != null && (
            <span style={{ fontSize: 11, fontWeight: 800, color: '#e8568a', marginLeft: 6, fontFamily: 'var(--font-mono)' }}>+{listing.hp_bonus} HP</span>
          )}
        </div>
        {listing.description && <div style={{ fontSize: 11, color: '#7a746c', marginTop: 2 }}>{listing.description}</div>}
        <div style={{ fontSize: 10, color: '#7a746c', marginTop: 2 }}>by @{listing.creator_profiles?.display_name ?? '???'}</div>
      </div>
      <div style={{ flexShrink: 0, fontSize: 13, fontWeight: 800 }}>{listing.price}円</div>
    </div>
  );
}

function DbSkinCard({ listing }: { listing: DbListing }) {
  return (
    <div style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px' }}>
      <div style={{ flexShrink: 0, width: 52, height: 52, border: '2px solid #111', background: '#f7f5f0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {listing.photo_url
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={listing.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          : <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect x="4" y="8" width="20" height="14" stroke="#111" strokeWidth="2"/><circle cx="14" cy="15" r="4" stroke="#111" strokeWidth="1.5"/><line x1="4" y1="8" x2="14" y2="4" stroke="#111" strokeWidth="1.5"/><line x1="24" y1="8" x2="14" y2="4" stroke="#111" strokeWidth="1.5"/></svg>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 800 }}>{listing.name}</div>
        {listing.description && <div style={{ fontSize: 11, color: '#7a746c', marginTop: 2 }}>{listing.description}</div>}
        <div style={{ fontSize: 10, color: '#7a746c', marginTop: 2 }}>by @{listing.creator_profiles?.display_name ?? '???'}</div>
      </div>
      <div style={{ flexShrink: 0, fontSize: 13, fontWeight: 800 }}>{listing.price}円</div>
    </div>
  );
}

function PickupCard({ char, onClick }: { char: MarketCharacter; onClick: () => void }) {
  const isFree = char.accessTier === 'free';
  return (
    <div onClick={onClick} style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', overflow: 'hidden', cursor: 'pointer' }}>
      <div style={{ display: 'flex', gap: 12, padding: '14px 14px 10px' }}>
        <div style={{ width: 64, height: 64, border: '2px solid #111', flexShrink: 0, background: char.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <CharacterIcon char={char} size={64} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {char.name}
            <span style={{ display: 'inline-block', background: isFree ? '#3db33d' : '#f5a623', color: isFree ? '#fff' : '#111', fontSize: 9, fontWeight: 800, padding: '2px 7px', border: '1.5px solid #111', letterSpacing: '0.06em', marginLeft: 6, verticalAlign: 1, fontFamily: 'var(--font-mono)' }}>
              {isFree ? 'FREE' : 'SUB'}
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#3a3530', marginTop: 4, lineHeight: 1.4 }}>{char.tagline}</div>
          <div style={{ fontSize: 10, color: '#7a746c', marginTop: 6 }}>
            by <b style={{ color: '#111', fontWeight: 700 }}>@{char.creatorId}</b>
          </div>
        </div>
      </div>
      <div style={{ borderTop: '2px solid #111', display: 'flex' }}>
        <div style={{ flex: 1, flexShrink: 0, background: '#111', color: '#fff', fontSize: 12, fontWeight: 800, padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', letterSpacing: '0.02em' }}>
          {isFree ? '無料で話す' : '話す'} ›
        </div>
      </div>
    </div>
  );
}

function FoodCard({ item }: { item: FoodItem }) {
  const isFree = item.price === 0;
  return (
    <div onClick={() => alert('リリース時に実装予定です')} style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px', cursor: 'pointer' }}>
      {/* アイコン */}
      <div style={{ flexShrink: 0, width: 52, height: 52, border: '2px solid #111', background: '#f7f5f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '0.02em' }}>
          {item.name}
          <span style={{ fontSize: 11, fontWeight: 800, color: '#e8568a', marginLeft: 6, fontFamily: 'var(--font-mono)' }}>+{item.hpBonus} HP</span>
        </div>
        <div style={{ fontSize: 11, color: '#7a746c', marginTop: 2, lineHeight: 1.4 }}>{item.desc}</div>
      </div>
      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        {isFree ? (
          <div style={{ background: '#3db33d', color: '#fff', fontSize: 10, fontWeight: 800, padding: '4px 10px', border: '1.5px solid #111', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)' }}>
            毎日無料
          </div>
        ) : (
          <div style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>{item.price}円</div>
        )}
      </div>
    </div>
  );
}

function SkinCard({ item }: { item: MarketSkinItem }) {
  return (
    <div onClick={() => alert('リリース時に実装予定です')} style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px', cursor: 'pointer' }}>
      <div style={{ flexShrink: 0, width: 52, height: 52, border: '2px solid #111', background: '#f7f5f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect x="4" y="8" width="20" height="14" stroke="#111" strokeWidth="2"/>
          <circle cx="14" cy="15" r="4" stroke="#111" strokeWidth="1.5"/>
          <line x1="4" y1="8" x2="14" y2="4" stroke="#111" strokeWidth="1.5"/>
          <line x1="24" y1="8" x2="14" y2="4" stroke="#111" strokeWidth="1.5"/>
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '0.02em' }}>{item.name}</div>
        <div style={{ fontSize: 11, color: '#7a746c', marginTop: 2, lineHeight: 1.4 }}>{item.desc}</div>
        <div style={{ fontSize: 10, color: '#7a746c', marginTop: 3 }}>by @{item.creatorId}</div>
      </div>
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>{item.price}円</div>
      </div>
    </div>
  );
}
