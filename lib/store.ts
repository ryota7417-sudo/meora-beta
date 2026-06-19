// スプライトの種類。歩く庭(CharacterYard)の方向別表示に使う。
//   walkRight = 右に歩く / walkLeft = 左に歩く / idle = 基本（止まる）
export type SpriteType = 'walkRight' | 'walkLeft' | 'idle';

// 方向別スプライト1枚分。type と dataUrl(512px JPEG dataURL)を持つ。
export type Sprite = {
  type: SpriteType;
  dataUrl: string;
};

export type Character = {
  // 旧デフォルトMEORAは固定 id だったが、自作MEORA/マーケット入手MEORAは任意 id を持つ。
  id: string;
  name: string;
  role: string;
  job: string;
  color: string;
  hp: number;
  maxHp: number;
  lastResetDate: string;
  // AIタイプ（tier）: 'basic' = 一緒に成長する基本技術型 / 'advanced' = 専門性の高い専門技術型
  // 将来 inbox/AI_pronpt/{coding,designer,secretary,writer}/ 配下の
  //   basic / advanced プロンプトを読み込む想定の受け皿。
  // ジョブ↔フォルダ対応: ライター→writer / デザイナー→designer / 秘書→secretary / ※coding は将来枠
  tier?: 'basic' | 'advanced';
  // ===== 拡張フィールド（自作MEORA / マーケット入手MEORA共通） =====
  // 写真（dataURL）。設定されていれば SVG アイコンの代わりに表示する。
  // トーク一覧アイコン・フォールバック用。sprites があっても残す。
  photo?: string;
  // 方向別スプライト（歩く庭の歩行アニメ用・最大5枚）。
  // 後方互換: 未設定の旧MEORAは photo（無ければイニシャル）で表示する。
  sprites?: Sprite[];
  // 性格・口調。チャットAPIのシステムプロンプト素材になる。
  personality?: string;
  // カテゴリ（任意）。例: 癒し / 恋愛相談 など。
  category?: string;
  // 自作フラグ。ユーザーがオンボーディング等で作成したMEORAは true。
  userCreated?: boolean;
  // 販売可否。自作MEORAは常に false（非売・プライベート）。
  sellable?: boolean;
};

// 指定MEORAの指定種類スプライトの dataURL を返す。無ければ undefined。
// 後方互換: sprites 未設定の旧MEORAは常に undefined を返すので、
// 呼び出し側は photo → イニシャルの順でフォールバックすること。
export function getSprite(char: Character, type: SpriteType): string | undefined {
  return char.sprites?.find((s) => s.type === type)?.dataUrl;
}

// localStorage に保存するスキーマのバージョン。
// 旧構造（avatar あり / 旧デフォルトMEORA）を検出して移行するために使う。
export const SCHEMA_VERSION = 2;

// 旧デフォルトMEORAの id（移行検出用）。
const LEGACY_CHARACTER_IDS = ['aoi', 'ruka', 'haruka'];

export type AppState = {
  schemaVersion: number;
  userName: string;
  characters: Character[];
  onboardingDone: boolean;
};

// デフォルト3体は廃止。自作MEORAはオンボーディングで追加される。
export const DEFAULT_CHARACTERS: Character[] = [];

function freshState(): AppState {
  return {
    schemaVersion: SCHEMA_VERSION,
    userName: '',
    characters: [...DEFAULT_CHARACTERS],
    onboardingDone: false,
  };
}

// 旧構造かどうかを判定する。
// - schemaVersion が無い / 古い
// - avatar フィールドが残っている
// - 旧デフォルトMEORA id を含む
function isLegacyState(parsed: Record<string, unknown>): boolean {
  if (typeof parsed.schemaVersion !== 'number' || parsed.schemaVersion < SCHEMA_VERSION) return true;
  if ('avatar' in parsed) return true;
  const chars = parsed.characters;
  if (Array.isArray(chars) && chars.some((c) => c && typeof c === 'object' && LEGACY_CHARACTER_IDS.includes((c as { id?: string }).id ?? ''))) {
    return true;
  }
  return false;
}

