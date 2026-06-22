// ─────────────────────────────────────────────────────────────────────────────
// MEORA 満腹度（エネルギー / HP）エンジン
//
// ユーザー単位のエネルギー（満腹度）を管理する。従来の「1会話=一律5HP・キャラ別HP」を
// 廃止し、OpenAI のトークン usage（実コスト）に応じて内部HPを消費する従量制へ移行。
//
// 内部HPは小数で保持し、ユーザーには数値を見せず「携帯バッテリー風の3目盛り満腹メーター」
// のみで状態を伝える。
//
// 設定値（料金換算・食事の回復量・プラン・スポット商品・メーター閾値）は ENERGY_CONFIG に
// 集約。数値変更はこのファイル先頭の ENERGY_CONFIG だけを編集すればよい。
// ─────────────────────────────────────────────────────────────────────────────

export type PlanId = 'free' | 'light' | 'standard';
export type MealKey = 'onigiri' | 'sandwich' | 'nikujaga' | 'omurice' | 'sushi';
export type SpotKey = 'omurice' | 'sushi';

export type Usage = {
  // OpenAI Chat/Responses どちらの命名でも受けられるよう両対応
  prompt_tokens?: number;
  completion_tokens?: number;
  input_tokens?: number;
  output_tokens?: number;
};

export type Energy = {
  version: number;
  plan: PlanId;
  dailyHp: number; // 毎日配布分の残量（24hで失効・貯められない）
  spotHp: number; // スポット購入分の残量（失効しない・別枠）
  lastMealAt: number; // 最終配布日時（ms）= 配布基準の午前5時
  dailyExpiresAt: number; // 毎日配布分の失効日時（ms）
  lastUpdatedAt: number; // 最後にHPを更新した日時（ms）
  totalTokens: number; // 累計使用トークン
  totalCostYen: number; // 累計API原価（円）
  totalHpConsumed: number; // 累計消費HP
};

export const ENERGY_CONFIG = {
  // ── 料金換算の基準 ──（API原価10円 = 30HP消費 → 3HP/円）
  yenPer30Hp: 10,
  yenPerUsd: 180, // 為替: 1ドル=180円想定

  // 使用モデルとトークン単価（USD / 100万トークン）。GPT-4o mini。
  model: 'gpt-4o-mini',
  usdPer1MInputTokens: 0.15,
  usdPer1MOutputTokens: 0.6,

  // usage が取れなかった場合の安全なフォールバック（1メッセージあたりHP）
  fallbackHpPerMessage: 0.5,

  // 毎日の食事配布スケジュール
  dailyMealHour: 5, // 毎朝5時（ローカル時間）
  dailyMealTtlMs: 24 * 60 * 60 * 1000, // 配布分は24時間で失効

  // 食事アイテム（hp: 内部回復量 / meterRecovery: 見た目のメーター回復目盛り）
  meals: {
    // おにぎりの回復量は会話量を増やすため10倍（1→10）。主に無料プランの1日あたり会話量が増える。
    onigiri: { hp: 10, meterRecovery: 1, label: 'おにぎり' },
    sandwich: { hp: 11, meterRecovery: 2, label: 'サンドイッチ' },
    nikujaga: { hp: 18, meterRecovery: 3, label: '肉じゃが定食' },
    omurice: { hp: 150, meterRecovery: 3, label: 'オムライス' },
    sushi: { hp: 400, meterRecovery: 3, label: 'お寿司' },
  } as Record<MealKey, { hp: number; meterRecovery: number; label: string }>,

  // プラン: 毎朝5時に配布される食事
  plans: {
    free: { id: 'free', label: '無料プラン', priceYen: 0, dailyMeals: ['onigiri'] },
    light: { id: 'light', label: 'ライトプラン', priceYen: 480, dailyMeals: ['onigiri', 'sandwich'] },
    standard: { id: 'standard', label: 'スタンダードプラン', priceYen: 1480, dailyMeals: ['onigiri', 'sandwich', 'nikujaga'] },
  } as Record<PlanId, { id: PlanId; label: string; priceYen: number; dailyMeals: MealKey[] }>,

  // スポット購入できる食事（毎日配布とは別枠・失効しない）
  spotItems: {
    omurice: { mealKey: 'omurice' as MealKey, priceYen: 150 },
    sushi: { mealKey: 'sushi' as MealKey, priceYen: 300 },
  } as Record<SpotKey, { mealKey: MealKey; priceYen: number }>,

  // 満腹メーター（内部残量割合 → 目盛り）。67%以上=3 / 34〜66%=2 / 1〜33%=1 / 0=0
  meter: {
    segments: 3,
    thresholds: { full: 0.67, half: 0.34 },
    statusText: {
      3: '満腹',
      2: '少しお腹が空いている',
      1: 'お腹が空いている',
      0: '空腹',
    } as Record<number, string>,
  },

  schemaVersion: 2,
};

