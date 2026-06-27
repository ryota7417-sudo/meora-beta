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
    <div style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: '16px 14px' }}>
      <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#666', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>
        {t.inheritTitle}
      </div>
      <div style={{ fontSize: 14, color: '#555', lineHeight: 1.8, marginBottom: 14 }}>
        現在、利用中のAIが持っている設定や喋り方などの設定をMEORAに引き継ぐことができます。引き継ぐことによって、元のAIが削除されるようなことはありません。元のAIも変わりなくご利用いただけます。
      </div>
      <div style={{ fontSize: 14, color: '#666', lineHeight: 2.0, marginBottom: 14 }}>
        <div>① 下記ボタンの「プロンプトをコピー」を押す</div>
        <div>② いつも使っているAI(ChatGPT等)に貼り付け・送信</div>
        <div style={{ paddingLeft: 16, marginTop: 6, marginBottom: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a
            href="https://chat.openai.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '5px 12px',
              fontSize: 13,
              fontWeight: 700,
              background: '#fff',
              color: '#111',
              border: '2px solid #111',
              boxShadow: '2px 2px 0 #111',
              textDecoration: 'none',
              letterSpacing: '0.02em',
            }}
          >
            ChatGPTを開く
          </a>
          <a
            href="https://gemini.google.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '5px 12px',
              fontSize: 13,
              fontWeight: 700,
              background: '#fff',
              color: '#111',
              border: '2px solid #111',
              boxShadow: '2px 2px 0 #111',
              textDecoration: 'none',
              letterSpacing: '0.02em',
            }}
          >
            Geminiを開く
          </a>
        </div>
        <div>③ 返ってきた文章を全てコピーし、上の「性格・口調」に貼り付け</div>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        style={{
          width: '100%',
          background: copied ? '#4caf50' : '#111',
          color: '#fff',
          border: '2px solid #111',
          boxShadow: copied ? 'none' : '4px 4px 0 #555',
          padding: '11px 14px',
          fontSize: 15,
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
