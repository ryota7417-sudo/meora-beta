'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadState, saveState, Character, SpriteType } from '@/lib/store';
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

const PERSONALITY_OMAKASE = `性格は、楽観的で明るい
口調は、フレンドリー
語尾は、だで、だっけな
口癖は、知らんけど
ユーザーへの呼びかけは、しゃちょう
得意な話題は、ブラックジョーク
苦手な話題は、怖い話`;

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

export default function CharacterNewPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [spriteMap, setSpriteMap] = useState<Partial<Record<SpriteType, string>>>({});
  const [personality, setPersonality] = useState('');
  const fileRefs = useRef<Partial<Record<SpriteType, HTMLInputElement | null>>>({});

  // フック呼び出しの後に条件チェックを行う（Reactのフック順序ルール遵守）。
  const existingState = loadState();
  if (existingState.characters.some(c => c.userCreated)) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f5f0', padding: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#111', marginBottom: 12 }}>自分のMEORAはすでに作成済みです</div>
          <div style={{ fontSize: 15, color: '#888', marginBottom: 20 }}>設定画面から編集できます。</div>
          <button onClick={() => router.replace('/dashboard')} style={{ background: '#111', color: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #555', padding: '12px 24px', fontSize: 16, fontWeight: 800, cursor: 'pointer', borderRadius: 0, fontFamily: 'inherit' }}>
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

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

  const previewSrc = spriteMap['idle'] ?? spriteMap['walkRight'] ?? spriteMap['walkLeft'];

  const [useDefault, setUseDefault] = useState(false);

  const handleSelectDefault = () => {
    setUseDefault(true);
    setSpriteMap(prev => ({ ...prev, idle: '/icon_default.png' }));
  };

  const handleDeselectDefault = () => {
    setUseDefault(false);
    setSpriteMap(prev => {
      const next = { ...prev };
      delete next['idle'];
      return next;
    });
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const sprites = SPRITE_ROWS
      .filter(row => spriteMap[row.type])
      .map(row => ({ type: row.type, dataUrl: spriteMap[row.type]! }));
    const newChar: Character = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      role: '',
      job: '',
      color: '#111',
      hp: 100,
      maxHp: 100,
      lastResetDate: '',
      photo: spriteMap['idle'] ?? sprites[0]?.dataUrl,
      sprites: sprites.length > 0 ? sprites : undefined,
      personality: personality.trim() || undefined,
      userCreated: true,
      sellable: false,
    };
    const state = loadState();
    saveState({ ...state, characters: [...state.characters, newChar] });
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

  const canSave = name.trim().length > 0;

  return (
    <div style={light}>
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column' }}>

        {/* ヘッダー */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '14px 16px 12px', borderBottom: '2px solid #111', backgroundColor: '#f8f8f4', position: 'sticky', top: 0, zIndex: 10 }}>
          <div><button onClick={() => router.back()} style={{ fontSize: 14, fontWeight: 600, color: '#111', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>← 戻る</button></div>
          <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '0.04em', textAlign: 'center', whiteSpace: 'nowrap' }}>MEORAを作る</div>
          <div />
        </div>

        {/* 入力セクション */}
        <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* デフォルトキャラクター */}
          <div style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: '16px 14px' }}>
            {sectionLabel('デフォルトキャラクター')}
            <div style={{ fontSize: 14, color: '#666', lineHeight: 1.6, marginBottom: 12 }}>
              オリジナルのキャラクターを作らなくても、デフォルトのMEORAですぐに始められます。
            </div>
            <div
              onClick={useDefault ? handleDeselectDefault : handleSelectDefault}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: 12,
                border: useDefault ? '3px solid #111' : '2px solid #ccc',
                background: useDefault ? '#f0f0e8' : '#f8f8f4',
                cursor: 'pointer',
                transition: 'border 0.15s, background 0.15s',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon_default.png" alt="デフォルトMEORA" style={{ width: 64, height: 64, objectFit: 'contain', display: 'block' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#111', marginBottom: 4 }}>MEORA</div>
                <div style={{ fontSize: 13, color: '#888' }}>デフォルトキャラクター</div>
              </div>
              <div style={{
                width: 24, height: 24, border: '2px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: useDefault ? '#111' : '#fff',
              }}>
                {useDefault && <span style={{ color: '#fff', fontSize: 16, fontWeight: 900, lineHeight: 1 }}>✓</span>}
              </div>
            </div>
          </div>

          {/* MEORA名 */}
          <div style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: '16px 14px' }}>
            {sectionLabel('MEORA名')}
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="MEORAの名前を入力"
              maxLength={20}
              style={inputStyle}
            />
          </div>

          {/* 見た目 */}
          <div style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: '16px 14px' }}>
            {sectionLabel('見た目')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {SPRITE_ROWS.map(({ type, label }) => {
                const src = spriteMap[type];
                const isDefaultIdle = useDefault && type === 'idle';
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
                      <div style={{ flexShrink: 0, width: 54, height: 54, border: '2px solid #111', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {isDefaultIdle ? (
                          <img src="/icon_default.png" alt={label} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                        ) : src ? (
                          <img src={src} alt={label} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                        ) : (
                          <span style={{ fontSize: 11, color: '#bbb', fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', textAlign: 'center', lineHeight: 1.4 }}>画像<br/>なし</span>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#111', letterSpacing: '0.04em' }}>{label}</div>
                      </div>
                      <div style={{ flexShrink: 0, display: 'flex', gap: 6 }}>
                        {!isDefaultIdle && (
                          <button
                            onClick={() => fileRefs.current[type]?.click()}
                            style={{ padding: '7px 12px', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', background: '#111', color: '#fff', border: '2px solid #111', boxShadow: '2px 2px 0 #555', cursor: 'pointer', borderRadius: 0, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}
                          >
                            {src ? '変更' : '設定'}
                          </button>
                        )}
                        {src && !isDefaultIdle && (
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

          {/* プレビュー（見た目の下） */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 16px 16px', background: '#111', border: '2px solid #111', boxShadow: '4px 4px 0 #555' }}>
            <div style={{ background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(255,255,255,0.2)', padding: 16, marginBottom: 12 }}>
              {useDefault ? (
                <img src="/icon_default.png" alt={name || 'MEORA'} style={{ width: 100, height: 100, objectFit: 'contain', display: 'block' }} />
              ) : previewSrc ? (
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

          {/* 性格・口調 */}
          <div style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: '16px 14px' }}>
            {sectionLabel('性格・口調')}
            <div style={{ fontSize: 14, color: '#666', lineHeight: 1.6, marginBottom: 10 }}>
              ここに書いた内容がMEORAの話し方になります。
            </div>
            <div style={{ fontSize: 14, color: '#888', lineHeight: 1.6, marginBottom: 10 }}>
              テンプレートを使って性格や口調を指定できます。
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <button
                onClick={() => setPersonality(prev => prev ? prev : PERSONALITY_TEMPLATE)}
                style={{ padding: '6px 12px', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', background: '#fff', color: '#111', border: '2px solid #111', boxShadow: '2px 2px 0 #111', cursor: 'pointer', borderRadius: 0, letterSpacing: '0.04em' }}
              >
                テンプレートを挿入
              </button>
              <button
                onClick={() => setPersonality(PERSONALITY_OMAKASE)}
                style={{ padding: '6px 12px', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', background: '#111', color: '#fff', border: '2px solid #111', boxShadow: '2px 2px 0 #111', cursor: 'pointer', borderRadius: 0, letterSpacing: '0.04em' }}
              >
                おまかせ
              </button>
            </div>
            <textarea
              value={personality}
              onChange={e => setPersonality(e.target.value)}
              placeholder="例: 性格は、おっとり聞き上手。口調は、やわらかい敬語まじりのタメ口。"
              rows={7}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 120, lineHeight: 1.7 }}
            />
          </div>

          {/* いま使っているAIの個性を引き継ぐ */}
          <InheritPersonaCopy />

          {/* 作成ボタン */}
          <button
            onClick={handleSave}
            disabled={!canSave}
            style={{ width: '100%', background: canSave ? '#111' : '#999', color: '#fff', border: `2px solid ${canSave ? '#111' : '#999'}`, boxShadow: canSave ? '4px 4px 0 #555' : 'none', padding: '16px 20px', fontSize: 18, fontWeight: 800, letterSpacing: '0.08em', cursor: canSave ? 'pointer' : 'not-allowed', borderRadius: 0, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            MEORAを作る →
          </button>
        </div>
      </div>
    </div>
  );
}
