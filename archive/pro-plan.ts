// プロプラン（2980円/月）— 2026-06-21 アーカイブ
// 見送り理由: おぴよちゃん判断で一旦見送り
//
// 復活させる場合:
// 1. app/market/character/[id]/page.tsx の SUB_PLANS に追加
// 2. lib/market-data.ts の MARKET_CREATORS → opiyo の plans に追加

// SUB_PLANS 用
export const PRO_PLAN_OPTION = { id: 'pro', name: 'プロ', price: 2980 } as const;

// market-data.ts の opiyo クリエイター plans 用
export const PRO_PLAN_PERKS = {
  id: 'opiyo_pro',
  name: 'プロ',
  price: 2980,
  perks: [
    { kind: 'consume' as const, text: 'お寿司×15（トーク券）' },
    { kind: 'consume' as const, text: 'オムライス×5（トーク券）' },
    { kind: 'consume' as const, text: 'おにぎり×5（トーク券）' },
  ],
};
