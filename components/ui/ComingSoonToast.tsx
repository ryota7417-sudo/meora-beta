'use client';
import { useEffect } from 'react';
import { WrenchIcon } from '@/components/ui/Icons';

// 決済・サブスク・投げ銭などの未実装機能を押したときに出す「準備中」モーダル。
// バックエンド/決済が無いためビジュアルのスタブ。message が null のときは非表示。
export function ComingSoonToast({
  message,
  onClose,
}: {
  message: string | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 2600);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        maxWidth: 390,
        margin: '0 auto',
        background: 'rgba(17,17,17,0.42)',
        zIndex: 400,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          border: '2px solid #111',
          boxShadow: '4px 4px 0 #111',
          padding: '22px 20px 18px',
          width: '100%',
          maxWidth: 300,
          textAlign: 'center',
        }}
      >
        <div style={{ width: 54, height: 54, margin: '0 auto 10px', border: '2px solid #111', boxShadow: '3px 3px 0 #111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <WrenchIcon size={28} color="#111" />
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#111', marginBottom: 6 }}>
          準備中（近日対応）
        </div>
        <div style={{ fontSize: 12, color: '#555', lineHeight: 1.6, marginBottom: 16 }}>{message}</div>
        <button
          onClick={onClose}
          style={{
            width: '100%',
            background: '#111',
            color: '#fff',
            border: '2px solid #111',
            boxShadow: '3px 3px 0 #555',
            fontSize: 13,
            fontWeight: 800,
            padding: '10px 0',
            cursor: 'pointer',
            borderRadius: 0,
            fontFamily: 'inherit',
          }}
        >
          OK
        </button>
      </div>
    </div>
  );
}
