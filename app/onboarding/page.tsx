'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { saveState, loadState, Character, Sprite, SpriteType } from '@/lib/store';
import { createClient } from '@/lib/supabase';
import { resolveAuth } from '@/lib/auth';
import { InheritPersonaCopy } from '@/components/InheritPersonaCopy';
import { Lang, Dict, DICT, LANGS, LANG_LABELS, loadLang, saveLang, DEFAULT_LANG } from '@/lib/i18n';

// オンボーディングで作成する自分のMEORAの下書き型。
type CharDraft = {
  name: string;
  sprites: Sprite[];
  personality: string;
};

const SPRITE_ROWS: { type: SpriteType; label: string }[] = [
  { type: 'idle',      label: '基本（止まる）' },
  { type: 'walkRight', label: '右に歩く' },
  { type: 'walkLeft',  label: '左に歩く' },
];

const PERSONALITY_TEMPLATE = `性格は、
口調は、
語尾は、
口癖は、
ユーザーへの呼びかけは、
得意な話題は、
苦手な話題は、`;

// 画像を最大 maxSize px に収まるよう縮小し dataURL(PNG) で返す。透過を維持する。
function resizeImageToDataUrl(file: File, maxSize = 512): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 改行(\n)入りの文言を <br/> 区切りで描画するヘルパ。
function withBreaks(text: string) {
  return text.split('\n').map((line, i, arr) => (
    <span key={i}>
      {line}
      {i < arr.length - 1 && <br />}
    </span>
  ));
}

// ===== スプラッシュ (step 0) =====
// メインMEORAは top_icon_1〜4.png を 1→2→3→4 の順でループ切り替えして
// 目に動き（目パチ）を出す。StepSplash 表示中ずっとループし続ける。
const SPLASH_FRAMES = ['/top_icon_1.png', '/top_icon_2.png', '/top_icon_3.png', '/top_icon_4.png'];

