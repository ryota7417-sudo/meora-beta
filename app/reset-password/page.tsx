'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const translateAuthError = (msg: string): string => {
    if (msg.match(/you can only request this after (\d+) seconds/i)) {
      const sec = msg.match(/after (\d+) seconds/i)?.[1] ?? '30';
      return `セキュリティのため、${sec}秒後にもう一度お試しください。`;
    }
    if (msg.match(/new password should be different/i)) return '新しいパスワードは以前と異なるものを設定してください。';
    if (msg.match(/password should be at least/i)) return 'パスワードは8文字以上で入力してください。';
    if (msg.match(/auth session missing/i)) return 'セッションが切れました。もう一度リセットメールのリンクをクリックしてください。';
    return msg;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('パスワードが一致しません。');
      return;
    }
    if (password.length < 8) {
      setError('パスワードは8文字以上で入力してください。');
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(translateAuthError(updateError.message));
    } else {
      setDone(true);
    }
  };

  const light = {
    backgroundColor: '#f8f8f4',
    backgroundImage: 'linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)',
    backgroundSize: '24px 24px',
    minHeight: '100vh',
    display: 'flex' as const,
    justifyContent: 'center' as const,
    alignItems: 'flex-start' as const,
    padding: '24px 16px 48px',
  };

  if (done) {
    return (
      <div style={light}>
        <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '14px 0 12px', marginBottom: 20, borderBottom: '2px solid #111' }}>
            <div />
            <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '0.04em', textAlign: 'center', whiteSpace: 'nowrap' }}>パスワードリセット完了</div>
            <div />
          </div>

          <div style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: '28px 20px', marginBottom: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 42, marginBottom: 16 }}>✓</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#111', marginBottom: 12, lineHeight: 1.6 }}>
              パスワードを変更しました
            </div>
            <div style={{ fontSize: 16, color: '#555', lineHeight: 1.8 }}>
              新しいパスワードでログインできます。
            </div>
          </div>

          <button
            onClick={() => router.replace('/onboarding')}
            style={{ width: '100%', background: '#111', color: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #555', padding: '14px 20px', fontSize: 18, fontWeight: 800, letterSpacing: '0.06em', cursor: 'pointer', borderRadius: 0, fontFamily: 'inherit' }}
          >
            ログインへ →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={light}>
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '14px 0 12px', marginBottom: 20, borderBottom: '2px solid #111' }}>
          <div />
          <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '0.04em', textAlign: 'center', whiteSpace: 'nowrap' }}>新しいパスワードを設定</div>
          <div />
        </div>

        {error && (
          <div style={{ background: '#fff0f0', border: '2px solid #cc2222', padding: '10px 14px', marginBottom: 16, fontSize: 15, color: '#cc2222', letterSpacing: '0.02em', lineHeight: 1.5 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.06em', color: '#111', textTransform: 'uppercase' }}>新しいパスワード</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="8文字以上"
                  style={{ width: '100%', border: '2px solid #111', background: '#fff', padding: '12px 60px 12px 14px', fontSize: 17, color: '#111', outline: 'none', borderRadius: 0, fontFamily: 'inherit' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: '4px 8px', fontSize: 14, fontWeight: 700, color: '#888', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  {showPassword ? '非表示' : '表示'}
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.06em', color: '#111', textTransform: 'uppercase' }}>新しいパスワード（確認）</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                placeholder="もう一度入力"
                style={{ width: '100%', border: '2px solid #111', background: '#fff', padding: '12px 14px', fontSize: 17, color: '#111', outline: 'none', borderRadius: 0, fontFamily: 'inherit' }}
              />
            </div>
            <span style={{ fontSize: 13, color: '#999', letterSpacing: '0.02em' }}>英字・数字を含む8文字以上</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', background: loading ? '#555' : '#111', color: '#fff', border: '2px solid #111', boxShadow: loading ? 'none' : '4px 4px 0 #555', padding: '14px 20px', fontSize: 18, fontWeight: 800, letterSpacing: '0.06em', cursor: loading ? 'not-allowed' : 'pointer', borderRadius: 0, fontFamily: 'inherit' }}
          >
            {loading ? '処理中...' : 'パスワードを変更する'}
          </button>
        </form>
      </div>
    </div>
  );
}
