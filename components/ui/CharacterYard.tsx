'use client';
// MEORAが歩く庭。
// 与えられた characters を枠内で歩かせ、時々 walk↔idle を切替え、
// ランダムに独り言の吹き出しを出す。タップでチャットへ遷移する。
//
// 世界観: レトロ×AI。背景は黒〜濃グレー + 方眼紙グリッド（暗色版）。
// モノクロのレトロな地面/装飾のみ。草原色・絵文字は使わない。
//
// パフォーマンス: 位置更新は ref + 直接 style 操作で行い、React 再レンダーは
// 「向き/状態の切替」「吹き出しの出し入れ」など最小限に限定する。
// アニメは requestAnimationFrame（約30fpsにスロットル）。

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Character, getSprite } from '@/lib/store';

// 最大表示体数。超過分は先頭 N 体のみ。
const MAX_CHARS = 10;

// スプライト/アバターの表示サイズ（px）。
const SPRITE_W = 112;
const SPRITE_H = 112;

// 独り言の汎用プール（JA・絵文字なし）。
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

// 1体分のランタイム状態（ref で保持し DOM を直接動かす）。
type Mover = {
  char: Character;
  x: number;
  y: number;
  vx: number; // px/sec（符号で向き）
  vy: number; // y方向速度（px/sec）
  dir: 'left' | 'right';
  state: 'walk' | 'idle';
  // 次に walk/idle を切替える時刻（performance.now() ベース・ms）
  nextStateChangeAt: number;
  // 次に独り言を出す時刻
  nextTalkAt: number;
  // 吹き出しを消す時刻（0 = 非表示）
  talkUntil: number;
  talkText: string;
  el: HTMLDivElement | null;
};

// React に「向き / 状態 / 吹き出し」を伝えるための表示用スナップショット。
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

