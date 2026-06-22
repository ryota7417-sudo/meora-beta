'use client';
import { useEffect, useRef, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  loadState,
  loadChatHistory,
  saveChatHistory,
  ChatMessage,
  AppState,
  Character,
} from '@/lib/store';
import {
  Energy,
  loadEnergy,
  saveEnergy,
  refreshEnergy,
  consumeForExchange,
  canReply,
  getMeterLevel,
  getMeterStatusText,
  timeUntilNextMeal,
} from '@/lib/energy';
import { CharAvatarChat } from '@/components/ui/CharacterSvg';

// 携帯バッテリー風の満腹メーター（3目盛り・数値は表示しない）。
// タップで状態テキスト（満腹／少しお腹が空いている／お腹が空いている／空腹）を出す。
function SatietyMeter({ energy }: { energy: Energy }) {
  const [showStatus, setShowStatus] = useState(false);
  const level = getMeterLevel(energy);
  const status = getMeterStatusText(level);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button
        onClick={() => setShowStatus((v) => !v)}
        aria-label="満腹メーター"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 0,
          background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111',
          padding: 4, cursor: 'pointer', borderRadius: 0,
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
          <span style={{ display: 'inline-flex', gap: 3, padding: 3, border: '2px solid #111' }}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  width: 14, height: 16, border: '1px solid #111',
                  background: i < level ? (level === 1 ? '#ffcf59' : '#e8568a') : 'transparent',
                }}
              />
            ))}
          </span>
          <span style={{ width: 4, height: 12, marginLeft: 2, background: '#111' }} />
        </span>
      </button>
      {showStatus && (
        <span style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>{status}</span>
      )}
    </div>
  );
}

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [appState, setAppState] = useState<AppState | null>(null);
  const [char, setChar] = useState<Character | null>(null);
  const [energy, setEnergy] = useState<Energy | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);
  // 「お食事到着まであと X時間 Y分」表示。1分ごとに更新する。
  const [mealLabel, setMealLabel] = useState('');

  useEffect(() => {
    const update = () => {
      const { hours, minutes } = timeUntilNextMeal();
      setMealLabel(`お食事到着まであと ${hours}時間 ${minutes}分`);
    };
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
    setEnergy(refreshEnergy(loadEnergy()));
    const history = loadChatHistory(id);
    setMessages(history);
  }, [id, router]);

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading || !appState || !char || !energy) return;
    // 内部HPが0なら新規返信は生成しない（空腹ゲート）
    if (!canReply(energy)) return;

    const userText = input.trim();
    const userMsg: ChatMessage = { role: 'user', content: userText, timestamp: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setLoading(true);

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
      const replyText: string = data.text ?? '';
      const aiMsg: ChatMessage = { role: 'assistant', content: replyText, timestamp: Date.now() };
      const updated = [...newMessages, aiMsg];
      setMessages(updated);
      saveChatHistory(id, updated);

      // 実トークン usage に応じて満腹度を消費（usage が無ければテキスト長から推定）。
      const next = refreshEnergy(loadEnergy());
      consumeForExchange(next, { usage: data.usage ?? undefined, userText, replyText });
      saveEnergy(next);
      setEnergy({ ...next });
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
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!char || !appState || !energy) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f8f4' }}>
        <span style={{ fontSize: 16, color: '#888' }}>読み込み中...</span>
      </div>
    );
  }

  const hungry = !canReply(energy);

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
              fontSize: 13,
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
              position: 'relative',
              zIndex: 1,
            }}
          >
            ← ダッシュボード
          </button>

          {/* MEORA名 */}
          <div style={{ position: 'absolute', left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, pointerEvents: 'none' }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#111', letterSpacing: '-0.3px', lineHeight: 1.1 }}>{char.name}</span>
          </div>
        </header>

        {/* 満腹メーター（数値は表示しない） */}
        <div style={{ padding: '10px 14px 6px', flexShrink: 0 }}>
          <div style={{ background: '#ffffff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#111', letterSpacing: 1, textTransform: 'uppercase' }}>
              満腹メーター
            </span>
            <SatietyMeter energy={energy} />
          </div>
        </div>

        {/* CHAT AREA */}
        <div
          ref={chatAreaRef}
          style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: '#999', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
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
                  <div style={{ textAlign: 'center', fontSize: 13, color: '#999', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.15)' }}/>
                    <span>{formatTimestamp(msg.timestamp)}</span>
                    <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.15)' }}/>
                  </div>
                )}
                {isUser ? (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', maxWidth: '90%', alignSelf: 'flex-end' }}>
                    <div style={{ background: '#111', color: '#fff', padding: '11px 13px', fontSize: 15.5, lineHeight: 1.68, border: '2px solid #111', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, maxWidth: '90%', alignSelf: 'flex-start' }}>
                    <CharAvatarChat photo={char.photo} name={char.name} />
                    <div style={{ background: '#ffffff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: '11px 13px', fontSize: 15.5, lineHeight: 1.68, color: '#111', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
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
              <div style={{ background: '#ffffff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: '11px 13px', fontSize: 15.5, lineHeight: 1.68, color: '#888' }}>
                入力中...
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* INPUT AREA */}
        <div style={{ background: '#ffffff', borderTop: '2px solid #111', padding: '11px 14px 14px', flexShrink: 0 }}>
          {hungry ? (
            <div style={{ padding: 14, border: '2px solid #111', boxShadow: '4px 4px 0 #e8568a', background: '#fff', lineHeight: 1.7 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#111', marginBottom: 6 }}>
                {char.name}はお腹がぺこぺこみたい…
              </div>
              <div style={{ fontSize: 14, color: '#444', marginBottom: 10 }}>
                いまは新しいお返事ができません。{mealLabel}。<br/>
                ごはんをあげるか、プランを見直すとまたお話できます。
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                style={{ background: '#111', color: '#fff', border: '2px solid #111', boxShadow: '2px 2px 0 #555', padding: '8px 14px', fontSize: 14, fontWeight: 800, cursor: 'pointer', borderRadius: 0, fontFamily: 'inherit' }}
              >
                ごはん / プランを見る ▶
              </button>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 13, color: '#777', marginBottom: 8 }}>
                いっぱい話すとお腹がすくよ
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
                    fontSize: 16,
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
                    fontSize: 15,
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
