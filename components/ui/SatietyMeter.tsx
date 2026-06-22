'use client';
import { useId } from 'react';
import { Energy, getMeterLevel } from '@/lib/energy';

// 胃（い）のモノクロSVGアイコン。満腹メーターの代わりに、胃が満たされる量で
// 満腹度を表す。内部HPの数値は一切出さない（3段階の見た目のみ）。
// 残量割合 → level(0〜3) に応じて、胃の下から塗りが上がる。
const STOMACH_PATH =
  'M11 3 C11 6 9 7 8 9 C5 12 5 19 10 21 C14 23 19 21 18 15 C17.5 12 16 10 14 10 C13 10 13 6 13 3 Z';

export function SatietyMeter({
  energy,
  dark = false,
  size = 26,
}: {
  energy: Energy;
  dark?: boolean;
  size?: number;
}) {
  const clipId = useId();
  const level = getMeterLevel(energy);
  const stroke = dark ? '#fff' : '#111';
  // 空腹に近いほど警告色（黄）、それ以外はアクセント（ピンク）。
  const fill = level <= 1 ? '#ffcf59' : '#e8568a';
  const vb = 24;
  const fillH = (level / 3) * vb;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ display: 'block' }} aria-label="満腹度">
      <defs>
        <clipPath id={clipId}>
          <path d={STOMACH_PATH} />
        </clipPath>
      </defs>
      {/* 胃の中身（下から満ちる） */}
      {fillH > 0 && (
        <rect x="0" y={vb - fillH} width="24" height={fillH} fill={fill} clipPath={`url(#${clipId})`} />
      )}
      {/* 胃の輪郭 */}
      <path d={STOMACH_PATH} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
