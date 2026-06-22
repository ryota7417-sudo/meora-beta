'use client';
import { Energy, getMeterLevel } from '@/lib/energy';

// 満腹度の胃アイコン（public/hp/00〜03.png）。内部HPの数値は出さず、
// 残量割合 → level(0〜3) に応じて、空腹→満腹の胃アイコンを切り替える。
//   00=空腹 / 01=目盛り1 / 02=目盛り2 / 03=満腹
const ICONS = ['/hp/00.png', '/hp/01.png', '/hp/02.png', '/hp/03.png'];
const LABELS = ['空腹', 'お腹が空いている', '少しお腹が空いている', '満腹'];

export function SatietyMeter({
  energy,
  size = 26,
}: {
  energy: Energy;
  // dark は後方互換のため受けるが、画像アイコンのため見た目には影響しない。
  dark?: boolean;
  size?: number;
}) {
  const level = getMeterLevel(energy);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={ICONS[level]}
      alt={`満腹度: ${LABELS[level]}`}
      width={size}
      height={size}
      style={{ display: 'block', imageRendering: 'pixelated' }}
    />
  );
}
