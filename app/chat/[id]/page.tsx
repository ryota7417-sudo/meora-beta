'use client';
import { useEffect, useRef, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  loadState,
  saveState,
  consumeHp,
  loadChatHistory,
  saveChatHistory,
  ChatMessage,
  AppState,
  Character,
  mealCountdownLabel,
} from '@/lib/store';
import { CharAvatarChat } from '@/components/ui/CharacterSvg';

// ジョブに対応するバッジ色
const JOB_COLORS: Record<string, string> = {
  'ライター': '#2196f3',
  'デザイナー': '#9c27b0',
  '秘書': '#388e3c',
  'リサーチャー': '#f57c00',
};

function getJobColor(job: string): string {
  return JOB_COLORS[job] || '#555';
}

// HP塗り色
function getHpFillColor(pct: number) {
  if (pct > 50) return '#4caf50';
  if (pct > 25) return '#ffc107';
  return '#f44336';
}

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [appState, setAppState] = useState<AppState | null>(null);
  const [char, setChar] = useState<Character | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);
  // 「お食事到着まであと X時間 Y分」表示。1分ごとに更新する。
  const [mealLabel, setMealLabel] = useState('');

  useEffect(() => {
    const update = () => setMealLabel(mealCountdownLabel());
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const s = loadState();
    if (!s.onboardingDone) { router.replace('/onboarding'); return; }
    const found = s.characters.find(c => c.id === id);
    if (!found) { router.replace('/dashboard'); return; }
    // localStorage（外部ソース）からの初期同期。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAppState(s);
    setChar(found);
    const history = loadChatHistory(id);
    setMessages(history);
  }, [id, router]);

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading || !appState || !char || char.hp === 0) return;

    const userMsg: ChatMessage = { role: 'user', content: input.trim(), timestamp: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setLoading(true);

    // HP消費
    const newState = consumeHp(appState, id, 5);
    setAppState(newState);
    setChar(newState.characters.find(c => c.id === id) ?? char);
    saveState(newState);

    try {
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          name: char.name,
          personality: char.personality,
          userName: appState.userName,
        }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      const aiMsg: ChatMessage = { role: 'assistant', content: data.text, timestamp: Date.now() };
      const updated = [...newMessages, aiMsg];
      setMessages(updated);
      saveChatHistory(id, updated);
    } catch (err) {
      console.error(err);
      const errMsg: ChatMessage = {
        role: 'assistant',
        content: 'ごめんなさい、エラーが発生しました。もう一度試してください。',
        timestamp: Date.now(),
      };
      const updated = [...newMessages, errMsg];
      setMessages(updated);
      saveChatHistory(id, updated);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!char || !appState) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f8f4' }}>
        <span style={{ fontSize: 14, color: '#888' }}>読み込み中...</span>
      </div>
    );
  }

  const dead = char.hp === 0;
  const pct = char.maxHp > 0 ? Math.max(0, Math.min(100, (char.hp / char.maxHp) * 100)) : 0;
  const jobColor = getJobColor(char.job || char.role);
  const hpFill = getHpFillColor(pct);

  // タイムスタンプ表示
  const formatTimestamp = (ts: number) => {
    const d = new Date(ts);
    return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日 ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  };

  return (
    <div style={{
      fontFamily: 'var(--font-body)',
      backgroundColor: '#f8f8f4',
      backgroundImage: `
        repeating-linear-gradient(0deg, transparent, transparent 24px, rgba(0,0,0,0.14) 24px, rgba(0,0,0,0.14) 25px),
        repeating-linear-gradient(90deg, transparent, transparent 24px, rgba(0,0,0,0.14) 24px, rgba(0,0,0,0.14) 25px),
        repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(0,0,0,0.06) 4px, rgba(0,0,0,0.06) 5px),
        repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(0,0,0,0.06) 4px, rgba(0,0,0,0.06) 5px)
      `,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      minHeight: '100vh',
      color: '#111',
    }}>
      <div style={{ width: '100%', maxWidth: 480, height: '100vh', display: 'flex', flexDirection: 'column' }}>

        {/* HEADER */}
        <header style={{
          background: '#ffffff',
          borderBottom: '2px solid #111',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: '#111',
              background: '#fff',
              border: '2px solid #111',
              boxShadow: '2px 2px 0 #111',
              padding: '5px 9px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              borderRadius: 0,
              lineHeight: 1.2,
              fontFamily: 'inherit',
            }}
          >
            ← ダッシュボード
          </button>

          {/* キャラ名 + ジョブ/カテゴリバッジ（無ければ非表示） */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#111', letterSpacing: '-0.3px', lineHeight: 1.1 }}>{char.name}</span>
            {(char.job || char.role || char.category) && (
              <span style={{
                fontSize: 10,
                fontWeight: 800,
                color: '#fff',
                background: jobColor,
                border: '2px solid #111',
                padding: '2px 8px',
                letterSpacing: '0.5px',
                borderRadius: 0,
              }}>
                {char.job || char.role || char.category}
              </span>
            )}
          </div>
        </header>

        {/* HP STATUS BAR */}
        <div style={{ padding: '10px 14px 6px', flexShrink: 0 }}>
          <div style={{ background: '#ffffff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#111', letterSpacing: 2, flexShrink: 0, textTransform: 'uppercase' }}>
                {char.name}のお腹の様子
              </span>
              <div style={{ flex: 1, height: 14, background: '#e0e0dc', border: '2px solid #111', overflow: 'hidden', position: 'relative' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: hpFill, position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg, transparent, transparent 5px, rgba(0,0,0,0.18) 5px, rgba(0,0,0,0.18) 6px)' }}/>
                </div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#111', flexShrink: 0, minWidth: 54, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {char.hp} / {char.maxHp}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: 11, color: dead ? '#e53935' : '#777', fontWeight: dead ? 700 : 500 }}>
                {dead ? mealLabel : 'いっぱい話すとお腹がすくよ'}
              </span>
            </div>
          </div>
        </div>

        {/* CHAT AREA */}
        <div
          ref={chatAreaRef}
          style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: '#999', fontSize: 11, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.15)' }}/>
              <span>{new Date().getFullYear()}年{new Date().getMonth()+1}月{new Date().getDate()}日</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.15)' }}/>
            </div>
          )}

          {messages.map((msg, i) => {
            const isUser = msg.role === 'user';
            const showTs = i === 0;
            return (
              <div key={i} style={{ display: 'contents' }}>
                {showTs && (
                  <div style={{ textAlign: 'center', fontSize: 11, color: '#999', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.15)' }}/>
                    <span>{formatTimestamp(msg.timestamp)}</span>
                    <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.15)' }}/>
                  </div>
                )}
                {isUser ? (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', maxWidth: '90%', alignSelf: 'flex-end' }}>
                    <div style={{ background: '#111', color: '#fff', padding: '11px 13px', fontSize: 13.5, lineHeight: 1.68, border: '2px solid #111', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, maxWidth: '90%', alignSelf: 'flex-start' }}>
                    <CharAvatarChat photo={char.photo} name={char.name} />
                    <div style={{ background: '#ffffff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: '11px 13px', fontSize: 13.5, lineHeight: 1.68, color: '#111', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {msg.content}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, maxWidth: '90%', alignSelf: 'flex-start' }}>
              <CharAvatarChat photo={char.photo} name={char.name} />
              <div style={{ background: '#ffffff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: '11px 13px', fontSize: 13.5, lineHeight: 1.68, color: '#888' }}>
                入力中...
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* INPUT AREA */}
        <div style={{ background: '#ffffff', borderTop: '2px solid #111', padding: '11px 14px 14px', flexShrink: 0 }}>
          {dead ? (
            <div style={{ textAlign: 'center', padding: 14, color: '#e53935', fontWeight: 700, fontSize: 14, border: '2px solid #e53935', background: '#fff5f5', lineHeight: 1.6 }}>
              お腹がぺこぺこです<br/>{mealLabel}
            </div>
          ) : (
            <>
              <div style={{ fontSize: 11, color: '#777', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fff', border: '2px solid #111', padding: '2px 7px', fontSize: 11, fontWeight: 800, color: '#111' }}>
                  <span style={{ width: 7, height: 7, background: hpFill, border: '1.5px solid #333', display: 'inline-block', flexShrink: 0 }}/>
                  お腹: {char.hp}
                </span>
                <span>話すとお腹がすく(-5)</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`メッセージを入力...\n（Shift+Enter で改行）`}
                  rows={2}
                  style={{
                    flex: 1,
                    resize: 'none',
                    minHeight: 52,
                    maxHeight: 120,
                    padding: '10px 12px',
                    fontFamily: 'var(--font-body)',
                    fontSize: 14,
                    color: '#111',
                    background: '#fff',
                    border: '2px solid #111',
                    boxShadow: '2px 2px 0 #111',
                    borderRadius: 0,
                    outline: 'none',
                    lineHeight: 1.5,
                  }}
                  onInput={e => {
                    const t = e.currentTarget;
                    t.style.height = 'auto';
                    t.style.height = Math.min(t.scrollHeight, 120) + 'px';
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  style={{
                    flexShrink: 0,
                    background: '#111',
                    color: '#fff',
                    border: '2px solid #111',
                    boxShadow: '3px 3px 0 #111',
                    padding: '0 16px',
                    height: 52,
                    fontSize: 13,
                    fontWeight: 800,
                    fontFamily: 'inherit',
                    cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                    borderRadius: 0,
                    letterSpacing: '0.3px',
                    whiteSpace: 'nowrap',
                    opacity: input.trim() && !loading ? 1 : 0.5,
                  }}
                >
                  送信 ▶
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
