import Stripe from 'stripe';
import { ENERGY_CONFIG, type PlanId } from './energy';

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
    stripeInstance = new Stripe(key);
  }
  return stripeInstance;
}

// ── サブスクリプション ───────────────────────────────────────────────────────

export type SubPlanEntry = {
  planId: PlanId;
  stripePriceId: string;
  priceYen: number;
  label: string;
};

const SUB_PRICE_IDS: Partial<Record<PlanId, string>> = {
  light: process.env.STRIPE_PRICE_LIGHT || '',
  standard: process.env.STRIPE_PRICE_STANDARD || '',
};

export function getSubPrice(planId: PlanId): SubPlanEntry | null {
  if (planId === 'free') return null;
  const plan = ENERGY_CONFIG.plans[planId];
  if (!plan) return null;
  const stripePriceId = SUB_PRICE_IDS[planId];
  if (!stripePriceId) return null;
  return {
    planId,
    stripePriceId,
    priceYen: plan.priceYen,
    label: plan.label,
  };
}
