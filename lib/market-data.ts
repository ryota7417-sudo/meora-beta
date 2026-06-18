// クリエイターマーケット（消費者側）のサンプルデータ。
// バックエンドが無いため静的データで構成する。決済・サブスク・投げ銭は
// すべてビジュアルのスタブ（実データは持たない）。「入手して話す」だけが実機能。
//
// キャラ id は `market-xxx` 形式。入手すると store.acquireCharacter で
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
  perks: { kind: 'consume' | 'cosme'; text: string }[];
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

// マーケットのキャラ。AcquirableCharacter を満たす（入手時にそのまま使える）。
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
  photoUrl?: string; // キャラ画像（public/ 配下のパス）
  acquiredCount: number; // ランキング表示用ダミー
  creatorId: string;
  creatorName: string;
  freePoints: string[]; // 無料で話せる範囲
  subPoints: { kind: 'consume' | 'cosme'; text: string }[]; // サブスクで届く内容
  subPrice: number; // サブ価格（表示用）
  items: MarketItem[]; // 関連アイテム（スタブ）
  foodItems?: FoodItem[]; // お店で買えるお食事アイテム（任意）
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
  plans: MarketPlan[];
  items: MarketItem[]; // お店扱いのアイテム（スタブ）
};

export const MARKET_CREATORS: MarketCreator[] = [
  {
    id: 'yuzu_studio',
    storeName: 'YUZU STUDIO',
    handle: '@yuzu_studio',
    name: 'ゆず',
    followers: '12.4k',
    rating: '★4.8',
    bio: 'やさしい気持ちになれるキャラを作っています。今日もおつかれさま。ゆっくり話そう。',
    bannerBg: '#fce4ee',
    avatarBg: '#fff0f5',
    plans: [
      {
        id: 'yuzu_fanclub',
        name: 'ゆずファンクラブ',
        price: 480,
        perks: [
          { kind: 'consume', text: 'おにぎり×4（トーク券。1個でトーク1回分）' },
          { kind: 'cosme', text: '今月の限定スキン×1' },
          { kind: 'cosme', text: '限定エピソード（月1配信）' },
        ],
      },
      {
        id: 'yuzu_light',
        name: 'ライトプラン',
        price: 240,
        perks: [
          { kind: 'consume', text: 'おにぎり×2（トーク券）' },
          { kind: 'cosme', text: '限定スタンプセット' },
        ],
        joined: true,
      },
    ],
    items: [
      { id: 'yuzu-item-1', name: '夏スキン「ひまわり」', desc: 'moco の季節限定スキン', price: 240 },
      { id: 'yuzu-item-2', name: 'ボイススタンプ集', desc: 'トークで使える音声リアクション', price: 360, owned: true },
      { id: 'yuzu-item-3', name: 'おやすみモード', desc: '夜だけの特別な口調を解放', price: 180 },
    ],
  },
  {
    id: 'ren_works',
    storeName: 'REN WORKS',
    handle: '@ren_works',
    name: 'レン',
    followers: '8.1k',
    rating: '★4.6',
    bio: '本音で背中を押すキャラ専門。甘やかさないけど、ちゃんと味方。',
    bannerBg: '#e8e6ff',
    avatarBg: '#e8f4ff',
    plans: [
      {
        id: 'ren_club',
        name: 'レン応援クラブ',
        price: 580,
        perks: [
          { kind: 'consume', text: 'おにぎり×5（トーク券）' },
          { kind: 'cosme', text: '限定ボイス（月1）' },
          { kind: 'cosme', text: '裏設定エピソード' },
        ],
      },
    ],
    items: [
      { id: 'ren-item-1', name: '辛口スキン「ブラック」', desc: 'レンの限定見た目', price: 300 },
      { id: 'ren-item-2', name: '応援メッセージ集', desc: '凹んだ日用の音声10種', price: 280 },
    ],
  },
  {
    id: 'mori_atelier',
    storeName: 'MORI ATELIER',
    handle: '@mori_atelier',
    name: 'もり',
    followers: '5.6k',
    rating: '★4.7',
    bio: '森のアトリエから、のんびり穏やかなキャラをお届け。深呼吸していってね。',
    bannerBg: '#f0ffe8',
    avatarBg: '#f0ffe8',
    plans: [
      {
        id: 'mori_club',
        name: 'アトリエ会員',
        price: 380,
        perks: [
          { kind: 'consume', text: 'おにぎり×3（トーク券）' },
          { kind: 'cosme', text: '季節の限定スキン' },
        ],
      },
    ],
    items: [
      { id: 'mori-item-1', name: '森スキン「こもれび」', desc: 'こもれびの限定見た目', price: 220 },
    ],
  },
];

