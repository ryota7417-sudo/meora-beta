'use client';

import { useState, useEffect } from 'react';
import { getSnsStyle, saveSnsStyle, trackUsage } from '@/lib/storage';
import type { SnsStyle } from '@/lib/storage';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';

function makeGrokPrompt(xId: string) {
  return `Analyze the X account ${xId}. Summarize this user's posting style, personality, tone, common topics, emoji usage, sentence length, values, and communication habits. Output it as a reusable prompt for another AI assistant to generate posts in this user's style. Do not include private assumptions. Focus only on public posting style.`;
}

export default function SettingsPage() {
  const [step, setStep] = useState<'select' | 'enter-id' | 'grok-prompt' | 'enter-style' | 'done'>('select');
  const [accountId, setAccountId] = useState('');
  const [styleInput, setStyleInput] = useState('');
  const [saved, setSaved] = useState<SnsStyle | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    trackUsage('settings');
    getSnsStyle('x').then((style) => {
      if (style) {
        setSaved(style);
        setStep('done');
      }
    });
  }, []);

  async function handleSave() {
    if (!styleInput.trim()) return;
    setSaving(true);
    try {
      const result = await saveSnsStyle('x', accountId.trim(), styleInput.trim());
      setSaved(result);
      setStep('done');
    } finally {
      setSaving(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(makeGrokPrompt(accountId)).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleReset() {
    setSaved(null);
    setAccountId('');
    setStyleInput('');
    setStep('select');
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-gray-800">投稿スタイルの設定</h2>

      {step === 'select' && (
        <Card className="flex flex-col gap-4">
          <p className="text-base text-gray-700">どのSNSのスタイルを登録する？🐥</p>
          <Button size="lg" onClick={() => setStep('enter-id')}>
            X（旧 Twitter）
          </Button>
          <p className="text-xs text-gray-400">Instagram などは今後対応予定</p>
        </Card>
      )}

      {step === 'enter-id' && (
        <Card className="flex flex-col gap-4">
          <p className="text-base text-gray-700">X のアカウント ID を教えて 🐥</p>
          <input
            type="text"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            placeholder="@yourhandle"
            autoCapitalize="none"
            autoCorrect="off"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-amber-400"
          />
          <Button onClick={() => setStep('grok-prompt')} disabled={!accountId.trim()}>
            次へ
          </Button>
          <button type="button" onClick={() => setStep('select')} className="text-sm text-gray-400 self-center">
            戻る
          </button>
        </Card>
      )}

      {step === 'grok-prompt' && (
        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-3">
            <p className="text-base text-gray-700">Grok にこのプロンプトを送ってみて 🐥</p>
            <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-700 leading-relaxed font-mono break-all">
              {makeGrokPrompt(accountId)}
            </div>
            <Button variant="secondary" onClick={handleCopy}>
              {copied ? 'コピーしました！' : 'コピーする'}
            </Button>
            <p className="text-xs text-gray-400 leading-relaxed">
              Grok が {accountId} の投稿スタイルを分析して、文体プロンプトを返してくれます。
              その文章を次の画面に貼り付けると、X 投稿生成に反映されます。
            </p>
          </Card>
          <Button size="lg" onClick={() => setStep('enter-style')}>
            Grok の返答が届いたら次へ
          </Button>
          <button type="button" onClick={() => setStep('enter-id')} className="text-sm text-gray-400 self-center">
            戻る
          </button>
        </div>
      )}

      {step === 'enter-style' && (
        <Card className="flex flex-col gap-4">
          <p className="text-base text-gray-700">Grok からもらったプロンプトをここに貼り付けて 🐥</p>
          <textarea
            value={styleInput}
            onChange={(e) => setStyleInput(e.target.value)}
            placeholder="Grok の返答をここにペースト…"
            rows={7}
            className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-amber-400 leading-relaxed"
          />
          <Button onClick={handleSave} disabled={!styleInput.trim() || saving}>
            {saving ? '保存中…' : '保存する'}
          </Button>
          <button type="button" onClick={() => setStep('grok-prompt')} className="text-sm text-gray-400 self-center">
            戻る
          </button>
        </Card>
      )}

      {step === 'done' && saved && (
        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-3">
            <p className="text-sm text-gray-500">登録済みのスタイル</p>
            <div className="flex items-center gap-2">
              <span className="text-lg">𝕏</span>
              <span className="text-base font-medium text-gray-800">{saved.account_id}</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed line-clamp-4">{saved.style_prompt}</p>
          </Card>
          <p className="text-sm text-gray-500 text-center">このスタイルが X 投稿の生成に使われます 🐥</p>
          <Button variant="secondary" size="sm" className="self-center" onClick={handleReset}>
            スタイルを変更する
          </Button>
        </div>
      )}
    </div>
  );
}
