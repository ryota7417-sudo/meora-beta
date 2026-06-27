'use client';
// MEORAが歩く庭。
// 与えられた characters を枠内で歩かせ、時々 walk↔idle を切替え、
// ランダムに独り言の吹き出しを出す。タップでチャットオーバーレイを開く。
//
// thinking 状態: メッセージ送信中はキャラが立ち止まり、
// 頭の右上に考え中アニメーション（think_1.svg / think_2.svg 交互表示）を出す。
// 回答完了後は停止を続け、20秒無メッセージで歩き再開。

import { useEffect, useRef, useState, useCallback } from 'react';
import { Character, getSprite, getEquippedSkinUrls } from '@/lib/store';

const MAX_CHARS = 10;
const SPRITE_W = 112;
const SPRITE_H = 112;
const RESUME_WALK_DELAY = 20_000;

const TALK_LINES = [
  '今日もいい天気',
  'ひまだな〜',
  'なにしてあそぼ',
  'ねむい…',
  '呼んでくれてもいいんだよ',
  'おなかすいたかも',
  'さんぽ、たのしい',
  'きみのこと、まってた',
  'なんかいいことないかな',
  'ちょっとだけ、おしゃべりしたい',
  'のんびりいこ',
  'えへへ',
];

const LATE_NIGHT_LINES = [
  'もう遅いよ、そろそろ寝なよ',
  'おやすみの時間だよ〜',
  '明日もあるでしょ？寝よ？',
  'スマホ置いて、目つぶって',
  '夜ふかしはお肌の敵だよ',
  'ちゃんと寝た方がいいよ',
  '今日はもうおしまい！おやすみ！',
  '寝ないと明日つらいよ〜',
];

function getTalkLines(): string[] {
  const h = new Date().getHours();
  if (h >= 0 && h < 5) return LATE_NIGHT_LINES;
  return TALK_LINES;
}

type Mover = {
  char: Character;
  x: number;
  y: number;
  vx: number;
  vy: number;
  dir: 'left' | 'right';
  state: 'walk' | 'idle';
  nextStateChangeAt: number;
  nextTalkAt: number;
  talkUntil: number;
  talkText: string;
  el: HTMLDivElement | null;
  frozen: boolean;
};

type View = {
  dir: 'left' | 'right';
  state: 'walk' | 'idle';
  talk: string | null;
};

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function initialOf(name: string): string {
  const trimmed = (name || '').trim();
  return trimmed ? Array.from(trimmed)[0] : '?';
}

function resolveFlip(char: Character, view: View): boolean {
  const wantType = view.state === 'idle' ? 'idle' : view.dir === 'right' ? 'walkRight' : 'walkLeft';
  let src = getSprite(char, wantType);
  let flip = false;

  if (!src) {
    if (view.state === 'walk') {
      const opp = view.dir === 'right' ? 'walkLeft' : 'walkRight';
      if (getSprite(char, opp)) {
        flip = true;
      }
    }
    if (!getSprite(char, wantType) && !flip) src = getSprite(char, 'idle');
  }
  if (!src && !flip && char.photo) {
    flip = view.dir === 'left';
  }
  return flip;
}

