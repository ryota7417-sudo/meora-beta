'use client';
import { useState, useEffect } from 'react';

const APP_URL = 'https://meora.aritude.com';

export function BrowserGuard() {
  const [mode, setMode] = useState<'non-safari' | 'pwa-guide' | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/.test(ua);
    if (!isIOS) return;

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as never as { standalone: boolean }).standalone === true;
    if (isStandalone) return;

    const isSafari =
      /Safari/.test(ua) &&
      !/CriOS/.test(ua) &&
      !/FxiOS/.test(ua) &&
      !/OPiOS/.test(ua);

    if (!isSafari) {
      setMode('non-safari');
      return;
    }

    if (!localStorage.getItem('meora-pwa-shown')) {
      setMode('pwa-guide');
    }
  }, []);

  const closePwa = () => {
    localStorage.setItem('meora-pwa-shown', '1');
    setMode(null);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(APP_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  if (!mode) return null;

  if (mode === 'non-safari') {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', padding: 20 }}>
        <div style={{ width: 'min(340px, 100%)', background: '#f7f5f0', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.1em', color: '#7a746c', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>
            ご案内
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>
            Safariで開いてください
          </div>
          <p style={{ fontSize: 14, color: '#3a3530', lineHeight: 1.7, marginBottom: 20 }}>
            MEORAはSafariでの利用を推奨しています。下のボタンからSafariで開いてください。
          </p>
          <a
            href={`x-safari-${APP_URL}`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#111', color: '#fff',
              border: '2px solid #111', boxShadow: '3px 3px 0 #555',
              fontSize: 15, fontWeight: 800, padding: '12px 0',
              cursor: 'pointer', fontFamily: 'inherit',
              textDecoration: 'none', marginBottom: 12,
            }}
          >
            Safariを開く
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: '#fff', border: '1.5px solid #ddd', fontSize: 13, color: '#555', marginBottom: 10 }}>
            <span style={{ flex: 1, wordBreak: 'break-all' }}>{APP_URL}</span>
            <button
              onClick={handleCopy}
              style={{ flexShrink: 0, background: '#111', color: '#fff', border: 'none', padding: '5px 10px', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {copied ? '済み' : 'コピー'}
            </button>
          </div>
          <p style={{ fontSize: 12, color: '#888', textAlign: 'center', lineHeight: 1.4 }}>
            URLをコピーしてSafariのアドレスバーに貼り付けてください
          </p>
        </div>
      </div>
    );
  }

  const steps = [
    '画面右下の[・・・]を押す',
    '[共有]を押す',
    '下にスライドさせて[ホーム画面に追加]を押す',
    '[追加]を押す',
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
      <div style={{
        width: '100%', maxWidth: 390, background: '#f7f5f0',
        border: '2px solid #111', borderBottom: 'none', boxShadow: '0 -4px 0 #111',
        padding: 20, paddingBottom: 'calc(20px + env(safe-area-inset-bottom))',
      }}>
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 10 }}>
          快適に使うためのヒント
        </div>
        <p style={{ fontSize: 14, color: '#3a3530', lineHeight: 1.6, marginBottom: 14 }}>
          このままこの画面を閉じてご利用いただけますが、下記手順を踏むと快適にご利用できます。
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
          {steps.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{
                flexShrink: 0, width: 22, height: 22,
                background: '#111', color: '#fff',
                fontSize: 12, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {i + 1}
              </span>
              <span style={{ fontSize: 14, color: '#3a3530', lineHeight: 1.5 }}>{step}</span>
            </div>
          ))}
        </div>
        <button
          onClick={closePwa}
          style={{
            width: '100%', background: '#111', color: '#fff',
            border: '2px solid #111', boxShadow: '3px 3px 0 #555',
            fontSize: 15, fontWeight: 800, padding: '12px 0',
            cursor: 'pointer', fontFamily: 'inherit', borderRadius: 0,
          }}
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
