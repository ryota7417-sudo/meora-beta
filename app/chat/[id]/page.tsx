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
  loadOwnedSkins,
  loadEquippedSkins,
  equipSkin,
  getEquippedSkinUrls,
  type OwnedSkin,
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
import { SatietyMeter } from '@/components/ui/SatietyMeter';
import { CharAvatarChat } from '@/components/ui/CharacterSvg';

// 胃アイコンの満腹度。タップで状態テキスト（満腹／少しお腹が空いている／お腹が空いている／空腹）を出す。
function HeaderSatiety({ energy }: { energy: Energy }) {
  const [showStatus, setShowStatus] = useState(false);
  const status = getMeterStatusText(getMeterLevel(energy));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative', zIndex: 1, marginLeft: 'auto' }}>
      {showStatus && (
        <span style={{ fontSize: 13, fontWeight: 800, color: '#111', whiteSpace: 'nowrap' }}>{status}</span>
      )}
      <button
        onClick={() => setShowStatus((v) => !v)}
        aria-label="満腹度"
        style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
      >
        <SatietyMeter energy={energy} size={30} />
      </button>
    </div>
  );
}

// 本文中の URL・電話番号をクリック可能なリンクに変換する。
const LINK_REGEX = /(https?:\/\/[^\s<>「」（）()]+)|(\b0\d{1,3}-\d{2,4}-\d{3,4}\b)|(\b1(?:10|19)\b)/g;
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
  const [energy, setEnergy] = useState<Energy | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [dressUpOpen, setDressUpOpen] = useState(false);
  const [ownedSkins, setOwnedSkins] = useState<OwnedSkin[]>([]);
  const [skinUrls, setSkinUrls] = useState<{ wear?: string; hat?: string }>({});
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
    setOwnedSkins(loadOwnedSkins().filter(s => s.characterId === id));
    setSkinUrls(getEquippedSkinUrls(id));
  }, [id, router]);

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading || !appState || !char || !energy) return;
    if (!canReply(energy)) return;

    const userText = input.trim();

    // 検索意図の判定 — 該当する場合は確認ダイアログを表示
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
            ← ホーム
          </button>

          {/* MEORA名（バー中央） */}
          <div style={{ position: 'absolute', left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, pointerEvents: 'none' }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#111', letterSpacing: '-0.3px', lineHeight: 1.1 }}>{char.name}</span>
          </div>

        </header>

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
                      {linkify(msg.content)}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, maxWidth: '90%', alignSelf: 'flex-start' }}>
                    <div style={{ position: 'relative', flexShrink: 0, width: 38, height: 38 }}>
                      <CharAvatarChat photo={char.photo} name={char.name} />
                      {skinUrls.wear && <img src={skinUrls.wear} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />}
                      {skinUrls.hat && <img src={skinUrls.hat} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />}
                    </div>
                    <div style={{ background: '#ffffff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: '11px 13px', fontSize: 15.5, lineHeight: 1.68, color: '#111', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {linkify(msg.content)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, maxWidth: '90%', alignSelf: 'flex-start' }}>
              <div style={{ position: 'relative', flexShrink: 0, width: 38, height: 38 }}>
                <CharAvatarChat photo={char.photo} name={char.name} />
                {skinUrls.wear && <img src={skinUrls.wear} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />}
                {skinUrls.hat && <img src={skinUrls.hat} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />}
              </div>
              <div style={{ background: '#ffffff', border: '2px solid #111', boxShadow: '4px 4px 0 #111', padding: '11px 13px', fontSize: 15.5, lineHeight: 1.68, color: '#888' }}>
                入力中...
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ fontSize: 13, color: '#777', flex: 1 }}>
                  いっぱい話すとお腹がすくよ
                </div>
                {ownedSkins.length > 0 && (
                  <button
                    onClick={() => setDressUpOpen(v => !v)}
                    style={{ fontSize: 12, fontWeight: 800, color: '#111', background: dressUpOpen ? '#f5a623' : '#fff', border: '2px solid #111', boxShadow: '2px 2px 0 #111', padding: '5px 8px', cursor: 'pointer', borderRadius: 0, fontFamily: 'inherit', flexShrink: 0 }}
                  >
                    きせかえ
                  </button>
                )}
                <HeaderSatiety energy={energy} />
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
