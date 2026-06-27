'use client';
import { type CharEnergy } from '@/lib/energy';

export function SatietyMeter({
  charEnergy,
  name,
  compact = false,
}: {
  charEnergy: CharEnergy;
  name?: string;
  compact?: boolean;
}) {
  const max = charEnergy.maxHp || 30;
  const hp = Math.max(0, charEnergy.hp);
  const ratio = Math.min(1, hp / max);
  const hpDisplay = hp < 10 ? hp.toFixed(1) : Math.floor(hp).toString();

  const barColor = ratio > 0.5 ? '#4a8' : ratio > 0.2 ? '#c90' : '#c33';

  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 60, height: 10, border: '2px solid #111', background: '#eee', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${ratio * 100}%`, background: barColor, transition: 'width 0.3s' }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#111', whiteSpace: 'nowrap' }}>
          {hpDisplay} / {max}
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
      {name && (
        <span style={{ fontSize: 14, fontWeight: 800, color: '#111', whiteSpace: 'nowrap', flexShrink: 0 }}>
          {name}のお腹の様子
        </span>
      )}
      <div style={{ flex: 1, height: 14, border: '2px solid #111', background: '#eee', position: 'relative', minWidth: 60 }}>
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${ratio * 100}%`, background: barColor, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#111', whiteSpace: 'nowrap', flexShrink: 0 }}>
        {hpDisplay} / {max}
      </span>
    </div>
  );
}