function SpriteVisual({ char, view }: { char: Character; view: View }) {
  const wantType = view.state === 'idle' ? 'idle' : view.dir === 'right' ? 'walkRight' : 'walkLeft';
  let src = getSprite(char, wantType);
  let flip = false;

  if (!src) {
    if (view.state === 'walk') {
      const opp = view.dir === 'right' ? 'walkLeft' : 'walkRight';
      const oppSrc = getSprite(char, opp);
      if (oppSrc) {
        src = oppSrc;
        flip = true;
      }
    }
    if (!src) src = getSprite(char, 'idle');
  }
  if (!src && char.photo) {
    src = char.photo;
    flip = view.dir === 'left';
  }

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={char.name}
        draggable={false}
        style={{
          width: SPRITE_W,
          height: SPRITE_H,
          objectFit: 'contain',
          display: 'block',
          imageRendering: 'pixelated',
          transform: flip ? 'scaleX(-1)' : 'none',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: SPRITE_W,
        height: SPRITE_H,
        border: '2px solid #111',
        background: '#fff',
        color: '#111',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 24,
        fontWeight: 800,
        boxShadow: '2px 2px 0 rgba(0,0,0,0.3)',
        fontFamily: 'var(--font-display)',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      {initialOf(char.name)}
    </div>
  );
}

function ThinkingBubble() {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setFrame(f => (f + 1) % 2), 600);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{
      position: 'absolute',
      top: -6,
      right: -6,
      width: 32,
      height: 32,
      zIndex: 60,
      pointerEvents: 'none',
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={frame === 0 ? '/thinking/think_1.svg' : '/thinking/think_2.svg'}
        alt=""
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}

export type YardThinkingState = Record<string, boolean>;
export type YardFrozenState = Record<string, boolean>;

type Props = {
  characters: Character[];
  onCharacterTap?: (charId: string) => void;
  thinkingState?: YardThinkingState;
  frozenState?: YardFrozenState;
};

export function CharacterYard({ characters, onCharacterTap, thinkingState = {}, frozenState = {} }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const moversRef = useRef<Mover[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  const list = characters.slice(0, MAX_CHARS);

  const [views, setViews] = useState<Record<string, View>>({});
  const lastViewsRef = useRef<Record<string, View>>({});

  const idsKey = list.map((c) => c.id).join('|');

  useEffect(() => {
    const container = containerRef.current;
    const W = container?.clientWidth ?? 360;
    const H = container?.clientHeight ?? 240;

    const now = performance.now();
    const bandTop = Math.max(8, H * 0.35);
    const bandBottom = Math.max(bandTop + 1, H - SPRITE_H - 8);

    const movers: Mover[] = list.map((char, i) => {
      const dir: 'left' | 'right' = Math.random() < 0.5 ? 'left' : 'right';
      const speed = rand(35, 60);
      const slot = list.length > 0 ? (W - SPRITE_W) / list.length : 0;
      const x = Math.min(
        Math.max(0, slot * i + rand(0, Math.max(1, slot * 0.5))),
        Math.max(0, W - SPRITE_W),
      );
      const y = rand(bandTop, bandBottom);
      return {
        char,
        x,
        y,
        vx: dir === 'right' ? speed : -speed,
        vy: rand(-0.3, 0.3),
        dir,
        state: 'walk' as const,
        nextStateChangeAt: now + rand(2000, 5000),
        nextTalkAt: now + rand(2500, 9000),
        talkUntil: 0,
        talkText: '',
        el: null,
        frozen: false,
      };
    });
    moversRef.current = movers;

    const initViews: Record<string, View> = {};
    movers.forEach((m) => {
      initViews[m.char.id] = { dir: m.dir, state: m.state, talk: null };
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setViews(initViews);
    lastViewsRef.current = initViews;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  // frozenState からキャラのfrozenフラグを更新
  useEffect(() => {
    for (const m of moversRef.current) {
      const shouldFreeze = frozenState[m.char.id] ?? false;
      if (shouldFreeze && !m.frozen) {
        m.frozen = true;
        m.state = 'idle';
      } else if (!shouldFreeze && m.frozen) {
        m.frozen = false;
        m.state = 'walk';
        m.nextStateChangeAt = performance.now() + rand(5000, 12000);
        m.vy = rand(-0.5, 0.5);
      }
    }
  }, [frozenState]);

  const setMoverEl = useCallback((id: string, el: HTMLDivElement | null) => {
    const m = moversRef.current.find((mm) => mm.char.id === id);
    if (m) {
      m.el = el;
      if (el) {
        el.style.transform = `translate3d(${m.x}px, ${m.y}px, 0)`;
      }
    }
  }, []);

  useEffect(() => {
    if (list.length === 0) return;

    let viewDirty = false;
    const THROTTLE = 33;

    const tick = (t: number) => {
      rafRef.current = requestAnimationFrame(tick);
      if (!lastTickRef.current) {
        lastTickRef.current = t;
        return;
      }
      const dt = t - lastTickRef.current;
      if (dt < THROTTLE) return;
      lastTickRef.current = t;

      const container = containerRef.current;
      if (!container) return;
      const W = container.clientWidth;
      const H = container.clientHeight;
      const maxX = Math.max(0, W - SPRITE_W);
      const maxY = Math.max(0, H - SPRITE_H);
      const dtSec = dt / 1000;

      const movers = moversRef.current;
      const nextViews: Record<string, View> = {};
      viewDirty = false;

      for (const m of movers) {
        const prevView = lastViewsRef.current[m.char.id];

        // frozen キャラは強制idle、移動しない
        if (m.frozen) {
          m.state = 'idle';
        } else {
          if (t >= m.nextStateChangeAt) {
            m.state = m.state === 'walk' ? 'idle' : 'walk';
            m.nextStateChangeAt = t + (m.state === 'walk' ? rand(5000, 12000) : rand(800, 2000));
            if (m.state === 'walk') {
              m.vy = rand(-0.5, 0.5);
            }
          }
        }

        if (m.state === 'walk' && !m.frozen) {
          m.x += m.vx * dtSec;
          m.y += m.vy * dtSec;
          if (m.x <= 0) {
            m.x = 0;
            m.vx = Math.abs(m.vx);
            m.dir = 'right';
          } else if (m.x >= maxX) {
            m.x = maxX;
            m.vx = -Math.abs(m.vx);
            m.dir = 'left';
          }
          const bandTop = Math.max(8, H * 0.35);
          const bandBottom = Math.max(bandTop + 1, H - SPRITE_H - 8);
          if (m.y <= bandTop) {
            m.y = bandTop;
            m.vy = Math.abs(m.vy);
          } else if (m.y >= bandBottom) {
            m.y = bandBottom;
            m.vy = -Math.abs(m.vy);
          }
        }

        if (m.y > maxY) m.y = maxY;
        if (m.y < 0) m.y = 0;

        if (m.el) {
          m.el.style.transform = `translate3d(${m.x.toFixed(1)}px, ${m.y.toFixed(1)}px, 0)`;
          m.el.style.zIndex = String(Math.round(m.y));
        }

        // 独り言（frozen中は出さない）
        if (m.frozen) {
          m.talkUntil = 0;
          m.talkText = '';
        } else {
          if (m.talkUntil > 0 && t >= m.talkUntil) {
            m.talkUntil = 0;
            m.talkText = '';
          } else if (m.talkUntil === 0 && t >= m.nextTalkAt) {
            m.talkText = pick(getTalkLines());
            m.talkUntil = t + rand(2600, 4200);
            m.nextTalkAt = m.talkUntil + rand(4000, 11000);
          }
        }

        const talk = m.talkUntil > 0 ? m.talkText : null;
        nextViews[m.char.id] = { dir: m.dir, state: m.state, talk };

        if (
          !prevView ||
          prevView.dir !== m.dir ||
          prevView.state !== m.state ||
          prevView.talk !== talk
        ) {
          viewDirty = true;
        }
      }

      if (viewDirty) {
        lastViewsRef.current = nextViews;
        setViews(nextViews);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTickRef.current = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  useEffect(() => {
    if (document.getElementById('meora-yard-keyframes')) return;
    const style = document.createElement('style');
    style.id = 'meora-yard-keyframes';
    style.textContent = `
      @keyframes meora-bob {
        0%, 100% { margin-top: 0; }
        50% { margin-top: -4px; }
      }
    `;
    document.head.appendChild(style);
  }, []);

  const yardBg: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#f7f5f0',
    backgroundImage: `
      repeating-linear-gradient(to right, rgba(0,0,0,0.07) 0px, rgba(0,0,0,0.07) 1px, transparent 1px, transparent 24px),
      repeating-linear-gradient(to bottom, rgba(0,0,0,0.07) 0px, rgba(0,0,0,0.07) 1px, transparent 1px, transparent 24px)
    `,
    borderBottom: '2px solid #111',
  };

  if (list.length === 0) {
    return (
      <div ref={containerRef} style={yardBg}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: 24,
            textAlign: 'center',
          }}
        >
          <span
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: 'rgba(0,0,0,0.55)',
              letterSpacing: '0.06em',
              lineHeight: 1.7,
              fontFamily: 'var(--font-display)',
            }}
          >
            まだホームにMEORAがいません
          </span>
          <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.35)', letterSpacing: '0.04em', lineHeight: 1.7 }}>
            下からMEORAを作る / 探すと、ここを歩きはじめます
          </span>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={yardBg}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 18,
          height: 0,
          borderTop: '1px dashed rgba(0,0,0,0.12)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 36,
          height: 0,
          borderTop: '1px dashed rgba(0,0,0,0.06)',
          pointerEvents: 'none',
        }}
      />

      {list.map((char) => {
        const view = views[char.id] ?? { dir: 'right' as const, state: 'idle' as const, talk: null };
        const isThinking = thinkingState[char.id] ?? false;
        const isFrozen = frozenState[char.id] ?? false;
        return (
          <div
            key={char.id}
            ref={(el) => setMoverEl(char.id, el)}
            onClick={() => onCharacterTap?.(char.id)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: SPRITE_W,
              willChange: 'transform',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              animation: view.state === 'walk' && !isFrozen ? 'meora-bob 0.4s ease-in-out infinite' : 'none',
            }}
          >
            {view.talk && !isThinking && (
              <div
                style={{
                  position: 'absolute',
                  bottom: SPRITE_H + 6,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#fff',
                  border: '2px solid #111',
                  boxShadow: '2px 2px 0 #111',
                  padding: '4px 8px',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#111',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.02em',
                  fontFamily: 'var(--font-display)',
                  pointerEvents: 'none',
                  zIndex: 50,
                }}
              >
                {view.talk}
              </div>
            )}

            <div style={{ position: 'relative', width: SPRITE_W, height: SPRITE_H }}>
              <SpriteVisual char={char} view={isFrozen ? { ...view, state: 'idle' } : view} />
              {(() => {
                const skins = getEquippedSkinUrls(char.id);
                const flip = resolveFlip(char, isFrozen ? { ...view, state: 'idle' } : view);
                const overlayStyle: React.CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', imageRendering: 'pixelated', transform: flip ? 'scaleX(-1)' : 'none' };
                return (
                  <>
                    {skins.wear && <img src={skins.wear} alt="" style={overlayStyle} />}
                    {skins.hat && <img src={skins.hat} alt="" style={overlayStyle} />}
                  </>
                );
              })()}
              {isThinking && <ThinkingBubble />}
            </div>
          </div>
        );
      })}
    </div>
  );
}
