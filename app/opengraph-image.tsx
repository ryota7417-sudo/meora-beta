import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'MEORA — あなただけのAIキャラクターと、もっと近くに。';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#f7f5f0',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          fontFamily: 'serif',
        }}
      >
        {/* grid lines */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'repeating-linear-gradient(to right, rgba(0,0,0,0.10) 0px, rgba(0,0,0,0.10) 1px, transparent 1px, transparent 40px), repeating-linear-gradient(to bottom, rgba(0,0,0,0.10) 0px, rgba(0,0,0,0.10) 1px, transparent 1px, transparent 40px)',
          display: 'flex',
        }} />

        {/* card */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          background: '#fff',
          border: '3px solid #111',
          boxShadow: '8px 8px 0 #111',
          padding: '56px 80px',
          position: 'relative',
        }}>
          {/* BETA badge */}
          <div style={{
            position: 'absolute', top: 24, right: 24,
            background: '#e8568a', color: '#fff',
            fontSize: 18, fontWeight: 800, padding: '4px 12px',
            border: '2px solid #fff',
            display: 'flex',
          }}>
            BETA
          </div>

          <div style={{
            fontSize: 108, fontWeight: 900, color: '#111',
            letterSpacing: '-0.04em', lineHeight: 1,
            display: 'flex',
          }}>
            MEORA
          </div>

          <div style={{
            width: 80, height: 4, background: '#111', margin: '24px 0',
            display: 'flex',
          }} />

          <div style={{
            fontSize: 30, color: '#555',
            letterSpacing: '0.04em',
            display: 'flex',
          }}>
            AI Character Chat App
          </div>

          <div style={{
            display: 'flex', gap: 16, marginTop: 40,
          }}>
            {['SAIO', 'OOKUCHIBASHI', 'KIRILIN'].map(name => (
              <div key={name} style={{
                background: '#f7f5f0', border: '2px solid #111',
                boxShadow: '3px 3px 0 #111',
                padding: '10px 18px', fontSize: 20, fontWeight: 800,
                display: 'flex',
              }}>
                {name}
              </div>
            ))}
          </div>
        </div>

        {/* URL */}
        <div style={{
          position: 'absolute', bottom: 30,
          fontSize: 20, color: '#999', letterSpacing: '0.04em',
          display: 'flex',
        }}>
          meora.aritude.com
        </div>
      </div>
    ),
    { ...size },
  );
}
