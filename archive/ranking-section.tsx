// アーカイブ: マーケットトップのランキングセクション
// 後々追加するかもしれないため保存。
// 復活時は market-data.ts の RANKING_CHARACTERS エクスポートも復活させること。

/*
// market-data.ts に追加:
export const RANKING_CHARACTERS: MarketCharacter[] = [...MARKET_CHARACTERS].sort(
  (a, b) => b.acquiredCount - a.acquiredCount
);

// market/page.tsx のキャラタブ内に追加:
<SectionLabel>RANKING — 今週</SectionLabel>
<div style={{ margin: '0 14px', border: '2px solid #111', boxShadow: '4px 4px 0 #111', background: '#fff' }}>
  {RANKING_CHARACTERS.map((char, i) => {
    const isLast = i === RANKING_CHARACTERS.length - 1;
    const top = i < 3;
    return (
      <div key={char.id} onClick={() => goChar(char.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderBottom: isLast ? 'none' : '1px solid #ddd', cursor: 'pointer' }}>
        <span style={{ fontSize: 14, fontWeight: 800, width: 22, textAlign: 'center', color: top ? '#e8568a' : '#111' }}>{i + 1}</span>
        <div style={{ width: 38, height: 38, border: '2px solid #111', flexShrink: 0, background: char.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <CharacterIcon char={char} size={38} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{char.name}</div>
          <div style={{ fontSize: 10, color: '#7a746c', marginTop: 1 }}>@{char.creatorId}</div>
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#555', textAlign: 'right', flexShrink: 0 }}>
          入手 {char.acquiredCount.toLocaleString()}
        </div>
      </div>
    );
  })}
</div>
*/
