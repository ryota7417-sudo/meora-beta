'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

const GRID = 16;
const CELL = 18;
const CANVAS_PX = GRID * CELL; // 288px

const PALETTE: string[] = [
  'transparent',
  '#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff',
  '#cc0000', '#ff6600', '#ffcc00', '#33cc00', '#006633', '#009999',
  '#0066cc', '#3300cc', '#9900cc', '#cc0099', '#884400', '#ffaa88',
];

type Pixels = string[];

function makeEmpty(): Pixels {
  return Array(GRID * GRID).fill('transparent');
}

function exportToPng(pixels: Pixels, outSize = 64): string {
  const scale = outSize / GRID;
  const canvas = document.createElement('canvas');
  canvas.width = outSize;
  canvas.height = outSize;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, outSize, outSize);
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const c = pixels[y * GRID + x];
      if (c === 'transparent') continue;
      ctx.fillStyle = c;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
  return canvas.toDataURL('image/png');
}

function loadFromDataUrl(dataUrl: string): Promise<Pixels> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const offscreen = document.createElement('canvas');
      offscreen.width = GRID;
      offscreen.height = GRID;
      const ctx = offscreen.getContext('2d');
      if (!ctx) { resolve(makeEmpty()); return; }
      ctx.drawImage(img, 0, 0, GRID, GRID);
      const data = ctx.getImageData(0, 0, GRID, GRID).data;
      const px = makeEmpty();
      for (let i = 0; i < GRID * GRID; i++) {
        const a = data[i * 4 + 3];
        if (a < 10) continue;
        const r = data[i * 4];
        const g = data[i * 4 + 1];
        const b = data[i * 4 + 2];
        px[i] = `rgb(${r},${g},${b})`;
      }
      resolve(px);
    };
    img.onerror = () => resolve(makeEmpty());
    img.src = dataUrl;
  });
}