// 1体のスプライト表示。dir / state に応じて出す画像を切替える。
// 該当スプライトが無ければ photo（左向きは CSS 反転）。photo も無ければイニシャル。
function SpriteVisual({ char, view }: { char: Character; view: View }) {
  const wantType = view.state === 'idle' ? 'idle' : view.dir === 'right' ? 'walkRight' : 'walkLeft';
  let src = getSprite(char, wantType);
  let flip = false;

  if (!src) {
    // 歩行スプライトが無い場合、反対向きの歩行 → idle の順で代替し、無ければ photo。
    if (view.state === 'walk') {
      const opp = view.dir === 'right' ? 'walkLeft' : 'walkRight';
      const oppSrc = getSprite(char, opp);
      if (oppSrc) {
        src = oppSrc;
        flip = true; // 反対向き画像を反転して使う
      }
    }
    if (!src) src = getSprite(char, 'idle');
  }
  if (!src && char.photo) {
    src = char.photo;
    // photo は右向き想定。左を向くなら反転。
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

  // フォールバック: イニシャルの黒枠アバター。
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

export function CharacterYard({ characters }: { characters: Character[] }) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const moversRef = useRef<Mover[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  const list = characters.slice(0, MAX_CHARS);

  // 向き/状態/吹き出しの表示スナップショット（id -> View）。
  // 位置はここに含めない（位置は ref + 直接 style で動かす）。
  const [views, setViews] = useState<Record<string, View>>({});
  // ループ内の差分判定用に「最後にコミットした View」を ref で持つ（stale closure 回避）。
  const lastViewsRef = useRef<Record<string, View>>({});

  // movers の初期化。characters の id 構成が変わったときだけ作り直す。
  const idsKey = list.map((c) => c.id).join('|');

  useEffect(() => {
    const container = containerRef.current;
    const W = container?.clientWidth ?? 360;
    const H = container?.clientHeight ?? 240;

    const now = performance.now();
    // y のバンド（地に足がついた配置）: 下寄りの帯に散らす。
    const bandTop = Math.max(8, H * 0.35);
    const bandBottom = Math.max(bandTop + 1, H - SPRITE_H - 8);

    const movers: Mover[] = list.map((char, i) => {
      const dir: 'left' | 'right' = Math.random() < 0.5 ? 'left' : 'right';
      const speed = rand(35, 60);
      // 重なりすぎない初期配置: 横方向に概ね等間隔 + ランダムゆらぎ。
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
      };
    });
    moversRef.current = movers;

    // 初期 View を設定。
    const initViews: Record<string, View> = {};
    movers.forEach((m) => {
      initViews[m.char.id] = { dir: m.dir, state: m.state, talk: null };
    });
    // 外部（コンテナ寸法・乱数）から初期化したスナップショットを反映する。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setViews(initViews);
    lastViewsRef.current = initViews;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  // 各 mover の DOM 参照を登録する ref コールバック。
  const setMoverEl = useCallback((id: string, el: HTMLDivElement | null) => {
    const m = moversRef.current.find((mm) => mm.char.id === id);
    if (m) {
      m.el = el;
      if (el) {
        el.style.transform = `translate3d(${m.x}px, ${m.y}px, 0)`;
      }
    }
  }, []);

  // アニメーションループ。
  useEffect(() => {
    if (list.length === 0) return;

    let viewDirty = false;
    const THROTTLE = 33; // ms（約30fps）

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

        if (t >= m.nextStateChangeAt) {
          m.state = m.state === 'walk' ? 'idle' : 'walk';
          m.nextStateChangeAt = t + (m.state === 'walk' ? rand(5000, 12000) : rand(800, 2000));
          // walk開始時にy方向速度をランダムに設定
          if (m.state === 'walk') {
            m.vy = rand(-0.5, 0.5);
          }
        }

        // 移動（walk のときだけ）。
        if (m.state === 'walk') {
          m.x += m.vx * dtSec;
          m.y += m.vy * dtSec;
          // 端で反転（スプライト幅を考慮してクランプ）。
          if (m.x <= 0) {
            m.x = 0;
            m.vx = Math.abs(m.vx);
            m.dir = 'right';
          } else if (m.x >= maxX) {
            m.x = maxX;
            m.vx = -Math.abs(m.vx);
            m.dir = 'left';
          }
          // y方向の端で反転（コンテナの高さに応じたバンド内に収める）。
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

        // y のクランプ（リサイズ対策）。
        if (m.y > maxY) m.y = maxY;
        if (m.y < 0) m.y = 0;

        // DOM を直接動かす（再レンダー無し）。
        if (m.el) {
          m.el.style.transform = `translate3d(${m.x.toFixed(1)}px, ${m.y.toFixed(1)}px, 0)`;
          m.el.style.zIndex = String(Math.round(m.y));
        }

        // 独り言の出し入れ。
        if (m.talkUntil > 0 && t >= m.talkUntil) {
          m.talkUntil = 0;
          m.talkText = '';
        } else if (m.talkUntil === 0 && t >= m.nextTalkAt) {
          m.talkText = pick(getTalkLines());
          m.talkUntil = t + rand(2600, 4200);
          m.nextTalkAt = m.talkUntil + rand(4000, 11000);
        }

        const talk = m.talkUntil > 0 ? m.talkText : null;
        nextViews[m.char.id] = { dir: m.dir, state: m.state, talk };

        // 向き/状態/吹き出しのいずれかが変化したときだけ再レンダーする。
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
    // 差分判定は lastViewsRef を使うため views を依存に入れない（ref中心設計）。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  // ボビング（上下揺れ）アニメーション用CSSキーフレームを一度だけ注入。
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

  // 背景（白 + 方眼紙グリッド明色版）。
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
      {/* 地面装飾（破線ライン）*/}
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
        return (
          <div
            key={char.id}
            ref={(el) => setMoverEl(char.id, el)}
            onClick={() => router.push(`/chat/${char.id}`)}
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
              animation: view.state === 'walk' ? 'meora-bob 0.4s ease-in-out infinite' : 'none',
            }}
          >
            {/* 吹き出し（白背景・黒太枠・Nosutaru・絵文字なし）。頭上に表示。 */}
            {view.talk && (
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

            <SpriteVisual char={char} view={view} />
          </div>
        );
      })}
    </div>
  );
}
