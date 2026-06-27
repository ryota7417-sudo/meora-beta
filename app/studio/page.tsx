'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { resolveAuth } from '@/lib/auth';
import { getCharactersByCreator } from '@/lib/market-data';
import type { User } from '@supabase/supabase-js';

const PAPER_BG = {
  backgroundColor: '#f7f5f0',
  backgroundImage: `
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E"),
    repeating-linear-gradient(to right, rgba(0,0,0,0.14) 0px, rgba(0,0,0,0.14) 1px, transparent 1px, transparent 25px),
    repeating-linear-gradient(to bottom, rgba(0,0,0,0.14) 0px, rgba(0,0,0,0.14) 1px, transparent 1px, transparent 25px)
  `,
} as const;

const CREATOR_ID = 'opiyo';
const STUDIO_EMAIL = 'r.matsuoka@aritude.com';

type Profile = {
  display_name: string;
  handle: string;
  bio: string;
  avatar_url: string;
  banner_bg: string;
  avatar_bg: string;
  tagline: string;
};

const DEFAULT_PROFILE: Profile = {
  display_name: 'おぴよ',
  handle: '@opiyo',
  bio: '個性あふれる動物MEORAを作っています。',
  avatar_url: '/characters/opiyo_icon.PNG',
  banner_bg: '#f7f5f0',
  avatar_bg: '#f7f5f0',
  tagline: '',
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.14em', color: '#7a746c', textTransform: 'uppercase', padding: '16px 0 8px', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)' }}>
      {children}
      <span style={{ flex: 1, height: 1, background: '#cfcabf' }} />
    </div>
  );
}

function Field({ label, value, onChange, multiline }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  const inputStyle = {
    width: '100%',
    border: '2px solid #111',
    background: '#fff',
    fontSize: 15,
    padding: '10px 12px',
    fontFamily: 'inherit',
    color: '#111',
    outline: 'none',
    borderRadius: 0,
    boxSizing: 'border-box' as const,
    resize: 'none' as const,
  };
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', color: '#7a746c', textTransform: 'uppercase', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>
        {label}
      </label>
      {multiline ? (
        <textarea rows={3} value={value} onChange={e => onChange(e.target.value)} style={inputStyle} />
      ) : (
        <input type="text" value={value} onChange={e => onChange(e.target.value)} style={inputStyle} />
      )}
    </div>
  );
}

