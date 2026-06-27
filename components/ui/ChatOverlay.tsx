'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  loadChatHistory,
  saveChatHistory,
  ChatMessage,
  Character,
  AppState,
  getEquippedSkinUrls,
} from '@/lib/store';
import {
  type Wallet,
  loadWallet,
  saveWallet,
  canSendMessage,
  recordMessage,
  getRemainingMessages,
  loadCharEnergy,
  saveCharEnergy,
  recordCost,
} from '@/lib/energy';
import { CharAvatarChat } from '@/components/ui/CharacterSvg';

const LINK_REGEX = /(https?:\/\/[^\s<>]+)|(\b0\d{1,3}-\d{2,4}-\d{3,4}\b)|(\b1(?:10|19)\b)/g;
function linkify(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  LINK_REGEX.lastIndex = 0;
  let key = 0;
  while ((m = LINK_REGEX.exec(text)) !== null) {
    if (m.index > lastIndex) nodes.push(text.slice(lastIndex, m.index));
    const [matched, url, phone, emergency] = m;
    const linkStyle: React.CSSProperties = { color: '#e8568a', fontWeight: 800, textDecoration: 'underline', wordBreak: 'break-all' };
    if (url) {
      nodes.push(<a key={key++} href={url} target="_blank" rel="noreferrer" style={linkStyle}>{url}</a>);
    } else if (phone || emergency) {
      const num = (phone || emergency)!;
      nodes.push(<a key={key++} href={`tel:${num.replace(/-/g, '')}`} style={linkStyle}>{num}</a>);
    } else {
      nodes.push(matched);
    }
    lastIndex = m.index + matched.length;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

type ChatOverlayProps = {
  char: Character;
  appState: AppState;
  open: boolean;
  onClose: () => void;
  onThinkingChange: (charId: string, thinking: boolean) => void;
  onReplyComplete: (charId: string) => void;
};

export function ChatOverlay({ char, appState, open, onClose, onThinkingChange, onReplyComplete }: ChatOverlayProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [animState, setAnimState] = useState<'closed' | 'opening' | 'open' | 'closing'>('closed');
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const skinUrls = getEquippedSkinUrls(char.id);

  useEffect(() => {
    if (open) {
      const history = loadChatHistory(char.id);
      setMessages(history);
      setWallet(loadWallet());
      setAnimState('opening');
      const timer = setTimeout(() => setAnimState('open'), 50);
      return () => clearTimeout(timer);
    } else if (animState === 'open' || animState === 'opening') {
      setAnimState('closing');
      const timer = setTimeout(() => setAnimState('closed'), 350);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, char.id]);

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (animState === 'open' && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [animState]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading || !wallet) return;
    if (!canSendMessage(wallet)) return;

    const userText = input.trim();

    const searchPatterns = /[調][べ][て]|[検][索][し][て]|[っ][て][何]|[と][は][?？]|[ニ][ュ][ー][ス]|[最][新]|[教][え][て].*[に][つ][い][て]/;
    let allowSearch = true;
    if (searchPatterns.test(userText)) {
      allowSearch = window.confirm('Web検索を実行しますか？\n\n検索を使うと最新の情報を調べられます。');
    }

    const userMsg: ChatMessage = { role: 'user', content: userText, timestamp: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setLoading(true);
    onThinkingChange(char.id, true);

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
          allowSearch,
        }),
      });

      if (res.status === 429) {
        const errMsg: ChatMessage = {
          role: 'assistant',
          content: '今月のメッセージ上限に達しちゃった。来月またたくさんお話ししよう。',
          timestamp: Date.now(),
        };
        setMessages([...newMessages, errMsg]);
        setLoading(false);
        onThinkingChange(char.id, false);
        onReplyComplete(char.id);
        return;
      }
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      const replyText: string = data.text ?? '';
      const aiMsg: ChatMessage = { role: 'assistant', content: replyText, timestamp: Date.now() };
      const updated = [...newMessages, aiMsg];
      setMessages(updated);
      saveChatHistory(char.id, updated);

      recordMessage(wallet);
      saveWallet(wallet);
      setWallet({ ...wallet });

      const ce = loadCharEnergy(char.id);
      recordCost(ce, { usage: data.usage ?? undefined, userText, replyText });
      saveCharEnergy(char.id, ce);
    } catch (err) {
      console.error(err);
      const errMsg: ChatMessage = {
        role: 'assistant',
        content: 'ごめんなさい、エラーが発生しました。もう一度試してください。',
        timestamp: Date.now(),
      };
      setMessages([...newMessages, errMsg]);
    } finally {
      setLoading(false);
      onThinkingChange(char.id, false);
      onReplyComplete(char.id);
    }
  }, [input, loading, wallet, messages, char, appState, onThinkingChange, onReplyComplete]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  if (animState === 'closed') return null;

  const isVisible = animState === 'open';
  const tired = wallet ? !canSendMessage(wallet) : false;
  const remaining = wallet ? getRemainingMessages(wallet) : { total: 0, monthly: 0, bonus: 0 };
  const lowRemaining = remaining.total <= 5 && remaining.total > 0;

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        top: 0,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        pointerEvents: animState === 'closing' ? 'none' : 'auto',
      }}
    >
      {/* backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.3)',
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* chat panel — shutter slide up */}
      <div
        style={{
          position: 'relative',
          maxWidth: 480,
          width: '100%',
          margin: '0 auto',
          maxHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#f8f8f4',
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 24px, rgba(0,0,0,0.14) 24px, rgba(0,0,0,0.14) 25px),
            repeating-linear-gradient(90deg, transparent, transparent 24px, rgba(0,0,0,0.14) 24px, rgba(0,0,0,0.14) 25px),
            repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(0,0,0,0.06) 4px, rgba(0,0,0,0.06) 5px),
            repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(0,0,0,0.06) 4px, rgba(0,0,0,0.06) 5px)
          `,
          borderTop: '3px solid #111',
          borderLeft: '2px solid #111',
          borderRight: '2px solid #111',
          transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {/* handle bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px 8px',
          borderBottom: '2px solid #111',
          background: '#fff',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ position: 'relative', width: 32, height: 32, flexShrink: 0 }}>
              <CharAvatarChat photo={char.photo} name={char.name} />
              {skinUrls.wear && <img src={skinUrls.wear} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />}
              {skinUrls.hat && <img src={skinUrls.hat} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />}
            </div>
            <span style={{ fontSize: 17, fontWeight: 800, color: '#111' }}>{char.name}</span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <line x1="4" y1="14" x2="14" y2="4" stroke="#111" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M4 4L14 4L14 14" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* messages */}
        <div
          ref={chatAreaRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: '#999', fontSize: 13, padding: '20px 0' }}>
              {char.name}に話しかけてみよう
            </div>
          )}

          {messages.map((msg, i) => {
            const isUser = msg.role === 'user';
            return (
              <div key={i}>
                {isUser ? (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', maxWidth: '88%', marginLeft: 'auto' }}>
                    <div style={{ background: '#111', color: '#fff', padding: '10px 12px', fontSize: 15, lineHeight: 1.65, border: '2px solid #111', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {linkify(msg.content)}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, maxWidth: '88%' }}>
                    <div style={{ position: 'relative', flexShrink: 0, width: 32, height: 32 }}>
                      <CharAvatarChat photo={char.photo} name={char.name} />
                      {skinUrls.wear && <img src={skinUrls.wear} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />}
                      {skinUrls.hat && <img src={skinUrls.hat} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />}
                    </div>
                    <div style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: '10px 12px', fontSize: 15, lineHeight: 1.65, color: '#111', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {linkify(msg.content)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, maxWidth: '88%' }}>
              <div style={{ position: 'relative', flexShrink: 0, width: 32, height: 32 }}>
                <CharAvatarChat photo={char.photo} name={char.name} />
              </div>
              <div style={{ background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: '10px 12px', fontSize: 15, color: '#888' }}>
                ...
              </div>
            </div>
          )}
        </div>

        {/* input */}
        <div style={{ background: '#fff', borderTop: '2px solid #111', padding: '10px 14px 14px', flexShrink: 0, paddingBottom: 'calc(14px + env(safe-area-inset-bottom))' }}>
          {tired ? (
            <div style={{ padding: 12, border: '2px solid #111', boxShadow: '4px 4px 0 #e8568a', background: '#fff', lineHeight: 1.7, fontSize: 14 }}>
              <div style={{ fontWeight: 800, marginBottom: 4 }}>{char.name}は疲れちゃった...</div>
              <div style={{ color: '#444' }}>今月のメッセージ上限に達しました。ショップでアイテムを購入するとまたお話できます。</div>
            </div>
          ) : (
            <>
              {lowRemaining && (
                <div style={{ fontSize: 12, color: '#c33', fontWeight: 700, marginBottom: 6 }}>
                  残り {remaining.total}通
                </div>
              )}
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
                    minHeight: 48,
                    maxHeight: 100,
                    padding: '9px 11px',
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
                    t.style.height = Math.min(t.scrollHeight, 100) + 'px';
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
                    padding: '0 14px',
                    height: 48,
                    fontSize: 15,
                    fontWeight: 800,
                    fontFamily: 'inherit',
                    cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                    borderRadius: 0,
                    opacity: input.trim() && !loading ? 1 : 0.5,
                  }}
                >
                  送信
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
