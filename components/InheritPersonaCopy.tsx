'use client';
import { useState } from 'react';
import { Lang, DICT, DEFAULT_LANG } from '@/lib/i18n';

// 「いま使っているAIの個性を引き継ぐ」コピーUI。
// 性格・口調フィールドの近くに置く。ワンクリックでプロンプト全文をコピーする。
// オンボーディングの言語(lang)に応じて、UI 文言とコピーされるプロンプト本体を切り替える。
export function InheritPersonaCopy({ lang = DEFAULT_LANG }: { lang?: Lang }) {
  const [copied, setCopied] = useState(false);
  const t = DICT[lang];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(t.inheritPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // クリップボード API 不可時のフォールバック
      try {
        const ta = document.createElement('textarea');
        ta.value = t.inheritPrompt;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // 何もできない場合は無視
      }
    }
  };

  return (
    <div style={{ background: '#111', border: '2px solid #111', boxShadow: '4px 4px 0 #555', padding: '14px 14px', marginTop: 4 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', letterSpacing: '0.04em', marginBottom: 8, lineHeight: 1.5 }}>
        {t.inheritTitle}
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: 12 }}>
        {t.inheritSteps}
      </div>
      <button
        type="button"
        onClick={handleCopy}
        style={{
          width: '100%',
          background: copied ? '#4caf50' : '#fff',
          color: copied ? '#fff' : '#111',
          border: '2px solid #fff',
          boxShadow: '3px 3px 0 rgba(255,255,255,0.3)',
          padding: '11px 14px',
          fontSize: 13,
          fontWeight: 800,
          fontFamily: 'inherit',
          letterSpacing: '0.03em',
          cursor: 'pointer',
          borderRadius: 0,
          textAlign: 'center',
        }}
      >
        {copied ? t.inheritCopied : t.inheritCopy}
      </button>
    </div>
  );
}