export default function StudioPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const characters = getCharactersByCreator(CREATOR_ID);

  useEffect(() => {
    const supabase = createClient();
    const { promise, cancel } = resolveAuth(supabase, { graceMs: 1500 });
    let active = true;
    promise.then(async (loggedIn) => {
      if (!active) return;
      if (!loggedIn) { router.replace('/onboarding'); return; }
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) { router.replace('/onboarding'); return; }
      setUser(u);

      const { data } = await supabase
        .from('creator_profiles')
        .select('display_name, handle, bio, avatar_url, banner_bg, avatar_bg, tagline')
        .eq('id', CREATOR_ID)
        .maybeSingle();

      if (data) {
        const d = data as Record<string, string | null>;
        setProfile({
          display_name: d.display_name || DEFAULT_PROFILE.display_name,
          handle: d.handle || DEFAULT_PROFILE.handle,
          bio: d.bio || DEFAULT_PROFILE.bio,
          avatar_url: d.avatar_url || DEFAULT_PROFILE.avatar_url,
          banner_bg: d.banner_bg || DEFAULT_PROFILE.banner_bg,
          avatar_bg: d.avatar_bg || DEFAULT_PROFILE.avatar_bg,
          tagline: d.tagline || DEFAULT_PROFILE.tagline,
        });
      }
      setLoading(false);
    });
    return () => { active = false; cancel(); };
  }, [router]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: e } = await supabase
      .from('creator_profiles')
      .upsert({
        id: CREATOR_ID,
        user_id: user.id,
        display_name: profile.display_name,
        handle: profile.handle,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        banner_bg: profile.banner_bg,
        avatar_bg: profile.avatar_bg,
        tagline: profile.tagline,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (e) setError(e.message);
    else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div style={{ ...PAPER_BG, minHeight: '100vh', maxWidth: 390, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111' }}>
        <span style={{ fontSize: 15, fontWeight: 700 }}>Loading...</span>
      </div>
    );
  }

  if (user?.email !== STUDIO_EMAIL) {
    return (
      <div style={{ ...PAPER_BG, minHeight: '100vh', maxWidth: 390, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, color: '#111', padding: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 800, textAlign: 'center' }}>このページはアクセスできません</div>
        <button
          onClick={() => router.push('/dashboard')}
          style={{ background: '#111', color: '#fff', border: '2px solid #111', boxShadow: '3px 3px 0 #555', fontSize: 14, fontWeight: 800, padding: '10px 18px', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 0 }}
        >
          ダッシュボードへ
        </button>
      </div>
    );
  }

  return (
    <div style={{ ...PAPER_BG, minHeight: '100vh', maxWidth: 390, margin: '0 auto', paddingBottom: 40, color: '#111' }}>
      <div style={{ background: '#111', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 100 }}>
        <button
          onClick={() => router.push('/dashboard')}
          style={{ fontSize: 14, fontWeight: 700, color: '#fff', border: '2px solid #fff', padding: '4px 9px', background: 'transparent', cursor: 'pointer', borderRadius: 0, fontFamily: 'inherit' }}
        >
          ←
        </button>
        <span style={{ color: '#f7f5f0', fontSize: 14, letterSpacing: '0.14em', fontFamily: 'var(--font-mono)' }}>MEORA STUDIO</span>
      </div>

      <div style={{ padding: '0 14px' }}>
        <SectionLabel>クリエイタープロフィール</SectionLabel>
        <div style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: 16, marginBottom: 16 }}>
          <Field label="表示名" value={profile.display_name} onChange={v => setProfile(p => ({ ...p, display_name: v }))} />
          <Field label="ハンドル (@name)" value={profile.handle} onChange={v => setProfile(p => ({ ...p, handle: v }))} />
          <Field label="タグライン（短い一言）" value={profile.tagline} onChange={v => setProfile(p => ({ ...p, tagline: v }))} />
          <Field label="自己紹介" value={profile.bio} onChange={v => setProfile(p => ({ ...p, bio: v }))} multiline />
          <Field label="アバター画像URL" value={profile.avatar_url} onChange={v => setProfile(p => ({ ...p, avatar_url: v }))} />
          <Field label="バナー背景色 (#hex)" value={profile.banner_bg} onChange={v => setProfile(p => ({ ...p, banner_bg: v }))} />
          <Field label="アバター背景色 (#hex)" value={profile.avatar_bg} onChange={v => setProfile(p => ({ ...p, avatar_bg: v }))} />

          {error && (
            <div style={{ color: '#c0392b', fontSize: 13, marginBottom: 12, padding: '8px 10px', border: '1.5px solid #c0392b', background: '#fdf0ef' }}>
              {error}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%',
              background: saved ? '#2e7d32' : '#111',
              color: '#fff',
              border: '2px solid #111',
              boxShadow: saved ? '3px 3px 0 #2e7d32' : '3px 3px 0 #555',
              fontSize: 15, fontWeight: 800, padding: '12px 0',
              cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit', borderRadius: 0,
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saved ? '保存しました' : saving ? '保存中...' : '保存する'}
          </button>
        </div>

        <SectionLabel>制作MEORA ({characters.length}体)</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {characters.map(char => (
            <div key={char.id} style={{ background: '#fff', border: '2px solid #111', boxShadow: '3px 3px 0 #111', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
              <div style={{ width: 52, height: 52, border: '2px solid #111', flexShrink: 0, background: char.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {char.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={char.photoUrl} alt={char.name} style={{ width: 52, height: 52, objectFit: 'contain' }} />
                ) : (
                  <span style={{ fontSize: 22 }}>{char.name[0]}</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 800 }}>{char.name}</div>
                <div style={{ fontSize: 13, color: '#7a746c', marginTop: 2 }}>{char.tagline}</div>
              </div>
              <button
                onClick={() => router.push(`/market/character/${char.id}`)}
                style={{ flexShrink: 0, background: 'transparent', border: '2px solid #111', fontSize: 12, fontWeight: 800, padding: '5px 10px', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 0 }}
              >
                見る
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
