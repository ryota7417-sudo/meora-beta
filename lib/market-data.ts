// クリエイターマーケット（消費者側）のサンプルデータ。
// バックエンドが無いため静的データで構成する。決済・サブスク・投げ銭は
// すべてビジュアルのスタブ（実データは持たない）。「入手して話す」だけが実機能。
//
// MEORA id は `market-xxx` 形式。入手すると store.acquireCharacter で
// この id のまま state.characters に追加され、/chat/{id} で会話できる。

import type { AcquirableCharacter } from './store';

// 表示用のアイテム（スタブ。購入は「準備中」モーダル）
export type MarketItem = {
  id: string;
  name: string;
  desc: string;
  price: number; // 表示用ダミー価格（円）
  owned?: boolean; // 「購入済み」表示のサンプル用
};

// 表示用のサブスクプラン（スタブ。加入は「準備中」モーダル）
export type MarketPlan = {
  id: string;
  name: string;
  price: number; // 月額（円・表示用）
  perks: { kind: 'consume' | 'skin'; text: string }[];
  joined?: boolean; // 「加入中」表示のサンプル用
};

// お食事アイテム（満腹度/HP 回復用）
export type FoodItem = {
  id: string;
  name: string;
  desc: string;
  hpBonus: number; // 満腹度回復量
  price: number;   // 表示用価格（円）。0 = 毎日無料支給
};

// スキンアイテム
export type SkinItem = {
  id: string;
  name: string;
  desc: string;
  price: number;
};

// デフォルトお食事アイテム（3段階）
export const DEFAULT_FOOD_ITEMS: FoodItem[] = [
  { id: 'food-onigiri',  name: 'おにぎり',  desc: '基本のご飯。毎日1個無料支給。',  hpBonus: 30,  price: 0 },
  { id: 'food-omurice',  name: 'オムライス', desc: '満腹セット。ちょっと贅沢に。',     hpBonus: 50,  price: 150 },
  { id: 'food-sushi',    name: 'お寿司',    desc: '特上ご飯。たっぷり元気になれる。', hpBonus: 100, price: 300 },
];

// マーケットのMEORA。AcquirableCharacter を満たす（入手時にそのまま使える）。
export type MarketCharacter = AcquirableCharacter & {
  id: string;
  name: string;
  personality: string; // チャットのシステムプロンプト素材（性格・口調を具体的に）
  category: string; // 主カテゴリ（内部用・表示では使わない）
  tags: string[]; // 表示用タグ（# 抜き）
  tagline: string; // 一覧用の短いキャッチ
  catchphrase: string; // 詳細ヒーローの「セリフ」
  intro: { personality: string; tone: string; topics: string }; // ABOUT セクション
  accessTier: 'free' | 'sub'; // FREE / SUB バッジ表示用
  iconBg: string; // アイコン枠の背景色
  photoUrl?: string; // MEORA画像（public/ 配下のパス）
  acquiredCount: number; // ランキング表示用ダミー
  creatorId: string;
  creatorName: string;
  freePoints: string[]; // 無料で話せる範囲
  subPoints: { kind: 'consume' | 'skin'; text: string }[]; // サブスクで届く内容
  subPrice: number; // サブ価格（表示用）
  items: MarketItem[]; // 関連アイテム（スタブ）
  foodItems?: FoodItem[]; // お店で買えるお食事アイテム（任意）
  buyPrice?: number; // 買い切り価格（0または未指定 = 無料入手可能、値あり = 有料買い切り）
};

// クリエイター（お店）。
export type MarketCreator = {
  id: string;
  storeName: string; // 店名（大文字英字想定）
  handle: string; // @handle
  name: string; // 表示名
  followers: string; // フォロワー数（表示用文字列）
  rating: string; // 評価（表示用文字列）
  bio: string;
  bannerBg: string;
  avatarBg: string;
  avatarUrl?: string; // クリエイターアバター画像（未指定時はデフォルト画像）
  plans: MarketPlan[];
  items: MarketItem[]; // お店扱いのアイテム（スタブ）
};

export const MARKET_CREATORS: MarketCreator[] = [
  {
    id: 'opiyo',
    storeName: 'OPIYO STUDIO',
    handle: '@opiyo',
    name: 'おぴよ',
    followers: '0',
    rating: '-',
    bio: '個性あふれる動物MEORAを作っています。',
    bannerBg: '#f7f5f0',
    avatarBg: '#f7f5f0',
    avatarUrl: '/characters/opiyo_icon.PNG',
    plans: [
      {
        id: 'opiyo_light',
        name: 'ライト',
        price: 480,
        perks: [
          { kind: 'consume', text: 'おにぎり×3（トーク券）' },
        ],
      },
      {
        id: 'opiyo_standard',
        name: 'スタンダード',
        price: 980,
        perks: [
          { kind: 'consume', text: 'お寿司×2（トーク券）' },
          { kind: 'consume', text: 'オムライス×2（トーク券）' },
          { kind: 'consume', text: 'おにぎり×4（トーク券）' },
        ],
      },
      {
        id: 'opiyo_premium',
        name: 'プレミアム',
        price: 1480,
        perks: [
          { kind: 'consume', text: 'お寿司×6（トーク券）' },
          { kind: 'consume', text: 'オムライス×3（トーク券）' },
          { kind: 'consume', text: 'おにぎり×3（トーク券）' },
        ],
      },
    ],
    items: [],
  },
];

