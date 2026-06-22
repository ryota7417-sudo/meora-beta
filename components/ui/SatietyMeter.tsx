'use client';
import { Energy, getMeterLevel, getMeterSurplus } from '@/lib/energy';

// 満腹度の胃アイコン（public/hp/00〜03.png）。内部HPの数値は出さず、
// 残量割合 → level(0〜3) に応じて、空腹→満腹の胃アイコンを切り替える。
//   00=空腹 / 01=目盛り1 / 02=目盛り2 / 03=満腹
// 上限（満タン）を超えて貯まっている分は、アイコンの隣に "+X"（満タン何個分）で表示する。
const ICONS = ['/hp/00.png', '/hp/01.png', '/hp/02.png', '/hp/03.png'];
const LABELS = ['空腹', 'お腹が空いている', '少しお腹が空いている', '満腹'];

export function SatietyMeter({
  energy,
  size = 26,
  showSurplus = true,
}: {
  energy: Energy;
  // dark は後方互換のため受けるが、画像アイコンのため見た目には影響しない。
  dark?: boolean;
  size?: number;
  showSurplus?: boolean;
}) {
  const level = getMeterLevel(energy);
  const surplus = getMeterSurplus(energy);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ICONS[level]}
        alt={`満腹度: ${LABELS[level]}`}
        width={size}
        height={size}
        style={{ display: 'block', imageRendering: 'pixelated' }}
      />
      {showSurplus && surplus > 0 && (
        <span style={{ fontSize: Math.max(11, size * 0.42), fontWeight: 800, color: '#e8568a', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
          +{surplus}
        </span>
      )}
    </span>
  );
}