export function PixelArtEditor({
  initialDataUrl,
  onSave,
  onClose,
}: {
  initialDataUrl?: string;
  onSave: (dataUrl: string) => void;
  onClose: () => void;
}) {
  const [pixels, setPixels] = useState<Pixels>(makeEmpty);
  const [color, setColor] = useState('#000000');
  const [isEraser, setIsEraser] = useState(false);
  const [history, setHistory] = useState<Pixels[]>([]);
  const drawing = useRef(false);
  const lastPainted = useRef<number>(-1);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!initialDataUrl || initialDataUrl.startsWith('/')) return;
    loadFromDataUrl(initialDataUrl).then(setPixels);
  }, [initialDataUrl]);

  // キャンバス描画
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_PX, CANVAS_PX);
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        const c = pixels[y * GRID + x];
        if (c === 'transparent') {
          ctx.fillStyle = (x + y) % 2 === 0 ? '#ddd' : '#bbb';
        } else {
          ctx.fillStyle = c;
        }
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
      }
    }
    // グリッド線
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, CANVAS_PX); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(CANVAS_PX, i * CELL); ctx.stroke();
    }
  }, [pixels]);

  const getIdx = useCallback((clientX: number, clientY: number): number => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return -1;
    const x = Math.floor((clientX - rect.left) / CELL);
    const y = Math.floor((clientY - rect.top) / CELL);
    if (x < 0 || x >= GRID || y < 0 || y >= GRID) return -1;
    return y * GRID + x;
  }, []);

  const paint = useCallback((idx: number) => {
    if (idx < 0 || idx === lastPainted.current) return;
    lastPainted.current = idx;
    setPixels(prev => {
      const next = [...prev];
      next[idx] = isEraser ? 'transparent' : color;
      return next;
    });
  }, [color, isEraser]);

  const startDraw = useCallback((idx: number) => {
    drawing.current = true;
    lastPainted.current = -1;
    setHistory(h => [...h.slice(-29), pixels]);
    paint(idx);
  }, [paint, pixels]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    startDraw(getIdx(e.clientX, e.clientY));
  };
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    paint(getIdx(e.clientX, e.clientY));
  };
  const handleMouseUp = () => { drawing.current = false; };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    startDraw(getIdx(e.touches[0].clientX, e.touches[0].clientY));
  };
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!drawing.current) return;
    paint(getIdx(e.touches[0].clientX, e.touches[0].clientY));
  };
  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    drawing.current = false;
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    setPixels(history[history.length - 1]);
    setHistory(h => h.slice(0, -1));
  };

  const handleClear = () => {
    setHistory(h => [...h.slice(-29), pixels]);
    setPixels(makeEmpty());
  };

  const handleSave = () => {
    onSave(exportToPng(pixels, 128));
  };

  const selectColor = (c: string) => {
    if (c === 'transparent') {
      setIsEraser(true);
    } else {
      setIsEraser(false);
      setColor(c);
    }
  };

  const checkerBg = 'linear-gradient(45deg, #bbb 25%, transparent 25%, transparent 75%, #bbb 75%) 0 0 / 8px 8px, linear-gradient(45deg, #bbb 25%, transparent 25%, transparent 75%, #bbb 75%) 4px 4px / 8px 8px';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', overflowY: 'auto' }}>
      <div style={{ background: '#f8f8f4', border: '2px solid #111', boxShadow: '6px 6px 0 #111', width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column' }}>

        {/* ヘッダー */}
        <div style={{ padding: '10px 14px', borderBottom: '2px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#111' }}>
          <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '0.08em', color: '#fff', fontFamily: 'var(--font-mono)' }}>DOT ART EDITOR</div>
          <button onClick={onClose} style={{ fontSize: 13, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', letterSpacing: '0.04em' }}>
            キャンセル
          </button>
        </div>

        {/* キャンバス */}
        <div style={{ padding: 14, display: 'flex', justifyContent: 'center' }}>
          <canvas
            ref={canvasRef}
            width={CANVAS_PX}
            height={CANVAS_PX}
            style={{
              display: 'block',
              cursor: 'crosshair',
              touchAction: 'none',
              border: '2px solid #111',
              boxShadow: '3px 3px 0 #111',
              imageRendering: 'pixelated',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
        </div>

        {/* パレット */}
        <div style={{ padding: '0 14px 10px' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#666', letterSpacing: '0.12em', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>COLOR</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {PALETTE.map((c) => {
              const selected = c === 'transparent' ? isEraser : (!isEraser && color === c);
              return (
                <button
                  key={c}
                  onClick={() => selectColor(c)}
                  style={{
                    width: 26, height: 26,
                    background: c === 'transparent' ? checkerBg : c,
                    border: selected ? '3px solid #111' : '1.5px solid #888',
                    cursor: 'pointer',
                    borderRadius: 0,
                    outline: 'none',
                    boxShadow: selected ? '2px 2px 0 #111' : 'none',
                    flexShrink: 0,
                  }}
                  title={c === 'transparent' ? '消しゴム' : c}
                />
              );
            })}
          </div>
          <div style={{ marginTop: 6, fontSize: 12, color: '#888', fontWeight: 700 }}>
            {isEraser ? '消しゴム' : `選択中: ${color}`}
          </div>
        </div>

        {/* 操作ボタン */}
        <div style={{ padding: '0 14px 10px', display: 'flex', gap: 6 }}>
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            style={{ flex: 1, padding: '8px 0', fontSize: 13, fontWeight: 700, background: '#fff', color: history.length ? '#111' : '#bbb', border: `2px solid ${history.length ? '#111' : '#ddd'}`, cursor: history.length ? 'pointer' : 'not-allowed', borderRadius: 0, fontFamily: 'inherit' }}
          >
            元に戻す
          </button>
          <button
            onClick={handleClear}
            style={{ flex: 1, padding: '8px 0', fontSize: 13, fontWeight: 700, background: '#fff', color: '#111', border: '2px solid #111', cursor: 'pointer', borderRadius: 0, fontFamily: 'inherit' }}
          >
            全消し
          </button>
        </div>

        {/* 完成ボタン */}
        <div style={{ padding: '0 14px 14px' }}>
          <button
            onClick={handleSave}
            style={{ width: '100%', background: '#111', color: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #555', padding: '14px 0', fontSize: 16, fontWeight: 800, cursor: 'pointer', borderRadius: 0, fontFamily: 'inherit', letterSpacing: '0.08em' }}
          >
            完成 →
          </button>
        </div>
      </div>
    </div>
  );
}