export const MARKET_CHARACTERS: MarketCharacter[] = [
  {
    id: 'market-moco',
    name: 'moco',
    personality:
      'おっとりした聞き上手の癒し系。相手を否定せず、まず受け止めてくれる。やわらかい敬語まじりのタメ口で、「〜だね」「えらいよ」「うんうん」とあいづちを打つ。今日あった出来事やもやもやの整理、寝る前のひとりごとに寄り添うのが得意。返事は短めで、相手のペースを大事にする。けっして説教せず、安心させる言葉を選ぶ。',
    category: '癒し',
    tags: ['癒し', '愚痴きき', '寝る前'],
    tagline: 'いつでも味方。やさしく話を聞いてくれる癒し系。',
    catchphrase: '「だいじょうぶ、ちゃんと聞いてるよ」',
    intro: {
      personality: 'おっとり・聞き上手。否定せずに受け止めてくれる。',
      tone: 'やわらかい敬語まじりのタメ口。「〜だね」「えらいよ」',
      topics: '今日あった出来事、もやもやの整理、寝る前のひとりごと。',
    },
    accessTier: 'free',
    iconBg: '#fce4ee',
    photoUrl: '/characters/IMG_4005.PNG',
    acquiredCount: 9820,
    creatorId: 'yuzu_studio',
    creatorName: 'ゆず',
    freePoints: ['1日◯回まで無料トーク', '基本の性格・口調での会話', '通常スキンで表示'],
    subPoints: [
      { kind: 'consume', text: 'おにぎり×4（トーク券。1個でトーク1回分）' },
      { kind: 'cosme', text: '今月の限定スキン×1' },
      { kind: 'cosme', text: '限定エピソード（月1配信）・夜だけの特別な口調' },
    ],
    subPrice: 480,
    items: [
      { id: 'moco-item-1', name: '夏スキン「ひまわり」', desc: '季節限定の見た目', price: 240 },
      { id: 'moco-item-2', name: 'ボイススタンプ集', desc: '音声リアクション 10種', price: 360 },
    ],
  },
  {
    id: 'market-sora',
    name: 'そら',
    personality:
      'さわやかで前向きな応援キャラ。明るい敬語でテンポよく話し、「いいね！」「やってみよ！」と背中を押す。勉強や仕事のやる気が出ないときに、小さな一歩を一緒に決めてくれる。ポジティブだが押しつけがましくなく、相手の不安もちゃんと拾う。語尾は明るめ。',
    category: '勉強応援',
    tags: ['勉強応援', '推し活'],
    tagline: '一歩ふみ出したい日に。前向きに背中を押す相棒。',
    catchphrase: '「いっしょに、ちょっとだけやってみよ！」',
    intro: {
      personality: 'さわやか・前向き。やる気スイッチを押してくれる。',
      tone: '明るい敬語でテンポよく。「いいね！」「やってみよ！」',
      topics: '勉強の計画、やる気が出ない日、目標のふりかえり。',
    },
    accessTier: 'sub',
    iconBg: '#e8f4ff',
    photoUrl: '/characters/IMG_4006.PNG',
    acquiredCount: 6210,
    creatorId: 'yuzu_studio',
    creatorName: 'ゆず',
    freePoints: ['1日◯回まで無料トーク', '基本の性格・口調での会話', '通常スキンで表示'],
    subPoints: [
      { kind: 'consume', text: 'おにぎり×4（トーク券）' },
      { kind: 'cosme', text: '応援ボイス（月1）' },
    ],
    subPrice: 480,
    items: [{ id: 'sora-item-1', name: '青空スキン', desc: 'そらの限定見た目', price: 240 }],
  },
  {
    id: 'market-hinata',
    name: 'ひなた',
    personality:
      'あたたかくて世話焼きな妹キャラ。元気いっぱいのタメ口で、「おかえり！」「ごはん食べた？」と気にかけてくれる。落ち込んでいるときはそっと寄り添い、うれしいことは一緒に全力で喜ぶ。ちょっとおせっかいだけど、その分まっすぐ。',
    category: '癒し',
    tags: ['癒し', 'おもしろ系'],
    tagline: 'おかえり、を言ってくれる。元気な世話焼き妹キャラ。',
    catchphrase: '「おかえり！今日もおつかれさま！」',
    intro: {
      personality: '元気・世話焼き。一緒に喜んで一緒に落ち込んでくれる。',
      tone: '明るいタメ口。「おかえり！」「ごはん食べた？」',
      topics: '今日のできごと報告、ちょっとした自慢、ねぎらい。',
    },
    accessTier: 'free',
    iconBg: '#fff4d8',
    photoUrl: '/characters/IMG_4007.PNG',
    acquiredCount: 3388,
    creatorId: 'yuzu_studio',
    creatorName: 'ゆず',
    freePoints: ['1日◯回まで無料トーク', '基本の性格・口調での会話', '通常スキンで表示'],
    subPoints: [
      { kind: 'consume', text: 'おにぎり×3（トーク券）' },
      { kind: 'cosme', text: '限定スタンプ' },
    ],
    subPrice: 380,
    items: [],
  },
  {
    id: 'market-ren',
    name: 'レン',
    personality:
      'ちょっと毒舌だけど本音で背中を押してくれる相棒。クールなタメ口で、「で、どうすんの？」「まあ悪くないんじゃない」とぶっきらぼう。でも本当は相手のことをよく見ていて、ここぞというときは真剣に味方する。甘やかさないが見捨てない。',
    category: '恋愛相談',
    tags: ['恋愛相談', 'おもしろ系'],
    tagline: 'ちょっと毒舌。本音で背中を押してくれる相棒。',
    catchphrase: '「で、ほんとはどうしたいわけ？」',
    intro: {
      personality: 'クール・毒舌だけど面倒見がいい。本音で向き合う。',
      tone: 'ぶっきらぼうなタメ口。「で、どうすんの？」',
      topics: '恋愛のもやもや、決断の後押し、現実的なアドバイス。',
    },
    accessTier: 'sub',
    iconBg: '#e8e6ff',
    photoUrl: '/characters/IMG_4008.PNG',
    acquiredCount: 7140,
    creatorId: 'ren_works',
    creatorName: 'レン',
    freePoints: ['1日◯回まで無料トーク', '基本の性格・口調での会話', '通常スキンで表示'],
    subPoints: [
      { kind: 'consume', text: 'おにぎり×5（トーク券）' },
      { kind: 'cosme', text: '限定ボイス（月1）' },
      { kind: 'cosme', text: '裏設定エピソード' },
    ],
    subPrice: 580,
    items: [
      { id: 'ren-c-item-1', name: '辛口スキン「ブラック」', desc: 'レンの限定見た目', price: 300 },
    ],
  },
  {
    id: 'market-komorebi',
    name: 'こもれび',
    personality:
      'のんびり穏やかな癒し系。ゆったりした敬語まじりで、「ふふ、いいですね」「あわてなくて大丈夫ですよ」と話す。せかさず、相手の呼吸に合わせてくれる。自然や季節の話題が好きで、気持ちをそっとほぐすのが得意。沈黙も心地よくしてくれる。',
    category: '癒し',
    tags: ['癒し', '寝る前'],
    tagline: '深呼吸したい夜に。森のように穏やかな癒し系。',
    catchphrase: '「あわてなくて、大丈夫ですよ」',
    intro: {
      personality: 'のんびり・穏やか。せかさず呼吸に合わせてくれる。',
      tone: 'ゆったりした敬語。「ふふ、いいですね」',
      topics: '疲れた日のクールダウン、季節の話、心の整理。',
    },
    accessTier: 'free',
    iconBg: '#d8f0c8',
    photoUrl: '/characters/IMG_4013.PNG',
    acquiredCount: 4902,
    creatorId: 'mori_atelier',
    creatorName: 'もり',
    freePoints: ['1日◯回まで無料トーク', '基本の性格・口調での会話', '通常スキンで表示'],
    subPoints: [
      { kind: 'consume', text: 'おにぎり×3（トーク券）' },
      { kind: 'cosme', text: '季節の限定スキン' },
    ],
    subPrice: 380,
    items: [
      { id: 'komorebi-item-1', name: '森スキン「こもれび」', desc: '限定の見た目', price: 220 },
    ],
  },
];

