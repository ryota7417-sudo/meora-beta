'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { loadState, saveState, AppState, Character } from '@/lib/store';
import { InheritPersonaCopy } from '@/components/InheritPersonaCopy';
import { PixelArtEditor } from '@/components/PixelArtEditor';

const PERSONALITY_TEMPLATE = `性格は、
口調は、
語尾は、
口癖は、
あなたの呼び方は、
得意な話題は、
苦手な話題は、`;

const PERSONALITY_OMAKASE = `性格は、楽観的で明るい
口調は、フレンドリー
語尾は、だで、だっけな
口癖は、知らんけど
あなたの呼び方は、しゃちょう
得意な話題は、ブラックジョーク
苦手な話題は、怖い話`;

function mirrorDataUrl(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(img, -img.width, 0);
      ctx.restore();
      resolve(canvas.toDataURL('image/png'));
    };
    img.src = dataUrl;
  });
}

type SpriteSlot = 'idle' | 'walkRight' | 'walkLeft';

export default function CharacterEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [appState, setAppState] = useState<AppState | null>(null);
  const [name, setName] = useState('');
  const [personality, setPersonality] = useState('');
  const [isDefaultIcon, setIsDefaultIcon] = useState(false);

  const [idleArt, setIdleArt] = useState<string | null>(null);
  const [walkRightArt, setWalkRightArt] = useState<string | null>(null);
  const [walkLeftArt, setWalkLeftArt] = useState<string | null>(null);
  const [idleHistory, setIdleHistory] = useState<string[]>([]);
  const [walkRightHistory, setWalkRightHistory] = useState<string[]>([]);
  const [walkLeftHistory, setWalkLeftHistory] = useState<string[]>([]);

  const [editingSlot, setEditingSlot] = useState<SpriteSlot | null>(null);

  useEffect(() => {
    const s = loadState();
    if (!s.onboardingDone) { router.replace('/onboarding'); return; }
    const found = s.characters.find(c => c.id === id);
    if (!found) { router.replace('/dashboard'); return; }
    setAppState(s);
    setName(found.name);
    setPersonality(found.personality ?? '');

    const idleSprite = found.sprites?.find(sp => sp.type === 'idle');
    const rightSprite = found.sprites?.find(sp => sp.type === 'walkRight');
    const leftSprite = found.sprites?.find(sp => sp.type === 'walkLeft');
    const existingArt = idleSprite?.dataUrl ?? found.photo ?? null;

    if (existingArt === '/icon_default.png') {
      setIsDefaultIcon(true);
    } else if (existingArt) {
      setIdleArt(existingArt);
    }
    if (rightSprite) setWalkRightArt(rightSprite.dataUrl);
    if (leftSprite) setWalkLeftArt(leftSprite.dataUrl);
  }, [id, router]);

  const pushHistory = (setter: React.Dispatch<React.SetStateAction<string[]>>, current: string | null, next: string) => {
    if (current && current !== next) {
      setter(prev => [current, ...prev.filter(h => h !== current)].slice(0, 5));
    }
  };

  const handleSpriteSave = (dataUrl: string) => {
    if (editingSlot === 'idle') {
      pushHistory(setIdleHistory, idleArt, dataUrl);
      setIdleArt(dataUrl);
      setIsDefaultIcon(false);
    } else if (editingSlot === 'walkRight') {
      pushHistory(setWalkRightHistory, walkRightArt, dataUrl);
      setWalkRightArt(dataUrl);
    } else if (editingSlot === 'walkLeft') {
      pushHistory(setWalkLeftHistory, walkLeftArt, dataUrl);
      setWalkLeftArt(dataUrl);
    }
    setEditingSlot(null);
  };

  const makeHistorySelect = (
    current: string | null,
    setter: React.Dispatch<React.SetStateAction<string | null>>,
    historySetter: React.Dispatch<React.SetStateAction<string[]>>,
    extra?: () => void,
  ) => (selected: string) => {
    if (current && current !== selected) {
      historySetter(prev => [current, ...prev.filter(h => h !== selected)].slice(0, 5));
    }
    setter(selected);
    extra?.();
  };

  const handleIdleHistorySelect = makeHistorySelect(idleArt, setIdleArt, setIdleHistory, () => setIsDefaultIcon(false));
  const handleWalkRightHistorySelect = makeHistorySelect(walkRightArt, setWalkRightArt, setWalkRightHistory);
  const handleWalkLeftHistorySelect = makeHistorySelect(walkLeftArt, setWalkLeftArt, setWalkLeftHistory);

  const previewSrc: string | null = isDefaultIcon ? '/icon_default.png' : idleArt ?? null;

  const handleSave = async () => {
    if (!appState) return;

    let photo: string | undefined;
    let sprites: { type: 'idle' | 'walkRight' | 'walkLeft'; dataUrl: string }[] | undefined;

    if (isDefaultIcon) {
      photo = '/icon_default.png';
      sprites = undefined;
    } else {
      let finalWalkRight = walkRightArt;
      let finalWalkLeft = walkLeftArt;
      if (walkRightArt && !walkLeftArt) {
        finalWalkLeft = await mirrorDataUrl(walkRightArt);
      } else if (walkLeftArt && !walkRightArt) {
        finalWalkRight = await mirrorDataUrl(walkLeftArt);
      }
      const list: { type: 'idle' | 'walkRight' | 'walkLeft'; dataUrl: string }[] = [];
      if (idleArt) list.push({ type: 'idle', dataUrl: idleArt });
      if (finalWalkRight) list.push({ type: 'walkRight', dataUrl: finalWalkRight });
      if (finalWalkLeft) list.push({ type: 'walkLeft', dataUrl: finalWalkLeft });
      photo = idleArt ?? undefined;
      sprites = list.length > 0 ? list : undefined;
    }

    const updated: Character[] = appState.characters.map(c =>
      c.id === id
        ? {
            ...c,
            name: name.trim() || c.name,
            photo,
            sprites,
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

  const SpriteRow = ({
    art,
    slot,
    label,
    optional,
    autoNote,
    history,
    onHistorySelect,
  }: {
    art: string | null;
    slot: SpriteSlot;
    label: string;
    optional?: boolean;
    autoNote?: string;
    history?: string[];
    onHistorySelect?: (dataUrl: string) => void;
  }) => (
    <div style={{ border: '1.5px solid #111', padding: 12, background: '#f8f8f4' }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: '#333', marginBottom: 8, letterSpacing: '0.04em' }}>
        {label}{optional && <span style={{ fontSize: 11, color: '#999', fontWeight: 600, marginLeft: 6 }}>オプション</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flexShrink: 0, width: 60, height: 60, border: '2px solid #111', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {art ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={art} alt={label} style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }} />
          ) : (
            <span style={{ fontSize: 10, color: '#bbb', fontWeight: 700, fontFamily: 'var(--font-mono)', textAlign: 'center', lineHeight: 1.4 }}>未設定</span>
          )}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button
            onClick={() => setEditingSlot(slot)}
            style={{ padding: '8px 12px', fontSize: 13, fontWeight: 800, fontFamily: 'inherit', background: '#111', color: '#fff', border: '2px solid #111', boxShadow: '2px 2px 0 #555', cursor: 'pointer', borderRadius: 0, letterSpacing: '0.02em' }}
          >
            {art ? '描き直す' : 'ドット絵を描く'}
          </button>
          {art && (
            <button
              onClick={() => {
                if (slot === 'idle') setIdleArt(null);
                else if (slot === 'walkRight') setWalkRightArt(null);
                else setWalkLeftArt(null);
              }}
              style={{ padding: '6px 12px', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', background: '#fff', color: '#111', border: '2px solid #111', cursor: 'pointer', borderRadius: 0 }}
            >
              削除
            </button>
          )}
        </div>
      </div>
      {autoNote && !art && (
        <div style={{ fontSize: 12, color: '#999', marginTop: 6, lineHeight: 1.5 }}>{autoNote}</div>
      )}
      {history && history.length > 0 && onHistorySelect && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#888', letterSpacing: '0.1em', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>HISTORY（クリックで復元）</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {history.map((h, i) => (
              <button
                key={i}
                onClick={() => onHistorySelect(h)}
                style={{ width: 44, height: 44, padding: 2, border: '2px solid #111', background: '#fff', cursor: 'pointer', borderRadius: 0, flexShrink: 0 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={h} alt={`履歴${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated', display: 'block' }} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {editingSlot && (
        <PixelArtEditor
          initialDataUrl={
            editingSlot === 'idle' ? idleArt ?? undefined :
            editingSlot === 'walkRight' ? walkRightArt ?? undefined :
            walkLeftArt ?? undefined
          }
          onSave={handleSpriteSave}
          onClose={() => setEditingSlot(null)}
        />
      )}

      <div style={light}>
        <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column' }}>

          {/* ヘッダー */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '14px 16px 12px', borderBottom: '2px solid #111', backgroundColor: '#f8f8f4', position: 'sticky', top: 0, zIndex: 10 }}>
            <div><button onClick={() => router.back()} style={{ fontSize: 14, fontWeight: 600, color: '#111', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>← 戻る</button></div>
            <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '0.04em', textAlign: 'center', whiteSpace: 'nowrap' }}>MEORAを編集</div>
            <div />
          </div>

          {/* プレビュー */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 16px 16px', background: '#fff', margin: '14px 16px 0', border: '2px solid #111', boxShadow: '4px 4px 0 #111' }}>
            <div style={{ background: '#f8f8f4', border: '2px solid #111', padding: 16, marginBottom: 12 }}>
              {previewSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewSrc} alt={name || 'MEORA'} style={{ width: 100, height: 100, objectFit: 'contain', display: 'block', imageRendering: 'pixelated' }} />
              ) : (
                <div style={{ width: 100, height: 100, border: '2px dashed #ccc', background: '#f0f0ec', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  未設定
                </div>
              )}
            </div>
            <div style={{ color: '#111', fontSize: 18, fontWeight: 800, letterSpacing: '0.04em' }}>
              {name || 'あなたのMEORA'}
            </div>
          </div>

          <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* MEORA名 */}
            <div style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: '16px 14px' }}>
              {sectionLabel('MEORA名')}
              <input type="text" value={name} onChange={e => setName(e.target.value)} maxLength={20} style={inputStyle} />
            </div>

            {/* 見た目 */}
            <div style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: '16px 14px' }}>
              {sectionLabel('見た目')}

              {/* デフォルト選択 */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 8 }}>
                  デフォルトのMEORAを使うか、ドット絵を自分で描くか選べます。
                </div>
                <div
                  onClick={() => {
                    if (isDefaultIcon) {
                      setIsDefaultIcon(false);
                    } else {
                      setIsDefaultIcon(true);
                    }
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: 12,
                    border: isDefaultIcon ? '3px solid #111' : '2px solid #ccc',
                    background: isDefaultIcon ? '#f0f0e8' : '#f8f8f4',
                    cursor: 'pointer',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icon_default.png" alt="デフォルトMEORA" style={{ width: 48, height: 48, objectFit: 'contain', display: 'block' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#111', marginBottom: 2 }}>デフォルトキャラクター</div>
                    <div style={{ fontSize: 12, color: '#888' }}>MEORAの標準キャラクター</div>
                  </div>
                  <div style={{ width: 22, height: 22, border: '2px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDefaultIcon ? '#111' : '#fff', flexShrink: 0 }}>
                    {isDefaultIcon && <span style={{ color: '#fff', fontSize: 14, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                  </div>
                </div>
              </div>

              {/* ドット絵スプライト */}
              <div style={{ fontSize: 13, fontWeight: 800, color: '#666', marginBottom: 8, letterSpacing: '0.06em' }}>オリジナルのドット絵</div>
              <div style={{ fontSize: 14, color: '#666', lineHeight: 1.6, marginBottom: 10 }}>
                16×16のグリッドでドット絵を描けます。基本は必須、歩きモーションはオプションです。
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <SpriteRow
                  art={idleArt}
                  slot="idle"
                  label="基本（止まる）"
                  history={idleHistory}
                  onHistorySelect={handleIdleHistorySelect}
                />
                <SpriteRow
                  art={walkRightArt}
                  slot="walkRight"
                  label="右に歩く"
                  optional
                  autoNote="設定しない場合、基本の絵を自動的に反転して使用します。"
                  history={walkRightHistory}
                  onHistorySelect={handleWalkRightHistorySelect}
                />
                <SpriteRow
                  art={walkLeftArt}
                  slot="walkLeft"
                  label="左に歩く"
                  optional
                  autoNote="設定しない場合、右の絵（または基本の絵を反転）を自動的に使用します。"
                  history={walkLeftHistory}
                  onHistorySelect={handleWalkLeftHistorySelect}
                />
              </div>
            </div>

            {/* 性格・口調 */}
            <div style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: '16px 14px' }}>
              {sectionLabel('性格・口調')}
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
    </>
  );
}
