'use client';

export function ReleaseSoonModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)', padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(320px, 100%)', background: '#f7f5f0',
          border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: 24,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.1em', color: '#7a746c', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>
          準備中
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>
          リリース後に公開
        </div>
        <p style={{ fontSize: 14, color: '#3a3530', lineHeight: 1.7, marginBottom: 20 }}>
          この機能はベータ版では非公開です。<br />正式リリース後にご利用いただけます。
        </p>
        <button
          onClick={onClose}
          style={{
            width: '100%', background: '#111', color: '#fff',
            border: '2px solid #111', boxShadow: '3px 3px 0 #555',
            fontSize: 15, fontWeight: 800, padding: '11px 0',
            cursor: 'pointer', fontFamily: 'inherit', borderRadius: 0,
          }}
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