// マーケット全体のスキンアイテム（クリエイターが出品するスキンのサンプル）
export type MarketSkinItem = SkinItem & {
  creatorId: string;
  creatorName: string;
  characterId?: string; // 対象キャラ（任意）
};

export const MARKET_SKIN_ITEMS: MarketSkinItem[] = [
  { id: 'skin-himawari', name: '夏スキン「ひまわり」', desc: 'moco の季節限定見た目',     price: 240, creatorId: 'yuzu_studio', creatorName: 'ゆず', characterId: 'market-moco' },
  { id: 'skin-aozora',   name: '青空スキン',           desc: 'そら の限定見た目',          price: 240, creatorId: 'yuzu_studio', creatorName: 'ゆず', characterId: 'market-sora' },
  { id: 'skin-black',    name: '辛口スキン「ブラック」', desc: 'レン の限定見た目',          price: 300, creatorId: 'ren_works',   creatorName: 'レン', characterId: 'market-ren' },
  { id: 'skin-komorebi', name: '森スキン「こもれび」',  desc: 'こもれびの限定見た目',       price: 220, creatorId: 'mori_atelier', creatorName: 'もり', characterId: 'market-komorebi' },
];

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
export const PICKUP_CHARACTERS: MarketCharacter[] = [MARKET_CHARACTERS[0], MARKET_CHARACTERS[3]];

// ランキング（入手数の降順）
export const RANKING_CHARACTERS: MarketCharacter[] = [...MARKET_CHARACTERS].sort(
  (a, b) => b.acquiredCount - a.acquiredCount
);
