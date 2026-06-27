// ─────────────────────────────────────────────────────────────────────────────
// MEORA メッセージ管理エンジン
//
// 月次制:
//   無料: 約50通/月（繰越なし）
//   ライト: 約200通/月（680円）
//   スタンダード: 約700通/月（1,480円）
//   月次通数は翌月に繰り越さない
//   スポット購入分は180日有効（月リセット対象外）
// ─────────────────────────────────────────────────────────────────────────────

export type PlanId = 'free' | 'light' | 'standard';
export type SpotKey = 'cherry' | 'mikan' | 'grape';

export type Usage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  input_tokens?: number;
  output_tokens?: number;
};

// ── ウォレット（メッセージ管理） ─────────────────────────────────────────────

export type Wallet = {
  version: number;
  plan: PlanId;
  monthKey: string;
  monthlyUsed: number;
  bonusRemaining: number;
  bonusExpiresAt: number;
  registeredAt: number;
  lastUpdatedAt: number;
};

// ── キャラ別コスト記録（分析用） ─────────────────────────────────────────────

export type CharEnergy = {
  hp: number;
  maxHp: number;
  totalTokens: number;
  totalCostYen: number;
  totalHpConsumed: number;
  lastUpdatedAt: number;
};

export const ENERGY_CONFIG = {
  yenPerUsd: 180,
  model: 'gpt-5.4-mini',
  usdPer1MInputTokens: 0.75,
  usdPer1MOutputTokens: 4.5,

  monthlyLimits: {
    free: 50,
    light: 200,
    standard: 700,
  },

  plans: {
    free: { id: 'free' as PlanId, label: '無料プラン', priceYen: 0, monthlyLimit: 50 },
    light: { id: 'light' as PlanId, label: 'ライトプラン', priceYen: 680, monthlyLimit: 200 },
    standard: { id: 'standard' as PlanId, label: 'スタンダードプラン', priceYen: 1480, monthlyLimit: 700 },
  } as Record<PlanId, { id: PlanId; label: string; priceYen: number; monthlyLimit: number }>,

  spotItems: {
    cherry: { priceYen: 290, messagesGranted: 50, label: 'さくらんぼ' },
    mikan: { priceYen: 480, messagesGranted: 90, label: 'みかん' },
    grape: { priceYen: 980, messagesGranted: 200, label: 'ぶどう' },
  } as Record<SpotKey, { priceYen: number; messagesGranted: number; label: string }>,

  bonusValidDays: 180,

  walletVersion: 3,
};

// ── 換算ヘルパー（コスト分析用） ────────────────────────────────────────────

function inTokens(u?: Usage): number {
  return u?.prompt_tokens ?? u?.input_tokens ?? 0;
}
function outTokens(u?: Usage): number {
  return u?.completion_tokens ?? u?.output_tokens ?? 0;
}

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

// ── 日付ヘルパー ─────────────────────────────────────────────────────────────

function monthKeyNow(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthKeyFromTimestamp(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ── プラン ────────────────────────────────────────────────────────────────────

export function getPlan(planId: PlanId) {
  return ENERGY_CONFIG.plans[planId] || ENERGY_CONFIG.plans.free;
}

export function getMonthlyLimit(wallet: Wallet): number {
  return ENERGY_CONFIG.plans[wallet.plan]?.monthlyLimit ?? ENERGY_CONFIG.monthlyLimits.free;
}

// ── ウォレット操作 ───────────────────────────────────────────────────────────

const WALLET_KEY = 'meora-wallet';

export function createWallet(planId: PlanId = 'free'): Wallet {
  return {
    version: ENERGY_CONFIG.walletVersion,
    plan: ENERGY_CONFIG.plans[planId] ? planId : 'free',
    monthKey: monthKeyNow(),
    monthlyUsed: 0,
    bonusRemaining: 0,
    bonusExpiresAt: 0,
    registeredAt: Date.now(),
    lastUpdatedAt: Date.now(),
  };
}

function refreshMonth(wallet: Wallet): Wallet {
  const now = monthKeyNow();
  if (wallet.monthKey !== now) {
    wallet.monthKey = now;
    wallet.monthlyUsed = 0;
  }
  if (wallet.bonusExpiresAt > 0 && Date.now() > wallet.bonusExpiresAt) {
    wallet.bonusRemaining = 0;
    wallet.bonusExpiresAt = 0;
  }
  return wallet;
}

export function loadWallet(): Wallet {
  if (typeof window === 'undefined') return createWallet();
  try {
    const raw = localStorage.getItem(WALLET_KEY);
    if (!raw) {
      const wallet = createWallet();
      saveWallet(wallet);
      return wallet;
    }
    const parsed = JSON.parse(raw) as Partial<Wallet>;

    if (!parsed.version || parsed.version < 3) {
      const wallet = createWallet();
      wallet.plan = (parsed as Record<string, unknown>).plan as PlanId || 'free';
      if (!ENERGY_CONFIG.plans[wallet.plan]) wallet.plan = 'free';
      saveWallet(wallet);
      return wallet;
    }

    const wallet: Wallet = {
      version: ENERGY_CONFIG.walletVersion,
      plan: parsed.plan && ENERGY_CONFIG.plans[parsed.plan] ? parsed.plan : 'free',
      monthKey: parsed.monthKey || monthKeyNow(),
      monthlyUsed: parsed.monthlyUsed || 0,
      bonusRemaining: parsed.bonusRemaining || 0,
      bonusExpiresAt: parsed.bonusExpiresAt || 0,
      registeredAt: parsed.registeredAt || Date.now(),
      lastUpdatedAt: parsed.lastUpdatedAt || Date.now(),
    };
    return refreshMonth(wallet);
  } catch {
    return createWallet();
  }
}

export function saveWallet(wallet: Wallet) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WALLET_KEY, JSON.stringify(wallet));
  } catch {}
}