export function loadState(): AppState {
  if (typeof window === 'undefined') {
    return freshState();
  }
  try {
    const s = localStorage.getItem('meora-state');
    if (!s) return freshState();
    const parsed = JSON.parse(s) as Record<string, unknown>;

    // 旧バージョン/旧構造を検出 → 移行。
    // characters をリセットし、avatar を破棄し、onboardingDone=false にして
    // 新オンボーディング（自分のMEORA作成）へ誘導する。userName は引き継ぐ。
    if (isLegacyState(parsed)) {
      const migrated: AppState = {
        schemaVersion: SCHEMA_VERSION,
        userName: typeof parsed.userName === 'string' ? parsed.userName : '',
        characters: [],
        onboardingDone: false,
      };
      saveState(migrated);
      return migrated;
    }

    return {
      schemaVersion: SCHEMA_VERSION,
      userName: typeof parsed.userName === 'string' ? parsed.userName : '',
      characters: Array.isArray(parsed.characters) ? (parsed.characters as Character[]) : [],
      onboardingDone: parsed.onboardingDone === true,
    };
  } catch {
    return freshState();
  }
}

export function saveState(state: AppState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('meora-state', JSON.stringify({ ...state, schemaVersion: SCHEMA_VERSION }));
}

// 次回のお食事到着時刻（毎日 AM5:00）までの残り時間を返す。
// HP は AM5:00 に全回復する仕様なので、その時刻を「お食事到着時刻」として扱う。
export function timeUntilMeal(now: Date = new Date()): { hours: number; minutes: number } {
  const next = new Date(now);
  next.setHours(5, 0, 0, 0);
  if (now.getTime() >= next.getTime()) {
    // すでに今日の AM5:00 を過ぎている → 翌日の AM5:00
    next.setDate(next.getDate() + 1);
  }
  const diffMs = next.getTime() - now.getTime();
  const totalMinutes = Math.max(0, Math.ceil(diffMs / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return { hours, minutes };
}

// 「お食事到着まであと X時間 Y分」の表示文字列を返す。
export function mealCountdownLabel(now: Date = new Date()): string {
  const { hours, minutes } = timeUntilMeal(now);
  return `お食事到着まであと ${hours}時間 ${minutes}分`;
}

export function consumeHp(state: AppState, characterId: string, amount: number): AppState {
  return {
    ...state,
    characters: state.characters.map(c =>
      c.id === characterId ? { ...c, hp: Math.max(0, c.hp - amount) } : c
    ),
  };
}

// マーケットで入手できるMEORAの最小スキーマ。
// market-data.ts のサンプルMEORAはこの型を満たす。acquireCharacter に渡される。
export type AcquirableCharacter = {
  id: string;
  name: string;
  personality?: string;
  category?: string;
  photoUrl?: string;
};

// マーケットのMEORAを state.characters に追加する（=入手）。
// すでに同じ id を持つMEORAがいれば重複追加せず、そのまま state を返す（重複入手防止）。
// 追加されるMEORAは userCreated:false / sellable:false。hp 等は自作MEORAと同じデフォルト。
export function acquireCharacter(state: AppState, marketChar: AcquirableCharacter): AppState {
  if (state.characters.some((c) => c.id === marketChar.id)) {
    return state;
  }
  const newChar: Character = {
    id: marketChar.id,
    name: marketChar.name,
    role: marketChar.category || '',
    job: '',
    color: '#111',
    hp: 100,
    maxHp: 100,
    lastResetDate: '',
    personality: marketChar.personality,
    category: marketChar.category,
    photo: marketChar.photoUrl,
    userCreated: false,
    sellable: false,
  };
  return {
    ...state,
    characters: [...state.characters, newChar],
  };
}

// 指定 id のMEORAを既に入手済みか判定する。
export function isCharacterOwned(state: AppState, id: string): boolean {
  return state.characters.some((c) => c.id === id);
}

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};

export function loadChatHistory(characterId: string): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const s = localStorage.getItem(`meora-chat-${characterId}`);
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}

export function saveChatHistory(characterId: string, messages: ChatMessage[]) {
  if (typeof window === 'undefined') return;
  const trimmed = messages.slice(-50);
  localStorage.setItem(`meora-chat-${characterId}`, JSON.stringify(trimmed));
}
