'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BottomNav } from '@/components/ui/BottomNav';
import { CharAvatar } from '@/components/ui/CharacterSvg';
import { ComingSoonToast } from '@/components/ui/ComingSoonToast';
import { ReleaseSoonModal } from '@/components/ui/ReleaseSoonModal';
import {
  MARKET_CREATORS,
  MARKET_CHARACTERS,
  PICKUP_CHARACTERS,
  DEFAULT_FOOD_ITEMS,
  type MarketCharacter,
  type FoodItem,
} from '@/lib/market-data';
import { loadOwnedSkins, getEquippedSkinUrls } from '@/lib/store';
import { MARKET_SKIN_ITEMS } from '@/lib/market-data';
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
  created_at: string | null;
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
    <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.14em', color: '#7a746c', textTransform: 'uppercase', padding: '18px 16px 8px', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)' }}>
      {children}
      <span style={{ flex: 1, height: 1, background: '#cfcabf' }} />
    </div>
  );
}

function getCharSkinUrls(charId: string): { wear?: string; hat?: string } {
  const equipped = getEquippedSkinUrls(charId);
  if (equipped.wear || equipped.hat) return equipped;
  const owned = loadOwnedSkins();
  const charSkins = MARKET_SKIN_ITEMS.filter(s => s.characterId === charId);
  const wearSkin = charSkins.find(s => s.slot === 'wear' && owned.some(o => o.id === s.id));
  const hatSkin = charSkins.find(s => s.slot === 'hat' && owned.some(o => o.id === s.id));
  return {
    wear: wearSkin?.spriteUrl,
    hat: hatSkin?.spriteUrl,
  };
}

function CharacterIcon({ char, size }: { char: MarketCharacter; size: number }) {
  const [skinUrls, setSkinUrls] = useState<{ wear?: string; hat?: string }>({});

  useEffect(() => {
    setSkinUrls(getCharSkinUrls(char.id));
  }, [char.id]);

  if (char.photoUrl || skinUrls.wear || skinUrls.hat) {
    return (
      <div style={{ width: size, height: size, position: 'relative', overflow: 'hidden' }}>
        {char.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={char.photoUrl} alt={char.name} style={{ width: size, height: size, objectFit: 'contain', display: 'block', position: 'absolute', top: 0, left: 0 }} />
        )}
        {skinUrls.wear && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={skinUrls.wear} alt="" style={{ width: size, height: size, objectFit: 'contain', display: 'block', position: 'absolute', top: 0, left: 0 }} />
        )}
        {skinUrls.hat && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={skinUrls.hat} alt="" style={{ width: size, height: size, objectFit: 'contain', display: 'block', position: 'absolute', top: 0, left: 0 }} />
        )}
      </div>
    );
  }
  return <CharAvatar name={char.name} size={size} />;
}

