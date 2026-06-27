import Link from 'next/link';

const PAPER_BG: React.CSSProperties = {
  backgroundColor: '#f7f5f0',
  backgroundImage: `
    repeating-linear-gradient(to right, rgba(0,0,0,0.14) 0px, rgba(0,0,0,0.14) 1px, transparent 1px, transparent 25px),
    repeating-linear-gradient(to bottom, rgba(0,0,0,0.14) 0px, rgba(0,0,0,0.14) 1px, transparent 1px, transparent 25px)
  `,
};

export default function NotFound() {
  return (
    <div style={{ ...PAPER_BG, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, color: '#111' }}>
      <div style={{ background: '#fff', border: '2px solid #111', boxShadow: '6px 6px 0 #111', padding: '40px 32px', textAlign: 'center', maxWidth: 340, width: '100%' }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.14em', color: '#7a746c', textTransform: 'uppercase', marginBottom: 12, fontFamily: 'var(--font-mono)' }}>
          Error 404
        </div>
        <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 1, marginBottom: 16, fontFamily: 'var(--font-mono)' }}>
          404
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>
          ページが見つかりません
        </div>
        <p style={{ fontSize: 14, color: '#7a746c', lineHeight: 1.7, marginBottom: 28 }}>
          URLが間違っているか、ページが削除された可能性があります。
        </p>
        <Link
          href="/dashboard"
          style={{
            display: 'block',
            background: '#111',
            color: '#fff',
            border: '2px solid #111',
            boxShadow: '4px 4px 0 #555',
            fontSize: 15,
            fontWeight: 800,
            padding: '12px 0',
            textDecoration: 'none',
            textAlign: 'center',
            letterSpacing: '0.04em',
          }}
        >
          ホームへ戻る
        </Link>
      </div>
    </div>
  );
}