const STORAGE_KEY = 'meora-energy';

// ── 換算ヘルパー ──────────────────────────────────────────────────────────────

// 円 → HP（10円=30HP → 3HP/円）
export function hpFromYen(yen: number): number {
  return yen * (30 / ENERGY_CONFIG.yenPer30Hp);
}

function inTokens(u?: Usage): number {
  return u?.prompt_tokens ?? u?.input_tokens ?? 0;
}
function outTokens(u?: Usage): number {
  return u?.completion_tokens ?? u?.output_tokens ?? 0;
}

// usage（入力/出力トークン）→ API原価（円）。入力と出力で単価が違うため別々に計算。
export function costYenFromUsage(usage?: Usage): number {
  if (!usage) return 0;
  const usd =
    (inTokens(usage) / 1e6) * ENERGY_CONFIG.usdPer1MInputTokens +
    (outTokens(usage) / 1e6) * ENERGY_CONFIG.usdPer1MOutputTokens;
  return usd * ENERGY_CONFIG.yenPerUsd;
}

function tokenTotal(usage?: Usage): number {
  return inTokens(usage) + outTokens(usage);
}
function hasUsage(usage?: Usage): boolean {
  return !!usage && tokenTotal(usage) > 0;
}

// ── プラン / 食事 ─────────────────────────────────────────────────────────────

export function getPlan(planId: PlanId) {
  return ENERGY_CONFIG.plans[planId] || ENERGY_CONFIG.plans.free;
}

// そのプランで毎日配布される食事の合計HP（= その日の最大内部HP。メーター割合の基準）
export function getMaxDailyHp(planId: PlanId): number {
  return getPlan(planId).dailyMeals.reduce((sum, key) => sum + (ENERGY_CONFIG.meals[key]?.hp || 0), 0);
}

export function getDailyMeals(planId: PlanId) {
  return getPlan(planId).dailyMeals.map((key) => ({ key, ...ENERGY_CONFIG.meals[key] }));
}

// ── 配布 / 失効 ───────────────────────────────────────────────────────────────

// 直近の「配布基準時刻（午前5時）」を返す。
function lastMealBoundary(now: number): number {
  const d = new Date(now);
  const boundary = new Date(d);
  boundary.setHours(ENERGY_CONFIG.dailyMealHour, 0, 0, 0);
  if (d.getTime() < boundary.getTime()) {
    boundary.setDate(boundary.getDate() - 1);
  }
  return boundary.getTime();
}

// 毎日配布分を「上書き」で配布する（貯められない）。
function distributeDailyMeals(energy: Energy, now: number, force = false): Energy {
  const boundary = lastMealBoundary(now);
  if (force || !energy.lastMealAt || energy.lastMealAt < boundary) {
    energy.dailyHp = getMaxDailyHp(energy.plan);
    energy.lastMealAt = boundary;
    energy.dailyExpiresAt = boundary + ENERGY_CONFIG.dailyMealTtlMs;
  }
  return energy;
}

export function createEnergy(planId: PlanId = 'free', now: number = Date.now()): Energy {
  const energy: Energy = {
    version: ENERGY_CONFIG.schemaVersion,
    plan: ENERGY_CONFIG.plans[planId] ? planId : 'free',
    dailyHp: 0,
    spotHp: 0,
    lastMealAt: 0,
    dailyExpiresAt: 0,
    lastUpdatedAt: now,
    totalTokens: 0,
    totalCostYen: 0,
    totalHpConsumed: 0,
  };
  return distributeDailyMeals(energy, now, true);
}