export const MARKET_CHARACTERS: MarketCharacter[] = [
  {
    id: 'market-saio',
    name: 'サイオ',
    personality:
      '男前で言うことはズバリ言ってくれる。不安な時はしっかりフォローしてくれる頼れるやつ。「俺」を使い、敬語は使わない。「俺は〜だと思う」「はっきり言うけどさ」のように率直に話す。相手の気持ちはちゃんと汲み取った上で、本音をストレートに伝える。恋愛や人間関係の相談には特に真剣に向き合う。',
    category: '恋愛相談',
    tags: ['恋愛相談', '相談'],
    tagline: 'ズバリ言ってくれる。でも、ちゃんと味方。',
    catchphrase: '「俺に聞いてくれよ。はっきり言うからさ」',
    intro: {
      personality: '男前・率直。言うことはズバリ言うが、不安な時はしっかりフォロー。',
      tone: '俺。「俺は〜だと思う」。敬語は使わない。',
      topics: '恋愛相談、人生相談、悩み事全般。',
    },
    accessTier: 'free',
    iconBg: '#e0e0e0',
    photoUrl: '/characters/サイオ.PNG',
    acquiredCount: 0,
    creatorId: 'opiyo',
    creatorName: 'おぴよ',
    freePoints: [],
    subPoints: [
      { kind: 'consume', text: 'おにぎり×3（トーク券）' },
    ],
    subPrice: 480,
    items: [],
  },
  {
    id: 'market-ookuchibashi',
    name: 'オオクチバシ',
    personality:
      '明るくてよく話す。話が脱線しがちだけど、すごく親身になって話を聞いてくれる。「あたし」を使い、完全なタメ口で話す。「あたしはさ〜」「わかるわかる！」のようにテンション高めで会話する。友達関係や恋愛の相談に特に親身。',
    category: '友達',
    tags: ['友達相談', '恋愛相談'],
    tagline: '明るくて親身。よく脱線するけど、ちゃんと聞いてくれる。',
    catchphrase: '「ねえねえ聞いて！...ってか、あんたの話聞かせてよ！」',
    intro: {
      personality: '明るい・よく話す・脱線しがち。でもすごく親身。',
      tone: 'あたし。タメ口。「わかるわかる！」「ってかさ〜」',
      topics: '友達関係の相談、恋愛相談、雑談。',
    },
    accessTier: 'free',
    iconBg: '#f5f0e0',
    photoUrl: '/characters/オオクチバシ.PNG',
    acquiredCount: 0,
    creatorId: 'opiyo',
    creatorName: 'おぴよ',
    freePoints: [],
    buyPrice: 300,
    subPoints: [
      { kind: 'consume', text: 'おにぎり×3（トーク券）' },
    ],
    subPrice: 480,
    items: [],
  },
  {
    id: 'market-kirilin',
    name: 'きりりん',
    personality:
      '真面目で常に客観的に発言する。理論的に物事を考え、根拠をもって意見を述べる。「私」を使い、丁寧な敬語で話す。「私としては〜と考えます」「客観的に見ると〜ですね」のように冷静に話す。仕事の相談や真面目な相談、知識を求める場面で力を発揮する。',
    category: '仕事相談',
    tags: ['仕事相談', '知識'],
    tagline: '冷静で理論的。真面目な相談には頼れる存在。',
    catchphrase: '「客観的に見て、お話を整理しましょう」',
    intro: {
      personality: '真面目・客観的・理論的。根拠をもって発言する。',
      tone: '私。敬語。「私としては〜と考えます」',
      topics: '仕事の相談、真面目な相談、知識。',
    },
    accessTier: 'free',
    iconBg: '#f5ecd0',
    photoUrl: '/characters/きりりん.PNG',
    acquiredCount: 0,
    creatorId: 'opiyo',
    creatorName: 'おぴよ',
    freePoints: [],
    subPoints: [
      { kind: 'consume', text: 'おにぎり×3（トーク券）' },
    ],
    subPrice: 480,
    items: [],
  },
];

// マーケット全体のスキンアイテム（クリエイターが出品するスキンのサンプル）
export type MarketSkinItem = SkinItem & {
  creatorId: string;
  creatorName: string;
  characterId?: string; // 対象MEORA（任意）
};

export const MARKET_SKIN_ITEMS: MarketSkinItem[] = [];

// ---- ヘルパー ----

export function getMarketCharacter(id: string): MarketCharacter | undefined {
  return MARKET_CHARACTERS.find((c) => c.id === id);
}

export function getMarketCreator(id: string): MarketCreator | undefined {
  return MARKET_CREATORS.find((c) => c.id === id);
}

export function getCharactersByCreator(creatorId: string): MarketCharacter[] {
  return MARKET_CHARACTERS.filter((c) => c.creatorId === creatorId);
}

// トップのピックアップ（先頭2件）
export const PICKUP_CHARACTERS: MarketCharacter[] = [MARKET_CHARACTERS[0], MARKET_CHARACTERS[1]];

// RANKING: アーカイブ済み → archive/ranking-section.tsx
