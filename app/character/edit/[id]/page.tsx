'use client';
import { useEffect, useRef, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { loadState, saveState, AppState, Character, SpriteType } from '@/lib/store';
import { InheritPersonaCopy } from '@/components/InheritPersonaCopy';

const SPRITE_ROWS: { type: SpriteType; label: string }[] = [
  { type: 'idle',      label: '基本（止まる）' },
  { type: 'walkRight', label: '右に歩く' },
  { type: 'walkLeft',  label: '左に歩く' },
];

const PERSONALITY_TEMPLATE = `性格は、
口調は、
語尾は、
口癖は、
ユーザーへの呼びかけは、
得意な話題は、
苦手な話題は、`;

// 画像を最大 maxSize px に収め dataURL(PNG) で返す。PNG で返すことで透過を維持する。
function resizeImageToDataUrl(file: File, maxSize = 512): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(reader.result as string); return; }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function CharacterEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [appState, setAppState] = useState<AppState | null>(null);
  const [name, setName] = useState('');
  const [spriteMap, setSpriteMap] = useState<Partial<Record<SpriteType, string>>>({});
  const [personality, setPersonality] = useState('');
  const fileRefs = useRef<Partial<Record<SpriteType, HTMLInputElement | null>>>({});

  useEffect(() => {
    const s = loadState();
    if (!s.onboardingDone) { router.replace('/onboarding'); return; }
    const found = s.characters.find(c => c.id === id);
    if (!found) { router.replace('/dashboard'); return; }
    setAppState(s);
    setName(found.name);
    // sprites 配列をタイプ別マップに変換。旧 photo を idle フォールバックとして使用。
    const map: Partial<Record<SpriteType, string>> = {};
    if (found.sprites && found.sprites.length > 0) {
      for (const s of found.sprites) {
        if (s.type === 'walkRight' || s.type === 'walkLeft' || s.type === 'idle') {
          map[s.type] = s.dataUrl;
        }
      }
    } else if (found.photo) {
      map['idle'] = found.photo;
    }
    setSpriteMap(map);
    setPersonality(found.personality ?? '');
  }, [id, router]);

  const handleFileChange = async (type: SpriteType, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImageToDataUrl(file, 512);
      setSpriteMap(prev => ({ ...prev, [type]: dataUrl }));
    } catch {
      // 読み込み失敗時は何もしない
    }
    e.target.value = '';
  };

  const handleSpriteRemove = (type: SpriteType) => {
    setSpriteMap(prev => {
      const next = { ...prev };
      delete next[type];
      return next;
    });
  };

  // idle → 先頭スプライト の順でプレビュー用画像を決定。
  const previewSrc = spriteMap['idle'] ?? spriteMap['walkRight'] ?? spriteMap['walkLeft'];

  const handleSave = () => {
    if (!appState) return;
    const sprites = SPRITE_ROWS
      .filter(row => spriteMap[row.type])
      .map(row => ({ type: row.type, dataUrl: spriteMap[row.type]! }));
    const updated: Character[] = appState.characters.map(c =>
      c.id === id
        ? {
            ...c,
            name: name.trim() || c.name,
            photo: spriteMap['idle'] ?? sprites[0]?.dataUrl,
            sprites: sprites.length > 0 ? sprites : undefined,
            personality: personality.trim() || undefined,
          }
        : c
    );
    saveState({ ...appState, characters: updated });
    router.replace('/dashboard');
  };

  const light = {
    backgroundColor: '#f8f8f4',
    backgroundImage: 'linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)',
    backgroundSize: '24px 24px',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '0 0 48px',
  } as const;

  const inputStyle = {
    width: '100%',
    border: '2px solid #111',
    background: '#f8f8f4',
    padding: '12px 14px',
    fontSize: 17,
    color: '#111',
    outline: 'none',
    borderRadius: 0,
    fontFamily: 'inherit',
  } as const;

  const sectionLabel = (text: string) => (
    <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#666', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>
      {text}
    </div>
  );

  if (!appState) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f8f4' }}>
        <span style={{ fontSize: 16, color: '#888' }}>読み込み中...</span>
      </div>
    );
  }

  const canSave = name.trim().length > 0;

  return (
    <div style={light}>
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column' }}>

        {/* ヘッダー */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '14px 16px 12px', borderBottom: '2px solid #111', backgroundColor: '#f8f8f4', position: 'sticky', top: 0, zIndex: 10 }}>
          <div><button onClick={() => router.back()} style={{ fontSize: 14, fontWeight: 600, color: '#111', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>← 戻る</button></div>
          <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '0.04em', textAlign: 'center', whiteSpace: 'nowrap' }}>MEORAを編集</div>
          <div />
        </div>

        {/* プレビュー */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 16px 16px', background: '#111', margin: '14px 16px 0', border: '2px solid #111', boxShadow: '4px 4px 0 #555' }}>
          <div style={{ background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(255,255,255,0.2)', padding: 16, marginBottom: 12 }}>
            {previewSrc ? (
              <img src={previewSrc} alt={name || 'MEORA'} style={{ width: 100, height: 100, objectFit: 'contain', display: 'block' }} />
            ) : (
              <div style={{ width: 100, height: 100, border: '2px dashed rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                画像なし
              </div>
            )}
          </div>
          <div style={{ color: '#fff', fontSize: 18, fontWeight: 800, letterSpacing: '0.04em' }}>
            {name || 'あなたのMEORA'}
          </div>
        </div>

        {/* 入力セクション */}
        <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* MEORA名 */}
          <div style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: '16px 14px' }}>
            {sectionLabel('MEORA名')}
            <input type="text" value={name} onChange={e => setName(e.target.value)} maxLength={20} style={inputStyle} />
          </div>

          {/* 見た目（スプライト・タイプ別） */}
          <div style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: '16px 14px' }}>
            {sectionLabel('見た目')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {SPRITE_ROWS.map(({ type, label }) => {
                const src = spriteMap[type];
                return (
                  <div key={type}>
                    <input
                      ref={el => { fileRefs.current[type] = el; }}
                      type="file"
                      accept="image/*"
                      onChange={e => handleFileChange(type, e)}
                      style={{ display: 'none' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1.5px solid #111', padding: 10, background: '#f8f8f4' }}>
                      {/* 画像プレビュー */}
                      <div style={{ flexShrink: 0, width: 54, height: 54, border: '2px solid #111', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {src ? (
                          <img src={src} alt={label} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                        ) : (
                          <span style={{ fontSize: 11, color: '#bbb', fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', textAlign: 'center', lineHeight: 1.4 }}>画像<br/>なし</span>
                        )}
                      </div>
                      {/* ラベル */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#111', letterSpacing: '0.04em' }}>{label}</div>
                      </div>
                      {/* ボタン群 */}
                      <div style={{ flexShrink: 0, display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => fileRefs.current[type]?.click()}
                          style={{ padding: '7px 12px', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', background: '#111', color: '#fff', border: '2px solid #111', boxShadow: '2px 2px 0 #555', cursor: 'pointer', borderRadius: 0, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}
                        >
                          {src ? '変更' : '設定'}
                        </button>
                        {src && (
                          <button
                            onClick={() => handleSpriteRemove(type)}
                            style={{ padding: '7px 10px', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', background: '#fff', color: '#111', border: '2px solid #111', boxShadow: '2px 2px 0 #111', cursor: 'pointer', borderRadius: 0, letterSpacing: '0.02em' }}
                          >
                            削除
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: 13, color: '#999', marginTop: 10, letterSpacing: '0.02em', lineHeight: 1.5 }}>
              透過PNGをそのまま設定できます。ホームでの歩き方向ごとに画像を設定できます。
            </div>
          </div>

          {/* 性格・口調 */}
          <div style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: '16px 14px' }}>
            {sectionLabel('性格・口調')}
            {/* テンプレート挿入ボタン */}
            <button
              onClick={() => setPersonality(prev => prev ? prev : PERSONALITY_TEMPLATE)}
              style={{ marginBottom: 10, padding: '6px 12px', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', background: '#fff', color: '#111', border: '2px solid #111', boxShadow: '2px 2px 0 #111', cursor: 'pointer', borderRadius: 0, letterSpacing: '0.04em' }}
            >
              テンプレートを挿入
            </button>
            <textarea
              value={personality}
              onChange={e => setPersonality(e.target.value)}
              placeholder="例: 性格は、おっとり聞き上手。口調は、やわらかい敬語まじりのタメ口。"
              rows={7}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 120, lineHeight: 1.7 }}
            />
            <div style={{ fontSize: 13, color: '#999', marginTop: 8, letterSpacing: '0.02em', lineHeight: 1.5 }}>
              ここに書いた内容がMEORAの話し方になります。
            </div>
            <InheritPersonaCopy />
          </div>

          {/* 保存ボタン */}
          <button
            onClick={handleSave}
            disabled={!canSave}
            style={{ width: '100%', background: canSave ? '#111' : '#999', color: '#fff', border: `2px solid ${canSave ? '#111' : '#999'}`, boxShadow: canSave ? '4px 4px 0 #555' : 'none', padding: '16px 20px', fontSize: 18, fontWeight: 800, letterSpacing: '0.08em', cursor: canSave ? 'pointer' : 'not-allowed', borderRadius: 0, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            保存する →
          </button>
        </div>
      </div>
    </div>
  );
}
