'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { BottomNav } from '@/components/ui/BottomNav';
import { CharAvatar } from '@/components/ui/CharacterSvg';
import { createClient } from '@/lib/supabase';

type Creator = {
  user_id: string;
  display_name: string;
  tagline: string;
  bio: string;
  avatar_url: string | null;
  sns_x: string;
  sns_instagram: string;
  sns_facebook: string;
  sns_tiktok: string;
  sns_youtube: string;
};

type Listing = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  photo_url: string | null;
  type: string;
};

const SNS_LINKS: { key: keyof Creator; label: string; urlPrefix: string; icon: string }[] = [
  { key: 'sns_x', label: 'X', urlPrefix: 'https://x.com/', icon: 'X' },
  { key: 'sns_instagram', label: 'Instagram', urlPrefix: 'https://instagram.com/', icon: 'IG' },
  { key: 'sns_facebook', label: 'Facebook', urlPrefix: 'https://facebook.com/', icon: 'FB' },
  { key: 'sns_tiktok', label: 'TikTok', urlPrefix: 'https://tiktok.com/@', icon: 'TT' },
  { key: 'sns_youtube', label: 'YouTube', urlPrefix: 'https://youtube.com/', icon: 'YT' },
];

function snsUrl(prefix: string, value: string): string {
  if (value.startsWith('http')) return value;
  const handle = value.replace(/^@/, '');
  return `${prefix}${handle}`;
}

export default function CreatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: profile } = await supabase
        .from('creator_profiles')
        .select('*')
        .eq('user_id', id)
        .single();
      if (profile) setCreator(profile as unknown as Creator);

      const { data: items } = await supabase
        .from('market_listings')
        .select('id, name, description, price, photo_url, type')
        .eq('creator_id', id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      if (items) setListings(items as Listing[]);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7a746c', fontWeight: 800 }}>
        読み込み中...
      </div>
    );
  }

  if (!creator) {
    return (
      <div style={{ minHeight: '100vh', padding: 24 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', fontSize: 14, fontWeight: 800, cursor: 'pointer', color: '#111' }}>
          ← 戻る
        </button>
        <div style={{ textAlign: 'center', padding: 48, color: '#7a746c' }}>クリエイターが見つかりません</div>
        <BottomNav />
      </div>
    );
  }

  const activeSns = SNS_LINKS.filter(s => {
    const val = creator[s.key];
    return typeof val === 'string' && val.trim();
  });

  return (
    <div style={{ backgroundColor: '#f7f5f0', minHeight: '100vh', maxWidth: 390, margin: '0 auto', paddingBottom: 'calc(96px + env(safe-area-inset-bottom))', color: '#111' }}>
      {/* HEADER */}
      <div style={{ background: '#111', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 100, borderBottom: '2px solid #111' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 16, fontWeight: 800, cursor: 'pointer', padding: 0 }}>
          ←
        </button>
        <span style={{ color: '#f7f5f0', fontSize: 15, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          CREATOR
        </span>
      </div>

      {/* PROFILE CARD */}
      <div style={{ padding: 14 }}>
        <div style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: 20 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 72, height: 72, border: '2px solid #111', flexShrink: 0, background: '#f7f5f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {creator.avatar_url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={creator.avatar_url} alt={creator.display_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <CharAvatar name={creator.display_name} size={72} />}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{creator.display_name}</div>
              {creator.tagline && <div style={{ fontSize: 13, color: '#7a746c', marginTop: 2 }}>{creator.tagline}</div>}
            </div>
          </div>
          {creator.bio && (
            <div style={{ fontSize: 14, color: '#555', lineHeight: 1.7, marginTop: 14 }}>{creator.bio}</div>
          )}

          {/* SNS ICONS */}
          {activeSns.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              {activeSns.map(s => (
                <a
                  key={s.key}
                  href={snsUrl(s.urlPrefix, creator[s.key] as string)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 36, height: 36, border: '2px solid #111', background: '#fff',
                    boxShadow: '2px 2px 0 #111', fontSize: 11, fontWeight: 800, color: '#111',
                    textDecoration: 'none', cursor: 'pointer',
                  }}
                  title={s.label}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* LISTINGS */}
      <div style={{ padding: '0 14px' }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.14em', color: '#7a746c', textTransform: 'uppercase', padding: '14px 0 8px' }}>
          {creator.display_name} の出品
        </div>
        {listings.length === 0 ? (
          <div style={{ border: '2px solid #111', background: '#fff', boxShadow: '4px 4px 0 #111', padding: 24, textAlign: 'center', color: '#7a746c', fontSize: 14 }}>
            まだ出品がありません
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {listings.map(listing => (
              <div
                key={listing.id}
                onClick={() => router.push(`/market/character/${listing.id}`)}
                style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', display: 'flex', gap: 12, padding: 14, cursor: 'pointer' }}
              >
                <div style={{ width: 52, height: 52, border: '2px solid #111', flexShrink: 0, background: '#f7f5f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {listing.photo_url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={listing.photo_url} alt={listing.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    : <CharAvatar name={listing.name} size={52} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>{listing.name}</div>
                  {listing.description && <div style={{ fontSize: 13, color: '#7a746c', marginTop: 2, lineHeight: 1.4 }}>{listing.description}</div>}
                </div>
                <div style={{ flexShrink: 0, fontSize: 15, fontWeight: 800 }}>
                  {listing.price === 0 ? '無料' : `${listing.price.toLocaleString()}円`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