// 失効と配布を適用して最新化する。読み込み・描画・チャットの前に必ず呼ぶ。
export function refreshEnergy(energy: Energy, now: number = Date.now()): Energy {
  if (!energy) return createEnergy('free', now);
  // 1) 毎日配布分のみ失効（スポット購入分は失効しない）
  if (energy.dailyExpiresAt && now >= energy.dailyExpiresAt) {
    energy.dailyHp = 0;
  }
  // 2) 午前5時を跨いで未配布なら新しい食事を配布
  distributeDailyMeals(energy, now);
  energy.lastUpdatedAt = now;
  return energy;
}

// ── HP残量 / メーター ─────────────────────────────────────────────────────────

export function getTotalHp(energy: Energy): number {
  return (energy?.dailyHp || 0) + (energy?.spotHp || 0);
}

// 返信を生成できるか（内部HPが残っているか）
export function canReply(energy: Energy): boolean {
  return getTotalHp(energy) > 0;
}

// 満腹メーターの目盛り（0〜3）。その日の最大内部HPに対する残量割合で判定。
// スポット購入分で最大を超える場合は満タン（3）扱い。
export function getMeterLevel(energy: Energy): number {
  const total = getTotalHp(energy);
  if (total <= 0) return 0;
  const max = getMaxDailyHp(energy.plan) || 1;
  const ratio = total / max;
  if (ratio >= ENERGY_CONFIG.meter.thresholds.full) return 3;
  if (ratio >= ENERGY_CONFIG.meter.thresholds.half) return 2;
  return 1;
}

export function getMeterStatusText(level: number): string {
  return ENERGY_CONFIG.meter.statusText[level] ?? ENERGY_CONFIG.meter.statusText[0];
}

// ── 消費 ──────────────────────────────────────────────────────────────────────

export type ConsumeInput = { usage?: Usage; userText?: string; replyText?: string };
export type ConsumeResult = { consumedHp: number; costYen: number; tokens: number; estimated: boolean };

// テキスト長から usage を擬似推定（実 usage が無い場合のフォールバック推定）。
export function estimateUsage(userText = '', replyText = ''): Usage {
  const tokensPerChar = 0.7;
  const systemPromptTokens = 220;
  const minOutputTokens = 24;
  return {
    prompt_tokens: Math.round(systemPromptTokens + userText.length * tokensPerChar),
    completion_tokens: Math.max(minOutputTokens, Math.round(replyText.length * tokensPerChar)),
  };
}

// 1回のやり取りでHPを消費する（energy を破壊的に更新）。
//   - usage があればそれで計算（本番API）
//   - 無ければ userText/replyText から推定
//   - どちらも無ければ安全なフォールバック値
// 消費は「毎日配布分 → スポット購入分」の順。0未満にはならない。
export function consumeForExchange(energy: Energy, input: ConsumeInput = {}, now: number = Date.now()): ConsumeResult {
  const { usage, userText, replyText } = input;
  let estimated = false;
  let tokens = 0;
  let costYen = 0;
  let hp = 0;

  if (hasUsage(usage)) {
    tokens = tokenTotal(usage);
    costYen = costYenFromUsage(usage);
    hp = hpFromYen(costYen);
  } else if (userText != null || replyText != null) {
    estimated = true;
    const est = estimateUsage(userText || '', replyText || '');
    tokens = tokenTotal(est);
    costYen = costYenFromUsage(est);
    hp = hpFromYen(costYen);
  } else {
    estimated = true;
    hp = ENERGY_CONFIG.fallbackHpPerMessage;
    costYen = hp / (30 / ENERGY_CONFIG.yenPer30Hp);
  }

  // 毎日配布分から先に消費し、足りなければスポット購入分から消費
  let remaining = hp;
  const fromDaily = Math.min(energy.dailyHp, remaining);
  energy.dailyHp = Math.max(0, energy.dailyHp - fromDaily);
  remaining -= fromDaily;

  const fromSpot = Math.min(energy.spotHp, remaining);
  energy.spotHp = Math.max(0, energy.spotHp - fromSpot);

  const consumedHp = fromDaily + fromSpot;
  energy.totalTokens += tokens;
  energy.totalCostYen += costYen;
  energy.totalHpConsumed += consumedHp;
  energy.lastUpdatedAt = now;

  return { consumedHp, costYen, tokens, estimated };
}