export default function MarketPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('character');
  const [dbListings, setDbListings] = useState<DbListing[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [showReleaseSoon, setShowReleaseSoon] = useState(false);
  const purchasing = false;

  const handleFoodPurchase = () => {
    setShowReleaseSoon(true);
  };

  useEffect(() => {
    const supabase = createClient();

    const fetchListings = async () => {
      const { data, error } = await supabase
        .from('market_listings')
        .select('id, creator_id, type, name, description, price, photo_url, sprite_idle, hp_bonus, created_at, creator_profiles(display_name)')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      if (!error && data) setDbListings(data as unknown as DbListing[]);
    };

    fetchListings();

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
    { key: 'food',      label: 'アイテム' },
  ];

  return (
    <div style={{ ...PAPER_BG, minHeight: '100vh', maxWidth: 390, margin: '0 auto', paddingBottom: 'calc(96px + env(safe-area-inset-bottom))', color: '#111' }}>
      {/* HEADER */}
      <div style={{ background: '#111', padding: '11px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, borderBottom: '2px solid #111' }}>
        <span style={{ color: '#f7f5f0', fontSize: 15, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'var(--font-display)' }}>
          MEORA MARKET
        </span>
        <span style={{ background: '#e8568a', color: '#fff', fontSize: 11, fontWeight: 800, padding: '2px 7px', border: '1.5px solid #fff', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>
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
            style={{ border: 'none', outline: 'none', flex: 1, fontSize: 15, fontFamily: 'inherit', background: 'transparent', color: '#111' }}
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
                fontSize: 15,
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
              <PickupCard key={char.id} char={char} onCardClick={() => goChar(char.id)} />
            ))}
          </div>

          {/* POPULAR CREATORS */}
          {MARKET_CREATORS.length > 0 && (
            <>
              <SectionLabel>POPULAR CREATORS</SectionLabel>
              <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '8px 14px 4px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                {MARKET_CREATORS.map((creator) => (
                  <div key={creator.id} onClick={() => goShop(creator.id)} style={{ flexShrink: 0, width: 96, textAlign: 'center', cursor: 'pointer' }}>
                    <div style={{ width: 64, height: 64, border: '2px solid #111', boxShadow: '3px 3px 0 #111', margin: '0 auto 6px', background: creator.avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={creator.avatarUrl || '/characters/market_creator_default.png'} alt={creator.name} width={64} height={64} style={{ objectFit: 'cover' }} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.2 }}>{creator.name}</div>
                    <div style={{ fontSize: 11, color: '#7a746c', marginTop: 2 }}>{creator.followers} フォロー</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* RANKING: アーカイブ済み → archive/ranking-section.tsx */}

          {/* クリエイター出品MEORA */}
          <SectionLabel>NEW — クリエイター出品</SectionLabel>
          <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {MARKET_CHARACTERS.map((char) => (
              <PickupCard key={char.id} char={char} onCardClick={() => goChar(char.id)} />
            ))}
          </div>
        </>
      )}

      {/* ===== TAB: アイテム ===== */}
      {activeTab === 'food' && (
        <>
          <SectionLabel>アイテムショップ</SectionLabel>
          <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 14, color: '#7a746c', lineHeight: 1.6, padding: '0 2px 8px' }}>
              購入するとボーナス通数が追加されます。
            </div>
            {DEFAULT_FOOD_ITEMS.filter(item => item.price > 0).map(item => (
              <FoodCard key={item.id} item={item} onTap={() => handleFoodPurchase()} disabled={purchasing} />
            ))}
          </div>

          {dbFoods.length > 0 ? (
            <>
              <SectionLabel>クリエイターのアイテム</SectionLabel>
              <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {dbFoods.map(listing => (
                  <DbFoodCard key={listing.id} listing={listing} />
                ))}
              </div>
            </>
          ) : (
            <>
              <SectionLabel>クリエイターのアイテム</SectionLabel>
              <div style={{ padding: '0 14px' }}>
                <div style={{ border: '2px solid #111', background: '#fff', boxShadow: '4px 4px 0 #111', padding: '16px 14px', textAlign: 'center', color: '#888', fontSize: 14 }}>
                  COMING SOON
                </div>
              </div>
            </>
          )}
        </>
      )}


      <BottomNav />
      <ComingSoonToast message={toast} onClose={() => setToast(null)} />
      {showReleaseSoon && <ReleaseSoonModal onClose={() => setShowReleaseSoon(false)} />}
    </div>
  );
}