function StepSplash({
  onNext,
  lang,
  setLang,
  t,
}: {
  onNext: () => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Dict;
}) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setFrame(f => (f + 1) % SPLASH_FRAMES.length);
    }, 200);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      backgroundColor: '#111',
      backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
      backgroundSize: '24px 24px',
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '24px 16px',
    }}>
      {/* Decorative corners */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: 16, left: 16, width: 20, height: 20, borderTop: '2px solid rgba(255,255,255,0.18)', borderLeft: '2px solid rgba(255,255,255,0.18)' }}/>
        <div style={{ position: 'absolute', top: 16, right: 16, width: 20, height: 20, borderTop: '2px solid rgba(255,255,255,0.18)', borderRight: '2px solid rgba(255,255,255,0.18)' }}/>
        <div style={{ position: 'absolute', bottom: 16, left: 16, width: 20, height: 20, borderBottom: '2px solid rgba(255,255,255,0.18)', borderLeft: '2px solid rgba(255,255,255,0.18)' }}/>
        <div style={{ position: 'absolute', bottom: 16, right: 16, width: 20, height: 20, borderBottom: '2px solid rgba(255,255,255,0.18)', borderRight: '2px solid rgba(255,255,255,0.18)' }}/>
      </div>

      <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>

        {/* 言語切替 */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <div style={{ display: 'flex' }}>
            {LANGS.map((code) => {
              const active = code === lang;
              return (
                <button
                  key={code}
                  onClick={() => setLang(code)}
                  aria-pressed={active}
                  style={{
                    padding: '2px 6px',
                    fontSize: 12,
                    fontWeight: 700,
                    border: '2px solid rgba(255,255,255,0.5)',
                    background: active ? 'rgba(255,255,255,0.9)' : 'transparent',
                    color: active ? '#111' : 'rgba(255,255,255,0.6)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                    marginLeft: -2,
                    borderRadius: 0,
                  }}
                >
                  {LANG_LABELS[code]}
                </button>
              );
            })}
          </div>
        </div>

        {/* ロゴ */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.18em', marginBottom: 6, textAlign: 'center' }}>
            {t.splashRuby}
          </span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 900, letterSpacing: '0.08em', color: '#fff', lineHeight: 1, textAlign: 'center' }}>
            MEORA
          </span>
          <span style={{ fontSize: 15, fontWeight: 400, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.06em', marginTop: 10, textAlign: 'center' }}>
            {t.splashTagline}
          </span>
        </div>

        {/* キャラクター（top_icon_1〜4 を目パチ風にループアニメーション） */}
        <div style={{ margin: '36px 0 32px', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={SPLASH_FRAMES[frame]}
            alt="MEORA"
            width={160}
            style={{ width: 160, height: 'auto', display: 'block' }}
          />
          {/* グロー */}
          <div style={{
            position: 'absolute',
            bottom: -10,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 120,
            height: 18,
            background: 'rgba(255,255,255,0.12)',
            borderRadius: '50%',
            filter: 'blur(8px)',
          }}/>
        </div>

        {/* はじめるボタン */}
        <button onClick={onNext} style={{
          background: '#fff',
          color: '#111',
          border: '2px solid #fff',
          boxShadow: '4px 4px 0 rgba(255,255,255,0.35)',
          fontSize: 19,
          fontWeight: 800,
          letterSpacing: '0.1em',
          padding: '14px 48px',
          cursor: 'pointer',
          borderRadius: 0,
          textAlign: 'center',
          display: 'inline-block',
        }}>
          {t.start}
        </button>

        <p style={{ marginTop: 28, fontSize: 13, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.05em', textAlign: 'center' }}>
          v0.1.0 · MEORA
        </p>
      </div>
    </div>
  );
}

// ===== アプリ説明 (step 1) =====
function StepIntro({ onNext, onBack, t }: { onNext: () => void; onBack: () => void; t: Dict }) {
  const [current, setCurrent] = useState(0);
  const total = 4;

  // slides defined after hooks
  const slides = [
    {
      num: '01 / 04',
      title: t.slide1Title,
      body: t.slide1Body,
      // eslint-disable-next-line @next/next/no-img-element
      icon: <img src="/onboarding_01.svg" alt="" style={{ maxHeight: 120, maxWidth: '100%', width: 'auto', height: 'auto', display: 'block' }} />,
    },
    {
      num: '02 / 04',
      title: t.slide2Title,
      body: t.slide2Body,
      // eslint-disable-next-line @next/next/no-img-element
      icon: <img src="/onboarding_02.svg" alt="" style={{ maxHeight: 120, maxWidth: '100%', width: 'auto', height: 'auto', display: 'block', filter: 'invert(1)', mixBlendMode: 'screen' }} />,
    },
    {
      num: '03 / 04',
      title: t.slide3Title,
      body: t.slide3Body,
      // eslint-disable-next-line @next/next/no-img-element
      icon: <img src="/onboarding_03.svg" alt="" style={{ maxHeight: 120, maxWidth: '100%', width: 'auto', height: 'auto', display: 'block', filter: 'invert(1)', mixBlendMode: 'screen' }} />,
    },
    {
      num: '04 / 04',
      title: t.slide4Title,
      body: t.slide4Body,
      icon: (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/top_icon_line_3.png" alt="" style={{ height: 120, width: 'auto', display: 'block' }} />
      ),
    },
  ];

  const handleNext = () => {
    if (current < total - 1) {
      setCurrent(current + 1);
    } else {
      onNext();
    }
  };

  const touchStartX = useRef(0);

  return (
    <div style={{
      backgroundColor: '#111',
      backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
      backgroundSize: '24px 24px',
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      overflow: 'hidden',
    }}>
      <div style={{ width: '100%', maxWidth: 480, minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>

        {/* Decorative corners */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          <div style={{ position: 'absolute', top: 16, left: 16, width: 20, height: 20, borderTop: '2px solid rgba(255,255,255,0.12)', borderLeft: '2px solid rgba(255,255,255,0.12)' }}/>
          <div style={{ position: 'absolute', top: 16, right: 16, width: 20, height: 20, borderTop: '2px solid rgba(255,255,255,0.12)', borderRight: '2px solid rgba(255,255,255,0.12)' }}/>
          <div style={{ position: 'absolute', bottom: 16, left: 16, width: 20, height: 20, borderBottom: '2px solid rgba(255,255,255,0.12)', borderLeft: '2px solid rgba(255,255,255,0.12)' }}/>
          <div style={{ position: 'absolute', bottom: 16, right: 16, width: 20, height: 20, borderBottom: '2px solid rgba(255,255,255,0.12)', borderRight: '2px solid rgba(255,255,255,0.12)' }}/>
        </div>

        {/* TOP BAR */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 0', position: 'relative', zIndex: 1 }}>
          <button onClick={onBack} style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>
            {t.navBack}
          </button>
          <button onClick={onNext} style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.45)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.04em' }}>
            {t.navSkip}
          </button>
        </div>

        {/* SLIDES */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}
          onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={e => {
            const diff = touchStartX.current - e.changedTouches[0].clientX;
            if (diff > 40 && current < total - 1) setCurrent(c => c + 1);
            if (diff < -40 && current > 0) setCurrent(c => c - 1);
          }}
        >
          <div style={{ display: 'flex', height: '100%', transform: `translateX(-${current * 100}%)`, transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)' }}>
            {slides.map((slide, i) => (
              <div key={i} style={{ flexShrink: 0, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 28px 20px' }}>
                <div style={{ width: 140, height: 140, border: '2px solid rgba(255,255,255,0.25)', boxShadow: '6px 6px 0 rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 36, flexShrink: 0 }}>
                  {slide.icon}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>{slide.num}</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '0.04em', textAlign: 'center', lineHeight: 1.3, marginBottom: 16 }}>{withBreaks(slide.title)}</div>
                <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', textAlign: 'center', lineHeight: 1.8, letterSpacing: '0.02em', maxWidth: 340 }}>{withBreaks(slide.body)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* PROGRESS DOTS */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '24px 0 0' }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ width: 8, height: 8, border: '2px solid rgba(255,255,255,0.35)', background: i === current ? '#fff' : 'transparent', borderColor: i === current ? '#fff' : 'rgba(255,255,255,0.35)', transition: 'background 0.2s, border-color 0.2s' }}/>
          ))}
        </div>

        {/* BOTTOM BUTTON */}
        <div style={{ padding: '24px 20px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <button onClick={handleNext} style={{
            width: '100%',
            maxWidth: 360,
            background: '#fff',
            color: '#111',
            border: '2px solid #fff',
            boxShadow: '4px 4px 0 rgba(255,255,255,0.25)',
            fontSize: 17,
            fontWeight: 800,
            letterSpacing: '0.08em',
            padding: '14px 24px',
            cursor: 'pointer',
            borderRadius: 0,
            textAlign: 'center',
          }}>
            {current === total - 1 ? t.navToAccount : t.navNext}
          </button>
        </div>
      </div>
    </div>
  );
}

// 0.0.0.0 → localhost 正規化。Supabase の許可リストに 0.0.0.0 は入れないため。
function getAuthOrigin(): string {
  if (typeof window === 'undefined') return '';
  if (window.location.hostname === '0.0.0.0') {
    return `${window.location.protocol}//localhost:${window.location.port}`;
  }
  return window.location.origin;
}

// ===== アカウント作成 (step 2) =====
function StepAccount({ onNext, onBack, t }: { onNext: () => void; onBack: () => void; t: Dict }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState<'signup' | 'login' | 'recovery' | 'reset'>('signup');
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const translateAuthError = (msg: string): string => {
    if (msg.match(/you can only request this after (\d+) seconds/i)) {
      const sec = msg.match(/after (\d+) seconds/i)?.[1] ?? '30';
      return `セキュリティのため、${sec}秒後にもう一度お試しください。`;
    }
    if (msg.match(/email rate limit exceeded/i)) return 'メール送信の上限に達しました。しばらく待ってからお試しください。';
    if (msg.match(/user already registered/i)) return 'このメールアドレスはすでに登録されています。';
    if (msg.match(/invalid login credentials/i)) return 'メールアドレスまたはパスワードが違います。';
    if (msg.match(/email not confirmed/i)) return 'メールアドレスが確認されていません。確認メールのリンクをクリックしてください。';
    if (msg.match(/password should be at least/i)) return 'パスワードは8文字以上で入力してください。';
    if (msg.match(/unable to validate email/i)) return 'メールアドレスの形式が正しくありません。';
    if (msg.match(/signup requires a valid password/i)) return 'パスワードを入力してください。';
    if (msg.match(/new password should be different/i)) return '新しいパスワードは以前と異なるものを設定してください。';
    if (msg.match(/auth session missing/i)) return 'セッションが切れました。もう一度リセットメールのリンクをクリックしてください。';
    return msg;
  };

  const handleGoogleLogin = async () => {
    setError('');
    localStorage.setItem('meora-onboarding-step', '3');
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${getAuthOrigin()}/auth/callback?next=/onboarding`,
      },
    });
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${getAuthOrigin()}/auth/callback` },
    });
    setLoading(false);
    if (signUpError) {
      setError(translateAuthError(signUpError.message));
    } else if (data.user?.identities?.length === 0) {
      setError('このメールアドレスはすでに登録されています。ログインしてください。');
    } else {
      setEmailSent(true);
    }
  };

  const handleVerifyAndProceed = async () => {
    setError('');
    setLoading(true);
    const supabase = createClient();
    const { data: { user: verifiedUser } } = await supabase.auth.getUser();
    if (verifiedUser?.email_confirmed_at) {
      onNext();
    } else {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError('メールの確認が完了していません。メール内のリンクをクリックしてから、もう一度お試しください。');
      } else if (data.user?.email_confirmed_at) {
        onNext();
      } else {
        setError('メールの確認が完了していません。メール内のリンクをクリックしてから、もう一度お試しください。');
      }
    }
    setLoading(false);
  };

  const handleResendWithNewEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email: newEmail,
      password,
      options: { emailRedirectTo: `${getAuthOrigin()}/auth/callback` },
    });
    setLoading(false);
    if (signUpError) {
      setError(translateAuthError(signUpError.message));
    } else {
      setEmail(newEmail);
      setShowEmailChange(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError('メールアドレスまたはパスワードが違います。');
    } else {
      localStorage.setItem('meora-onboarding-step', '3');
      onNext();
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getAuthOrigin() + '/auth/reset-callback',
    });
    setLoading(false);
    if (resetError) {
      setError(translateAuthError(resetError.message));
    } else {
      setResetSent(true);
    }
  };

  const light = {
    backgroundColor: '#f8f8f4',
    backgroundImage: 'linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)',
    backgroundSize: '24px 24px',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '24px 16px 48px',
  } as const;

  const passwordField = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.06em', color: '#111', textTransform: 'uppercase' }}>{t.passwordLabel}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder={t.passwordPlaceholder}
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          minLength={8}
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
      <span style={{ fontSize: 13, color: '#999', letterSpacing: '0.02em', marginTop: 2 }}>{t.passwordHint}</span>
    </div>
  );

  // --- メール確認画面 ---
  if (emailSent) {
    return (
      <div style={light}>
        <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '14px 0 12px', marginBottom: 20, borderBottom: '2px solid #111' }}>
            <div />
            <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '0.04em', textAlign: 'center', whiteSpace: 'nowrap' }}>メール送信完了</div>
            <div />
          </div>

          <div style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: '28px 20px', margin: '0 0 20px', textAlign: 'center' }}>
            <div style={{ marginBottom: 16 }}><svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,4 12,13 2,4"/></svg></div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#111', marginBottom: 16, lineHeight: 1.6 }}>
              確認メールを送信しました
            </div>
            <div style={{ fontSize: 16, color: '#555', lineHeight: 1.8, marginBottom: 20 }}>
              <span style={{ fontWeight: 700, color: '#111' }}>{email}</span> 宛に
              <br />登録確認メールを送信しました。
              <br />メール内のリンクをクリックして
              <br />登録を完了してください。
            </div>
            <div style={{ fontSize: 14, color: '#999', lineHeight: 1.7, padding: '14px', background: '#f8f8f4', border: '1px solid #ddd' }}>
              メールが届かない場合は、迷惑メールフォルダをご確認ください。
            </div>
          </div>

          {error && (
            <div style={{ background: '#fff0f0', border: '2px solid #cc2222', padding: '10px 14px', marginBottom: 16, fontSize: 15, color: '#cc2222', letterSpacing: '0.02em', lineHeight: 1.5 }}>
              {error}
            </div>
          )}

          <button
            onClick={handleVerifyAndProceed}
            disabled={loading}
            style={{ width: '100%', background: loading ? '#555' : '#111', color: '#fff', border: '2px solid #111', boxShadow: loading ? 'none' : '4px 4px 0 #555', padding: '14px 20px', fontSize: 18, fontWeight: 800, letterSpacing: '0.06em', cursor: loading ? 'not-allowed' : 'pointer', borderRadius: 0, fontFamily: 'inherit', marginBottom: 20 }}
          >
            {loading ? t.processing : 'メールを確認しました'}
          </button>

          {showEmailChange ? (
            <form onSubmit={handleResendWithNewEmail} style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.06em', color: '#111', textTransform: 'uppercase' }}>新しいメールアドレス</label>
              <input
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                required
                placeholder="new@example.com"
                style={{ width: '100%', border: '2px solid #111', background: '#fff', padding: '12px 14px', fontSize: 17, color: '#111', outline: 'none', borderRadius: 0, fontFamily: 'inherit' }}
              />
              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', background: loading ? '#555' : '#111', color: '#fff', border: '2px solid #111', boxShadow: loading ? 'none' : '4px 4px 0 #555', padding: '12px 20px', fontSize: 16, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', borderRadius: 0, fontFamily: 'inherit' }}
              >
                確認メールを再送信
              </button>
            </form>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => setShowEmailChange(true)}
                style={{ textDecoration: 'underline', textUnderlineOffset: 3, color: '#888', fontSize: 14, cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit' }}
              >
                メールアドレスが違う場合はこちら
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- アカウント復旧画面 ---
  if (authMode === 'recovery') {
    return (
      <div style={light}>
        <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '14px 0 12px', marginBottom: 20, borderBottom: '2px solid #111' }}>
            <div><button onClick={() => setAuthMode('signup')} style={{ fontSize: 14, fontWeight: 600, color: '#111', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>← 戻る</button></div>
            <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '0.04em', textAlign: 'center', whiteSpace: 'nowrap' }}>アカウントの復旧</div>
            <div />
          </div>

          <div style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: '28px 20px', marginBottom: 16 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#111', marginBottom: 8 }}>パスワードを忘れた方</div>
            <div style={{ fontSize: 15, color: '#666', lineHeight: 1.7, marginBottom: 16 }}>
              登録時のメールアドレスを覚えている場合は、パスワードをリセットできます。
            </div>
            <button onClick={() => setAuthMode('reset')} style={{ width: '100%', background: '#111', color: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #555', padding: '12px 20px', fontSize: 17, fontWeight: 800, cursor: 'pointer', borderRadius: 0, fontFamily: 'inherit' }}>
              パスワードをリセット →
            </button>
          </div>

          <div style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: '28px 20px' }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#111', marginBottom: 8 }}>メールアドレスも忘れた方</div>
            <div style={{ fontSize: 15, color: '#666', lineHeight: 1.7, marginBottom: 16 }}>
              メールアドレスも忘れてしまった場合は、新しいアカウントを作成してください。
            </div>
            <button onClick={() => setAuthMode('signup')} style={{ width: '100%', background: '#fff', color: '#111', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: '12px 20px', fontSize: 17, fontWeight: 800, cursor: 'pointer', borderRadius: 0, fontFamily: 'inherit' }}>
              新しいアカウントを作成 →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- パスワードリセット画面 ---
  if (authMode === 'reset') {
    return (
      <div style={light}>
        <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '14px 0 12px', marginBottom: 20, borderBottom: '2px solid #111' }}>
            <div><button onClick={() => { setAuthMode('recovery'); setResetSent(false); setError(''); }} style={{ fontSize: 14, fontWeight: 600, color: '#111', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>← 戻る</button></div>
            <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '0.04em', textAlign: 'center', whiteSpace: 'nowrap' }}>パスワードリセット</div>
            <div />
          </div>

          {error && (
            <div style={{ background: '#fff0f0', border: '2px solid #cc2222', padding: '10px 14px', marginBottom: 16, fontSize: 15, color: '#cc2222', letterSpacing: '0.02em', lineHeight: 1.5 }}>
              {error}
            </div>
          )}

          {resetSent ? (
            <div style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: '28px 20px', textAlign: 'center' }}>
              <div style={{ marginBottom: 16 }}><svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,4 12,13 2,4"/></svg></div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#111', marginBottom: 16, lineHeight: 1.6 }}>
                パスワードリセットメールを送信しました
              </div>
              <div style={{ fontSize: 16, color: '#555', lineHeight: 1.8, marginBottom: 20 }}>
                <span style={{ fontWeight: 700, color: '#111' }}>{email}</span> 宛に
                <br />パスワードリセットメールを送信しました。
                <br />メール内のリンクからパスワードを
                <br />再設定してください。
              </div>
              <button
                onClick={() => { setAuthMode('login'); setResetSent(false); setError(''); }}
                style={{ width: '100%', background: '#111', color: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #555', padding: '12px 20px', fontSize: 17, fontWeight: 800, cursor: 'pointer', borderRadius: 0, fontFamily: 'inherit', marginTop: 8 }}
              >
                ログインに戻る
              </button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 15, color: '#666', lineHeight: 1.7, marginBottom: 4 }}>
                  登録時のメールアドレスを入力してください。パスワードリセット用のメールを送信します。
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.06em', color: '#111', textTransform: 'uppercase' }}>{t.emailLabel}</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    style={{ width: '100%', border: '2px solid #111', background: '#fff', padding: '12px 14px', fontSize: 17, color: '#111', outline: 'none', borderRadius: 0, fontFamily: 'inherit' }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ width: '100%', background: loading ? '#555' : '#111', color: '#fff', border: '2px solid #111', boxShadow: loading ? 'none' : '4px 4px 0 #555', padding: '14px 20px', fontSize: 18, fontWeight: 800, letterSpacing: '0.06em', cursor: loading ? 'not-allowed' : 'pointer', borderRadius: 0, marginTop: 4, fontFamily: 'inherit' }}
                >
                  {loading ? t.processing : 'リセットメールを送信'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // --- ログイン画面 ---
  if (authMode === 'login') {
    return (
      <div style={light}>
        <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column' }}>

          {/* ヘッダー */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '14px 0 12px', marginBottom: 20, borderBottom: '2px solid #111' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button onClick={() => { setAuthMode('signup'); setError(''); }} style={{ fontSize: 14, fontWeight: 600, color: '#111', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>
                ← 戻る
              </button>
            </div>
            <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '0.04em', textAlign: 'center', whiteSpace: 'nowrap' }}>ログイン</div>
            <div />
          </div>

          {/* エラーメッセージ */}
          {error && (
            <div style={{ background: '#fff0f0', border: '2px solid #cc2222', padding: '10px 14px', marginBottom: 16, fontSize: 15, color: '#cc2222', letterSpacing: '0.02em', lineHeight: 1.5 }}>
              {error}
            </div>
          )}

          {/* Google ログインボタン */}
          <button onClick={handleGoogleLogin} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, width: '100%', background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: '14px 20px', fontSize: 17, fontWeight: 700, color: '#111', letterSpacing: '0.03em', cursor: 'pointer', borderRadius: 0, marginBottom: 20 }}>
            <svg style={{ width: 22, height: 22, flexShrink: 0 }} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>{t.googleLogin}</span>
          </button>

          {/* OR 区切り */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, color: '#999', fontSize: 14, letterSpacing: '0.08em' }}>
            <div style={{ flex: 1, height: 1, background: '#bbb' }}/>
            <span>{t.orDivider}</span>
            <div style={{ flex: 1, height: 1, background: '#bbb' }}/>
          </div>

          {/* ログインフォーム */}
          <form style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 8 }} onSubmit={handleLogin}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.06em', color: '#111', textTransform: 'uppercase' }}>{t.emailLabel}</label>
              <input
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{ width: '100%', border: '2px solid #111', background: '#fff', padding: '12px 14px', fontSize: 17, color: '#111', outline: 'none', borderRadius: 0, fontFamily: 'inherit' }}
              />
            </div>
            {passwordField}
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', background: loading ? '#555' : '#111', color: '#fff', border: '2px solid #111', boxShadow: loading ? 'none' : '4px 4px 0 #555', padding: '14px 20px', fontSize: 18, fontWeight: 800, letterSpacing: '0.06em', cursor: loading ? 'not-allowed' : 'pointer', borderRadius: 0, marginTop: 8, fontFamily: 'inherit' }}
            >
              {loading ? t.processing : 'ログイン'}
            </button>
          </form>

          {/* アカウント作成リンク + パスワード忘れ */}
          <div style={{ borderTop: '1px solid #ddd', marginTop: 28, paddingTop: 20, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            <div style={{ fontSize: 15, color: '#666', letterSpacing: '0.02em' }}>
              アカウントをお持ちでない方は
              <button onClick={() => { setAuthMode('signup'); setError(''); }} style={{ color: '#111', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer', background: 'none', border: 'none', fontSize: 15, fontFamily: 'inherit' }}>
                アカウント作成
              </button>
            </div>
            <button onClick={() => { setAuthMode('reset'); setError(''); }} style={{ color: '#888', fontSize: 14, textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit' }}>
              パスワードを忘れた方はこちら
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- サインアップ画面 (authMode === 'signup') ---
  return (
    <div style={light}>
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column' }}>

        {/* ヘッダー */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '14px 0 12px', marginBottom: 20, borderBottom: '2px solid #111' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={onBack} style={{ fontSize: 14, fontWeight: 600, color: '#111', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>
              {t.navBack}
            </button>
          </div>
          <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '0.04em', textAlign: 'center', whiteSpace: 'nowrap' }}>{t.accountTitle}</div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: 13, fontWeight: 700, background: '#111', color: '#fff', padding: '3px 8px', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)' }}>{t.step1of2}</span>
          </div>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div style={{ background: '#fff0f0', border: '2px solid #cc2222', padding: '10px 14px', marginBottom: 16, fontSize: 15, color: '#cc2222', letterSpacing: '0.02em', lineHeight: 1.5 }}>
            {error}
          </div>
        )}

        {/* Google ログインボタン */}
        <button onClick={handleGoogleLogin} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, width: '100%', background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: '14px 20px', fontSize: 17, fontWeight: 700, color: '#111', letterSpacing: '0.03em', cursor: 'pointer', borderRadius: 0, marginBottom: 20 }}>
          <svg style={{ width: 22, height: 22, flexShrink: 0 }} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span>{t.googleLogin}</span>
        </button>

        {/* OR 区切り */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, color: '#999', fontSize: 14, letterSpacing: '0.08em' }}>
          <div style={{ flex: 1, height: 1, background: '#bbb' }}/>
          <span>{t.orDivider}</span>
          <div style={{ flex: 1, height: 1, background: '#bbb' }}/>
        </div>

        {/* フォーム */}
        <form style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 8 }} onSubmit={handleEmailSignUp}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.06em', color: '#111', textTransform: 'uppercase' }}>{t.emailLabel}</label>
            <input
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ width: '100%', border: '2px solid #111', background: '#fff', padding: '12px 14px', fontSize: 17, color: '#111', outline: 'none', borderRadius: 0, fontFamily: 'inherit' }}
            />
          </div>
          {passwordField}
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', background: loading ? '#555' : '#111', color: '#fff', border: '2px solid #111', boxShadow: loading ? 'none' : '4px 4px 0 #555', padding: '14px 20px', fontSize: 18, fontWeight: 800, letterSpacing: '0.06em', cursor: loading ? 'not-allowed' : 'pointer', borderRadius: 0, marginTop: 8, fontFamily: 'inherit' }}
          >
            {loading ? t.processing : t.createAccount}
          </button>
        </form>

        {/* 利用規約 */}
        <p style={{ fontSize: 13, color: '#999', textAlign: 'center', marginTop: 12, lineHeight: 1.6, padding: '0 8px' }}>
          {t.termsPrefix}<a href="/legal/terms" style={{ color: '#555', textDecoration: 'underline' }}>{t.termsOfService}</a>{t.termsMiddle}<a href="/legal/privacy" style={{ color: '#555', textDecoration: 'underline' }}>{t.privacyPolicy}</a>{t.termsSuffix}
        </p>

        {/* ログインリンク + アカウント復旧 */}
        <div style={{ borderTop: '1px solid #ddd', marginTop: 28, paddingTop: 20, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <div style={{ fontSize: 15, color: '#666', letterSpacing: '0.02em' }}>
            {t.haveAccountPrefix}
            <button onClick={() => { setAuthMode('login'); setError(''); }} style={{ color: '#111', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer', background: 'none', border: 'none', fontSize: 15, fontFamily: 'inherit' }}>
              {t.login}
            </button>
          </div>
          <button onClick={() => { setAuthMode('recovery'); setError(''); }} style={{ color: '#888', fontSize: 14, textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit' }}>
            メールアドレス・パスワードを忘れた方はこちら
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== 自分のキャラクター作成 (step 3) =====
// クリエイターのMEORA登録(IP登録フォーム)に準拠。ただし販売/価格/公開などの
// 項目は出さない(非売・プライベート)。
function StepCharacterCreate({
  draft,
  setDraft,
  onNext,
  onBack,
  lang,
  t,
}: {
  draft: CharDraft;
  setDraft: React.Dispatch<React.SetStateAction<CharDraft>>;
  onNext: () => void;
  onBack: () => void;
  lang: Lang;
  t: Dict;
}) {
  const light = {
    backgroundColor: '#f8f8f4',
    backgroundImage: 'linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)',
    backgroundSize: '24px 24px',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '0 0 48px',
  } as const;

  const sectionLabel = (text: string, required = false) => (
    <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#666', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>
      {text}
      {required && <span style={{ color: '#cc2222', marginLeft: 6 }}>{t.required}</span>}
    </div>
  );

  const inputStyle = {
    width: '100%',
    border: '2px solid #111',
    background: '#f8f8f4',
    padding: '12px 14px',
    fontSize: 17,
    color: '#111',
    outline: 'none',
    borderRadius: 0,
    fontFamily: 'inherit',
  } as const;

  const fileRefs = useRef<Partial<Record<SpriteType, HTMLInputElement | null>>>({});

  const getSpriteByType = (type: SpriteType) => draft.sprites.find(s => s.type === type)?.dataUrl;

  const setSpriteByType = (type: SpriteType, dataUrl: string) => {
    setDraft(d => ({
      ...d,
      sprites: d.sprites.some(s => s.type === type)
        ? d.sprites.map(s => s.type === type ? { ...s, dataUrl } : s)
        : [...d.sprites, { type, dataUrl }],
    }));
  };

  const removeSpriteByType = (type: SpriteType) => {
    setDraft(d => ({ ...d, sprites: d.sprites.filter(s => s.type !== type) }));
  };

  const handleFileChange = async (type: SpriteType, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImageToDataUrl(file, 512);
      setSpriteByType(type, dataUrl);
    } catch {
      // 読み込み失敗時は何もしない
    }
    e.target.value = '';
  };

  // プレビュー用の代表画像: idle(止まる) → 先頭スプライト の順。
  const previewSprite = draft.sprites.find(s => s.type === 'idle') ?? draft.sprites[0];

  const [useDefault, setUseDefault] = useState(false);

  const canFinish = draft.name.trim().length > 0;

  const handleSelectDefault = () => {
    setUseDefault(true);
    setSpriteByType('idle', '/icon_default.png');
  };

  const handleDeselectDefault = () => {
    setUseDefault(false);
    removeSpriteByType('idle');
  };

  return (
    <div style={light}>
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column' }}>

        {/* ヘッダー */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '14px 16px 12px', borderBottom: '2px solid #111', backgroundColor: '#f8f8f4', position: 'sticky', top: 0, zIndex: 10 }}>
          <div><button onClick={onBack} style={{ fontSize: 14, fontWeight: 600, color: '#111', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>{t.navBack}</button></div>
          <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '0.04em', textAlign: 'center', whiteSpace: 'nowrap' }}>{t.charCreateTitle}</div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}><span style={{ fontSize: 13, fontWeight: 700, background: '#111', color: '#fff', padding: '3px 8px', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)' }}>{t.step2of2}</span></div>
        </div>

        {/* プログレスバー */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '14px 16px 0' }}>
          {[true, true].map((done, i) => (
            <div key={i} style={{ display: 'contents' }}>
              <div style={{ flex: 1, height: 6, background: i === 1 ? 'repeating-linear-gradient(45deg, #111 0px, #111 3px, #fff 3px, #fff 6px)' : '#111', border: `1px solid ${done ? '#111' : '#bbb'}` }}/>
              {i < 1 && <div style={{ width: 3, height: 10, background: '#111' }}/>}
            </div>
          ))}
        </div>

        {/* 入力セクション */}
        <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* デフォルトキャラクター */}
          <div style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: '16px 14px' }}>
            {sectionLabel('デフォルトキャラクター')}
            <div style={{ fontSize: 14, color: '#666', lineHeight: 1.6, marginBottom: 12 }}>
              オリジナルのキャラクターを作らなくても、デフォルトのMEORAですぐに始められます。
            </div>
            <div
              onClick={useDefault ? handleDeselectDefault : handleSelectDefault}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: 12,
                border: useDefault ? '3px solid #111' : '2px solid #ccc',
                background: useDefault ? '#f0f0e8' : '#f8f8f4',
                cursor: 'pointer',
                transition: 'border 0.15s, background 0.15s',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon_default.png" alt="デフォルトMEORA" style={{ width: 64, height: 64, objectFit: 'contain', display: 'block' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#111', marginBottom: 4 }}>MEORA</div>
                <div style={{ fontSize: 13, color: '#888' }}>デフォルトキャラクター</div>
              </div>
              <div style={{
                width: 24, height: 24, border: '2px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: useDefault ? '#111' : '#fff',
              }}>
                {useDefault && <span style={{ color: '#fff', fontSize: 16, fontWeight: 900, lineHeight: 1 }}>✓</span>}
              </div>
            </div>
          </div>

          {/* MEORA名 */}
          <div style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: '16px 14px' }}>
            {sectionLabel(t.charNameLabel, true)}
            <input
              type="text"
              value={draft.name}
              onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
              placeholder={t.charNamePlaceholder}
              maxLength={20}
              style={inputStyle}
            />
          </div>

          {/* 見た目（スプライト・タイプ別） */}
          <div style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: '16px 14px' }}>
            {sectionLabel('見た目')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {SPRITE_ROWS.map(({ type, label }) => {
                const src = getSpriteByType(type);
                const isDefaultIdle = useDefault && type === 'idle';
                return (
                  <div key={type}>
                    <input
                      ref={el => { fileRefs.current[type] = el; }}
                      type="file"
                      accept="image/*"
                      onChange={e => handleFileChange(type, e)}
                      style={{ display: 'none' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1.5px solid #111', padding: 10, background: '#f8f8f4' }}>
                      <div style={{ flexShrink: 0, width: 54, height: 54, border: '2px solid #111', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {isDefaultIdle ? (
                          <img src="/icon_default.png" alt={label} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                        ) : src ? (
                          <img src={src} alt={label} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                        ) : (
                          <span style={{ fontSize: 11, color: '#bbb', fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', textAlign: 'center', lineHeight: 1.4 }}>画像<br/>なし</span>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#111', letterSpacing: '0.04em' }}>{label}</div>
                      </div>
                      <div style={{ flexShrink: 0, display: 'flex', gap: 6 }}>
                        {!isDefaultIdle && (
                          <button
                            onClick={() => fileRefs.current[type]?.click()}
                            style={{ padding: '7px 12px', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', background: '#111', color: '#fff', border: '2px solid #111', boxShadow: '2px 2px 0 #555', cursor: 'pointer', borderRadius: 0, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}
                          >
                            {src ? '変更' : '設定'}
                          </button>
                        )}
                        {src && !isDefaultIdle && (
                          <button
                            onClick={() => removeSpriteByType(type)}
                            style={{ padding: '7px 10px', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', background: '#fff', color: '#111', border: '2px solid #111', boxShadow: '2px 2px 0 #111', cursor: 'pointer', borderRadius: 0, letterSpacing: '0.02em' }}
                          >
                            削除
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: 13, color: '#999', marginTop: 10, letterSpacing: '0.02em', lineHeight: 1.5 }}>
              透過PNGをそのまま設定できます。ホームでの歩き方向ごとに画像を設定できます。
            </div>
          </div>

          {/* プレビュー（見た目の下に配置） */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 16px 16px', background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111' }}>
            <div style={{ background: '#f8f8f4', border: '2px solid #ccc', padding: 16, marginBottom: 12 }}>
              {useDefault ? (
                <img src="/icon_default.png" alt={draft.name || t.charPreviewName} style={{ width: 100, height: 100, objectFit: 'contain', display: 'block' }} />
              ) : previewSprite ? (
                <img src={previewSprite.dataUrl} alt={draft.name || t.charPreviewName} style={{ width: 100, height: 100, objectFit: 'contain', display: 'block' }} />
              ) : (
                <div style={{ width: 100, height: 100, border: '2px dashed #ccc', background: '#f0f0e8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#999' }}>
                  <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="7" width="28" height="22" stroke="#bbb" strokeWidth="2"/>
                    <path d="M11 7 L13 4 L21 4 L23 7" stroke="#bbb" strokeWidth="2" fill="none" strokeLinejoin="round"/>
                    <circle cx="17" cy="18" r="6" stroke="#bbb" strokeWidth="2"/>
                  </svg>
                  <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', fontFamily: 'var(--font-mono)', color: '#bbb' }}>{t.photoSelectShort}</span>
                </div>
              )}
            </div>
            <div style={{ color: '#111', fontSize: 18, fontWeight: 800, letterSpacing: '0.04em' }}>
              {draft.name || t.charPreviewName}
            </div>
          </div>

          {/* 性格・口調 */}
          <div style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: '16px 14px' }}>
            {sectionLabel(t.personalityLabel)}
            <div style={{ fontSize: 14, color: '#666', lineHeight: 1.6, marginBottom: 10 }}>
              {t.personalityHint}
            </div>
            <div style={{ fontSize: 14, color: '#888', lineHeight: 1.6, marginBottom: 10 }}>
              テンプレートを使って性格や口調を指定できます。
            </div>
            <button
              onClick={() => setDraft(d => ({ ...d, personality: d.personality ? d.personality : PERSONALITY_TEMPLATE }))}
              style={{ marginBottom: 10, padding: '6px 12px', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', background: '#fff', color: '#111', border: '2px solid #111', boxShadow: '2px 2px 0 #111', cursor: 'pointer', borderRadius: 0, letterSpacing: '0.04em' }}
            >
              テンプレートを挿入
            </button>
            <textarea
              value={draft.personality}
              onChange={e => setDraft(d => ({ ...d, personality: e.target.value }))}
              placeholder={t.personalityPlaceholder}
              rows={7}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 120, lineHeight: 1.7 }}
            />
          </div>

          {/* いま使っているAIの個性を引き継ぐ（プロンプトコピー） */}
          <InheritPersonaCopy lang={lang} />

          {/* 完了ボタン（ホームへ） */}
          <button
            onClick={onNext}
            disabled={!canFinish}
            style={{ width: '100%', background: canFinish ? '#111' : '#999', color: '#fff', border: `2px solid ${canFinish ? '#111' : '#999'}`, boxShadow: canFinish ? '4px 4px 0 #555' : 'none', padding: '16px 20px', fontSize: 18, fontWeight: 800, letterSpacing: '0.08em', cursor: canFinish ? 'pointer' : 'not-allowed', borderRadius: 0, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {t.start}
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== メインコンポーネント =====
export default function OnboardingPage() {
  const router = useRouter();
  // step は認証チェック + localStorage 復元が終わるまで確定させない(null=判定中)。
  // これによりスプラッシュ(step0)の一瞬のちらつきを防ぐ。
  const [step, setStep] = useState<number | null>(null);
  const [charDraft, setCharDraft] = useState<CharDraft>({ name: '', sprites: [], personality: '' });

  // オンボーディング全体の言語。スプラッシュのトグルで切り替え、各 Step へ渡す。
  // localStorage(meora-lang) に永続化し、再訪・ステップ遷移・OAuth 戻りでも保持する。
  // SSR/CSR 不一致を避けるため初期値は DEFAULT_LANG。保存済み言語は下の認証 effect 内
  // (非同期コールバック)で step 確定と同時に復元する。
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  const setLang = (l: Lang) => {
    setLangState(l);
    saveLang(l);
  };

  const t = DICT[lang];

  const advanceStep = (next: number) => {
    localStorage.setItem('meora-onboarding-step', String(next));
    setStep(next);
  };

  // 認証状態の確定とステップ復元をまとめて行う。
  // 「肯定(session あり)は速攻採用 / 否定(null)は猶予と再確認の後に採用」の
  // 堅牢ロジック(resolveAuth)で、ログイン直後の一瞬の null による誤判定を防ぐ。
  // - ログイン済み かつ onboardingDone === true → /dashboard へ
  // - それ以外 → localStorage の meora-onboarding-step を復元してオンボ継続
  useEffect(() => {
    const supabase = createClient();
    const { promise, cancel } = resolveAuth(supabase, { graceMs: 1500 });

    let active = true;
    promise.then((loggedIn) => {
      if (!active) return;

      // 保存済み言語を復元(ローディング解除と同時に反映するためちらつかない)。
      setLangState(loadLang());

      const state = loadState();
      if (state.onboardingDone && loggedIn) {
        router.replace('/dashboard');
        return; // 遷移するので step は確定しない(ちらつき防止)
      }

      // OAuth 戻り(step='3' 保存)を含むステップ復元。
      const saved = localStorage.getItem('meora-onboarding-step');
      let restored = 0;
      if (saved) {
        const n = parseInt(saved);
        if (!isNaN(n) && n > 0) restored = n;
      }
      setStep(restored);
    });

    return () => {
      active = false;
      cancel();
    };
  }, [router]);

  // MEORA作成（最終ステップ）完了 → 自作MEORAを保存してホームへ。
  // 自作MEORAは userCreated:true / sellable:false（非売・プライベート）で
  // state.characters に追加する。販売・価格・公開などのフィールドは持たせない。
  // userName はオンボーディングで集めなくなったため未設定のまま（既存値があれば維持）。
  const handleFinish = () => {
    const state = loadState();
    // photo はトーク一覧アイコン互換用。idle(止まる) → 先頭スプライト の順でセット。
    const idleSprite = charDraft.sprites.find(s => s.type === 'idle') ?? charDraft.sprites[0];
    const newChar: Character = {
      id: `user-${Date.now()}`,
      name: charDraft.name.trim() || 'マイMEORA',
      role: '',
      job: '',
      color: '#111',
      hp: 100,
      maxHp: 100,
      lastResetDate: '',
      photo: idleSprite?.dataUrl,
      sprites: charDraft.sprites.length > 0 ? charDraft.sprites : undefined,
      personality: charDraft.personality.trim() || undefined,
      userCreated: true,
      sellable: false,
    };
    saveState({
      ...state,
      characters: [...state.characters, newChar],
      onboardingDone: true,
    });
    localStorage.removeItem('meora-onboarding-step');
    router.replace('/dashboard');
  };

  // 認証チェック + ステップ復元が終わるまではローディング表示(dashboard と同テイスト)。
  // これで step0(スプラッシュ)の早期描画によるちらつきを防ぐ。
  if (step === null) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f5f0' }}>
        <span style={{ fontSize: 16, color: '#888' }}>...</span>
      </div>
    );
  }

  // step routing: 0=スプラッシュ / 1=アプリ説明 / 2=アカウント作成 / 3=自分のMEORA作成
  if (step === 0) return <StepSplash onNext={() => advanceStep(1)} lang={lang} setLang={setLang} t={t} />;
  if (step === 1) return <StepIntro onNext={() => advanceStep(2)} onBack={() => advanceStep(0)} t={t} />;
  if (step === 2) return <StepAccount onNext={() => advanceStep(3)} onBack={() => advanceStep(1)} t={t} />;
  return <StepCharacterCreate draft={charDraft} setDraft={setCharDraft} onNext={handleFinish} onBack={() => advanceStep(2)} lang={lang} t={t} />;
}
