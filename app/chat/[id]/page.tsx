'use client';
import { useEffect, useRef, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  loadState,
  loadChatHistory,
  saveChatHistory,
  ChatMessage,
  AppState,
  Character,
  loadOwnedSkins,
  loadEquippedSkins,
  equipSkin,
  getEquippedSkinUrls,
  type OwnedSkin,
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
import { CharacterYard, type YardThinkingState, type YardFrozenState } from '@/components/ui/CharacterYard';
import { BottomNav } from '@/components/ui/BottomNav';

const RESUME_WALK_DELAY = 20_000;

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

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [appState, setAppState] = useState<AppState | null>(null);
  const [char, setChar] = useState<Character | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [dressUpOpen, setDressUpOpen] = useState(false);
  const [ownedSkins, setOwnedSkins] = useState<OwnedSkin[]>([]);
  const [skinUrls, setSkinUrls] = useState<{ wear?: string; hat?: string }>({});
  const [showCharSwitch, setShowCharSwitch] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  // thinking / frozen state for the single-char yard
  const [thinkingState, setThinkingState] = useState<YardThinkingState>({});
  const [frozenState, setFrozenState] = useState<YardFrozenState>({});
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const s = loadState();
    if (!s.onboardingDone) { router.replace('/onboarding'); return; }
    const found = s.characters.find(c => c.id === id);
    if (!found) { router.replace('/dashboard'); return; }
    setAppState(s);
    setChar(found);
    setWallet(loadWallet());
    const history = loadChatHistory(id);
    setMessages(history);
    setOwnedSkins(loadOwnedSkins().filter(s => s.characterId === id));
    setSkinUrls(getEquippedSkinUrls(id));
    // shutter open animation after mount
    requestAnimationFrame(() => {
      setChatOpen(true);
    });
  }, [id, router]);

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading || !appState || !char || !wallet) return;
    if (!canSendMessage(wallet)) return;

    const userText = input.trim();

    const searchPatterns = /調べて|検索して|って何|とは[？?]|ニュース|最新|教えて.*について/;
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

    // thinking: stop walking, show think bubble
    setThinkingState({ [id]: true });
    setFrozenState({ [id]: true });
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }

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
          content: '今月のメッセージ上限に達しちゃった。来月またたくさんお話しよう。',
          timestamp: Date.now(),
        };
        setMessages([...newMessages, errMsg]);
        setLoading(false);
        setThinkingState({ [id]: false });
        // stay frozen, resume after 20s
        resumeTimerRef.current = setTimeout(() => {
          setFrozenState({ [id]: false });
        }, RESUME_WALK_DELAY);
        return;
      }
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      const replyText: string = data.text ?? '';
      const aiMsg: ChatMessage = { role: 'assistant', content: replyText, timestamp: Date.now() };
      const updated = [...newMessages, aiMsg];
      setMessages(updated);
      saveChatHistory(id, updated);

      recordMessage(wallet);
      saveWallet(wallet);
      setWallet({ ...wallet });

      const ce = loadCharEnergy(id);
      recordCost(ce, { usage: data.usage ?? undefined, userText, replyText });
      saveCharEnergy(id, ce);
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
      // reply complete: stop thinking, stay frozen, resume after 20s
      setThinkingState({ [id]: false });
      resumeTimerRef.current = setTimeout(() => {
        setFrozenState({ [id]: false });
      }, RESUME_WALK_DELAY);
    }
  }, [input, loading, wallet, messages, char, appState, id]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!char || !appState || !wallet) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f8f4' }}>
        <span style={{ fontSize: 16, color: '#888' }}>...</span>
      </div>
    );
  }

  const tired = !canSendMessage(wallet);
  const remaining = getRemainingMessages(wallet);
  const lowRemaining = remaining.total <= 5 && remaining.total > 0;

  return (
    <div style={{
      fontFamily: 'var(--font-body)',
      backgroundColor: '#f7f5f0',
      display: 'flex',
      justifyContent: 'center',
      minHeight: '100vh',
      color: '#111',
    }}>
      <div style={{ width: '100%', maxWidth: 480, height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* HEADER */}
        <header style={{
          background: '#111',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexShrink: 0,
          zIndex: 100,
        }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#f7f5f0', fontSize: 14, fontWeight: 800,
              fontFamily: 'inherit', padding: '2px 0',
            }}
          >
            ← 戻る
          </button>
          <button
            onClick={() => setShowCharSwitch(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 17, fontWeight: 800, color: '#f7f5f0',
              fontFamily: 'inherit', padding: 0,
            }}
          >
            {char.name}
            {appState.characters.length > 1 && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: showCharSwitch ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
                <path d="M2 4L6 8L10 4" stroke="#f7f5f0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </header>

        {/* MEORA切替ドロップダウン */}
        {showCharSwitch && appState.characters.length > 1 && (
          <div style={{
            position: 'absolute', top: 44, left: 0, right: 0, zIndex: 110,
            maxWidth: 480, margin: '0 auto',
          }}>
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 109 }}
              onClick={() => setShowCharSwitch(false)}
            />
            <div style={{
              position: 'relative', zIndex: 110,
              margin: '0 14px',
              background: '#fff', border: '2px solid #111', boxShadow: '4px 4px 0 #111',
            }}>
              {appState.characters.filter(c => c.id !== id).map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setShowCharSwitch(false); router.push(`/chat/${c.id}`); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 14px', background: 'none', border: 'none',
                    borderBottom: '1px solid #eee', cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: 16, fontWeight: 800, color: '#111',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ width: 32, height: 32, border: '2px solid #111', flexShrink: 0, background: '#f0f0ea', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <CharAvatarChat photo={c.photo} name={c.name} />
                  </div>
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 上半分: このMEORAだけの庭 */}
        <div style={{ flex: '0 0 auto', height: '35vh', minHeight: 180, position: 'relative' }}>
          <CharacterYard
            characters={[char]}
            onCharacterTap={() => {}}
            thinkingState={thinkingState}
            frozenState={frozenState}
          />
        </div>

        {/* 下半分: チャットエリア（シャッターアニメーション） */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: '#f8f8f4',
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 24px, rgba(0,0,0,0.10) 24px, rgba(0,0,0,0.10) 25px),
            repeating-linear-gradient(90deg, transparent, transparent 24px, rgba(0,0,0,0.10) 24px, rgba(0,0,0,0.10) 25px)
          `,
          borderTop: '3px solid #111',
          transform: chatOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
          overflow: 'hidden',
        }}>

          {/* CHAT MESSAGES */}
          <div
            ref={chatAreaRef}
            style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: '#999', fontSize: 13, padding: '16px 0' }}>
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

            <div ref={bottomRef} />
          </div>

          {/* DRESS UP PANEL */}
          {dressUpOpen && (
            <div style={{ background: '#fff', borderTop: '2px solid #111', padding: '10px 14px', flexShrink: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#7a746c', marginBottom: 8 }}>持っているスキン</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {ownedSkins.map(skin => {
                  const equipped = loadEquippedSkins();
                  const charEquip = equipped[id] || {};
                  const isEquipped = charEquip[skin.slot] === skin.id;
                  return (
                    <button
                      key={skin.id}
                      onClick={() => {
                        equipSkin(id, skin.slot, isEquipped ? null : skin.id);
                        setSkinUrls(getEquippedSkinUrls(id));
                      }}
                      style={{
                        width: 56, height: 56, border: isEquipped ? '3px solid #e8568a' : '2px solid #111',
                        boxShadow: isEquipped ? '2px 2px 0 #e8568a' : '2px 2px 0 #111',
                        background: '#f7f5f0', cursor: 'pointer', padding: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 0, overflow: 'hidden', position: 'relative',
                      }}
                    >
                      <img src={skin.iconUrl} alt={skin.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      {isEquipped && <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#e8568a', color: '#fff', fontSize: 8, fontWeight: 800, textAlign: 'center', padding: '1px 0' }}>着用中</span>}
                    </button>
                  );
                })}
                {(skinUrls.wear || skinUrls.hat) && (
                  <button
                    onClick={() => {
                      equipSkin(id, 'wear', null);
                      equipSkin(id, 'hat', null);
                      setSkinUrls({});
                    }}
                    style={{ width: 56, height: 56, border: '2px solid #111', boxShadow: '2px 2px 0 #111', background: '#fff', cursor: 'pointer', fontSize: 10, fontWeight: 800, color: '#7a746c', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 0, fontFamily: 'inherit' }}
                  >
                    全部<br/>はずす
                  </button>
                )}
              </div>
            </div>
          )}

          {/* INPUT AREA */}
          <div style={{ background: '#fff', borderTop: '2px solid #111', padding: '10px 14px 14px', flexShrink: 0, paddingBottom: 'calc(14px + 64px + env(safe-area-inset-bottom))' }}>
            {tired ? (
              <div style={{ padding: 12, border: '2px solid #111', boxShadow: '4px 4px 0 #e8568a', background: '#fff', lineHeight: 1.7 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#111', marginBottom: 6 }}>
                  {char.name}は疲れちゃった...
                </div>
                <div style={{ fontSize: 14, color: '#444', marginBottom: 10 }}>
                  今月のメッセージ上限に達しました。<br/>
                  さくらんぼをあげるとまたお話できます。
                </div>
                <button
                  onClick={() => router.push('/dashboard?shop=1')}
                  style={{ background: '#111', color: '#fff', border: '2px solid #111', boxShadow: '2px 2px 0 #555', padding: '8px 14px', fontSize: 14, fontWeight: 800, cursor: 'pointer', borderRadius: 0, fontFamily: 'inherit' }}
                >
                  ショップを見る
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  {lowRemaining && (
                    <div style={{ fontSize: 12, color: '#c33', fontWeight: 700, flex: 1 }}>
                      残り {remaining.total}通
                    </div>
                  )}
                  {!lowRemaining && <div style={{ flex: 1 }} />}
                  {ownedSkins.length > 0 && (
                    <button
                      onClick={() => setDressUpOpen(v => !v)}
                      style={{ fontSize: 12, fontWeight: 800, color: '#111', background: dressUpOpen ? '#f5a623' : '#fff', border: '2px solid #111', boxShadow: '2px 2px 0 #111', padding: '5px 8px', cursor: 'pointer', borderRadius: 0, fontFamily: 'inherit', flexShrink: 0 }}
                    >
                      きせかえ
                    </button>
                  )}
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
                    送信
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