function DbCharCard({ listing, onDetail, onCreatorClick }: { listing: DbListing; onDetail: () => void; onCreatorClick: () => void }) {
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
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1.2 }}>{listing.name}</div>
          {listing.description && (
            <div style={{ fontSize: 14, color: '#555', marginTop: 4, lineHeight: 1.4 }}>{listing.description}</div>
          )}
          <div onClick={(e) => { e.stopPropagation(); onCreatorClick(); }} style={{ fontSize: 12, color: '#7a746c', marginTop: 6, cursor: 'pointer' }}>
            by <b style={{ color: '#111', fontWeight: 700, textDecoration: 'underline' }}>@{listing.creator_profiles?.display_name || 'クリエイター'}</b>
          </div>
        </div>
      </div>
      <div style={{ borderTop: '2px solid #111', display: 'flex' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '9px 12px' }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#111' }}>
            {listing.price === 0 ? '無料' : `${listing.price.toLocaleString()}円`}
          </span>
        </div>
        <button
          onClick={onDetail}
          style={{ flexShrink: 0, background: '#111', color: '#fff', fontSize: 14, fontWeight: 800, padding: '0 16px', display: 'flex', alignItems: 'center', borderLeft: '2px solid #111', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          詳細を見る
        </button>
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
        <div style={{ fontSize: 16, fontWeight: 800 }}>
          {listing.name}
          {listing.hp_bonus != null && (
            <span style={{ fontSize: 13, fontWeight: 800, color: '#e8568a', marginLeft: 6, fontFamily: 'var(--font-mono)' }}>+{listing.hp_bonus}通</span>
          )}
        </div>
        {listing.description && <div style={{ fontSize: 13, color: '#7a746c', marginTop: 2 }}>{listing.description}</div>}
        <div style={{ fontSize: 12, color: '#7a746c', marginTop: 2 }}>by @{listing.creator_profiles?.display_name || 'クリエイター'}</div>
      </div>
      <div style={{ flexShrink: 0, fontSize: 15, fontWeight: 800 }}>{listing.price}円</div>
    </div>
  );
}

function PickupCard({ char, onCardClick }: { char: MarketCharacter; onCardClick: () => void }) {
  return (
    <div onClick={onCardClick} style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', overflow: 'hidden', cursor: 'pointer' }}>
      <div style={{ display: 'flex', gap: 12, padding: '14px 14px 10px' }}>
        <div style={{ width: 64, height: 64, border: '2px solid #111', flexShrink: 0, background: char.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <CharacterIcon char={char} size={64} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {char.name}
          </div>
          <div style={{ fontSize: 14, color: '#3a3530', marginTop: 4, lineHeight: 1.4 }}>{char.tagline}</div>
          <div style={{ fontSize: 12, color: '#7a746c', marginTop: 6 }}>
            by <b style={{ color: '#111', fontWeight: 700 }}>@{char.creatorId}</b>
          </div>
        </div>
      </div>
      <div style={{ borderTop: '2px solid #111', display: 'flex' }}>
        <button
          onClick={(e) => { e.stopPropagation(); onCardClick(); }}
          style={{ flex: 1, background: '#111', color: '#fff', fontSize: 14, fontWeight: 800, padding: '11px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', letterSpacing: '0.02em', border: 'none', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 0 }}
        >
          詳細を見る
        </button>
      </div>
    </div>
  );
}

function FoodCard({ item, onTap, disabled }: { item: FoodItem; onTap: () => void; disabled?: boolean }) {
  return (
    <div onClick={disabled ? undefined : onTap} style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px', cursor: disabled ? 'wait' : 'pointer', opacity: disabled ? 0.6 : 1 }}>
      <div style={{ flexShrink: 0, width: 52, height: 52, border: '2px solid #111', background: '#f7f5f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/items/${item.id.replace('food-', '')}.png`} alt={item.name} width={44} height={44} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '0.02em' }}>
          {item.name}
          <span style={{ fontSize: 13, fontWeight: 800, color: '#e8568a', marginLeft: 6, fontFamily: 'var(--font-mono)' }}>+{item.messagesGranted}通</span>
        </div>
        <div style={{ fontSize: 13, color: '#7a746c', marginTop: 2, lineHeight: 1.4 }}>{item.desc}</div>
      </div>
      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#111' }}>{item.price}円</div>
      </div>
    </div>
  );
}