export function refreshWallet(wallet: Wallet): Wallet {
  if (!wallet) return createWallet();
  refreshMonth(wallet);
  wallet.lastUpdatedAt = Date.now();
  return wallet;
}

// ── メッセージ管理 ───────────────────────────────────────────────────────────

export function canSendMessage(wallet: Wallet): boolean {
  refreshMonth(wallet);
  const limit = getMonthlyLimit(wallet);
  if (wallet.monthlyUsed < limit) return true;
  if (wallet.bonusRemaining > 0) return true;
  return false;
}

export function recordMessage(wallet: Wallet): void {
  refreshMonth(wallet);
  const limit = getMonthlyLimit(wallet);
  if (wallet.monthlyUsed < limit) {
    wallet.monthlyUsed++;
  } else if (wallet.bonusRemaining > 0) {
    wallet.bonusRemaining--;
  }
  wallet.lastUpdatedAt = Date.now();
}

export function addBonusMessages(wallet: Wallet, count: number): void {
  wallet.bonusRemaining += count;
  const expiresAt = Date.now() + ENERGY_CONFIG.bonusValidDays * 24 * 60 * 60 * 1000;
  wallet.bonusExpiresAt = Math.max(wallet.bonusExpiresAt, expiresAt);
  wallet.lastUpdatedAt = Date.now();
}

export function getRemainingMessages(wallet: Wallet): { monthly: number; bonus: number; total: number } {
  refreshMonth(wallet);
  const limit = getMonthlyLimit(wallet);
  const monthlyRemaining = Math.max(0, limit - wallet.monthlyUsed);
  return {
    monthly: monthlyRemaining,
    bonus: wallet.bonusRemaining,
    total: monthlyRemaining + wallet.bonusRemaining,
  };
}

export function changePlan(wallet: Wallet, planId: PlanId): Wallet {
  if (!ENERGY_CONFIG.plans[planId]) return wallet;
  wallet.plan = planId;
  wallet.lastUpdatedAt = Date.now();
  return wallet;
}

// ── キャラ別コスト記録 ──────────────────────────────────────────────────────

const CHAR_ENERGY_PREFIX = 'meora-char-hp-';

function createCharEnergy(): CharEnergy {
  return {
    hp: 0,
    maxHp: 30,
    totalTokens: 0,
    totalCostYen: 0,
    totalHpConsumed: 0,
    lastUpdatedAt: Date.now(),
  };
}

export function loadCharEnergy(characterId: string): CharEnergy {
  if (typeof window === 'undefined') return createCharEnergy();
  try {
    const raw = localStorage.getItem(`${CHAR_ENERGY_PREFIX}${characterId}`);
    if (!raw) return createCharEnergy();
    const parsed = JSON.parse(raw) as Partial<CharEnergy>;
    return { ...createCharEnergy(), ...parsed };
  } catch {
    return createCharEnergy();
  }
}

export function saveCharEnergy(characterId: string, charEnergy: CharEnergy) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${CHAR_ENERGY_PREFIX}${characterId}`, JSON.stringify(charEnergy));
  } catch {}
}

// ── 会話でのコスト記録（分析用） ────────────────────────────────────────────

export type ConsumeInput = { usage?: Usage; userText?: string; replyText?: string };
export type ConsumeResult = { costYen: number; tokens: number };

export function estimateUsage(userText = '', replyText = ''): Usage {
  const tokensPerChar = 0.7;
  const systemPromptTokens = 220;
  const minOutputTokens = 24;
  return {
    prompt_tokens: Math.round(systemPromptTokens + userText.length * tokensPerChar),
    completion_tokens: Math.max(minOutputTokens, Math.round(replyText.length * tokensPerChar)),
  };
}

export function recordCost(charEnergy: CharEnergy, input: ConsumeInput = {}): ConsumeResult {
  const { usage, userText, replyText } = input;
  let tokens = 0;
  let costYen = 0;

  if (usage && tokenTotal(usage) > 0) {
    tokens = tokenTotal(usage);
    costYen = costYenFromUsage(usage);
  } else if (userText != null || replyText != null) {
    const est = estimateUsage(userText || '', replyText || '');
    tokens = tokenTotal(est);
    costYen = costYenFromUsage(est);
  }

  charEnergy.totalTokens += tokens;
  charEnergy.totalCostYen += costYen;
  charEnergy.lastUpdatedAt = Date.now();

  if (typeof window !== 'undefined') {
    console.debug(`[MEORA cost] ${tokens} tok, ${costYen.toFixed(4)} yen`);
  }

  return { costYen, tokens };
}

// ── Stripe 購入 → ボーナス通数追加 ──────────────────────────────────────────

export function purchaseSpotToWallet(wallet: Wallet, spotKey: SpotKey): { addedMessages: number } | null {
  const spot = ENERGY_CONFIG.spotItems[spotKey];
  if (!spot) return null;
  addBonusMessages(wallet, spot.messagesGranted);
  return { addedMessages: spot.messagesGranted };
}