// ── スポット購入 / プラン変更 ─────────────────────────────────────────────────

// スポット食事を購入してHPを加算する（別枠・失効しない／仮購入：決済未実装）。
export function purchaseSpot(energy: Energy, spotKey: SpotKey, now: number = Date.now()): { addedHp: number } | null {
  const spot = ENERGY_CONFIG.spotItems[spotKey];
  if (!spot) return null;
  const meal = ENERGY_CONFIG.meals[spot.mealKey];
  if (!meal) return null;
  energy.spotHp += meal.hp;
  energy.lastUpdatedAt = now;
  return { addedHp: meal.hp };
}

// プランを変更し、その日の配布分を新プラン基準で配り直す（仮：決済未実装）。
export function changePlan(energy: Energy, planId: PlanId, now: number = Date.now()): Energy {
  if (!ENERGY_CONFIG.plans[planId]) return energy;
  energy.plan = planId;
  distributeDailyMeals(energy, now, true);
  energy.lastUpdatedAt = now;
  return energy;
}

// ── 永続化（localStorage） / 移行 ─────────────────────────────────────────────

function pickLegacyHp(parsed: Record<string, unknown>): number {
  // 旧 meora-state の characters[].hp 合計や、旧 hp 数値を拾って失わないようにする
  const direct = [parsed.hp, parsed.energyHp, parsed.currentHp].find(
    (v) => typeof v === 'number' && isFinite(v as number) && (v as number) > 0
  );
  if (typeof direct === 'number') return direct;
  return 0;
}

// 旧データ（energy 不在 / 旧HP数値）から新仕様の energy へ安全に変換。
export function migrateEnergy(parsed: Record<string, unknown> | null, now: number = Date.now()): Energy {
  const existing = parsed?.energy as Partial<Energy> | undefined;
  if (existing && typeof existing.version === 'number' && existing.version >= ENERGY_CONFIG.schemaVersion) {
    const base = createEnergy((existing.plan as PlanId) || 'free', now);
    const merged: Energy = { ...base, ...existing } as Energy;
    return refreshEnergy(merged, now);
  }
  const planId: PlanId = (parsed?.plan as PlanId) && ENERGY_CONFIG.plans[parsed?.plan as PlanId] ? (parsed!.plan as PlanId) : 'free';
  const fresh = createEnergy(planId, now);
  const legacy = pickLegacyHp(parsed || {});
  if (legacy > 0) fresh.spotHp += legacy; // 旧HPは失効しないスポット枠へ退避
  return fresh;
}

export function loadEnergy(now: number = Date.now()): Energy {
  if (typeof window === 'undefined') return createEnergy('free', now);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // 旧 meora-state に手掛かりがあれば移行（無くても無料で初期化）
      let legacySource: Record<string, unknown> | null = null;
      try {
        const s = localStorage.getItem('meora-state');
        legacySource = s ? (JSON.parse(s) as Record<string, unknown>) : null;
      } catch {
        legacySource = null;
      }
      const migrated = migrateEnergy(legacySource, now);
      saveEnergy(migrated);
      return migrated;
    }
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const energy = migrateEnergy({ energy: parsed }, now);
    return energy;
  } catch {
    return createEnergy('free', now);
  }
}

export function saveEnergy(energy: Energy) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(energy));
  } catch {
    // 容量超過等は黙って無視（次回更新で再保存される）
  }
}

// 次回のお食事到着時刻（毎朝5時）までの残り時間。
export function timeUntilNextMeal(now: Date = new Date()): { hours: number; minutes: number } {
  const next = new Date(now);
  next.setHours(ENERGY_CONFIG.dailyMealHour, 0, 0, 0);
  if (now.getTime() >= next.getTime()) next.setDate(next.getDate() + 1);
  const totalMinutes = Math.max(0, Math.ceil((next.getTime() - now.getTime()) / 60000));
  return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
}
