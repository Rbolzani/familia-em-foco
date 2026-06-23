import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export type PlanId = 'free' | 'familia' | 'plus'
export type BillingInterval = 'month' | 'year'

// Mapa price_id → { plano, intervalo }. Usado pelo webhook para
// traduzir o preço que o cliente assinou no plano interno.
export function priceToPlan(priceId: string): { plan: PlanId; interval: BillingInterval } | null {
  switch (priceId) {
    case process.env.STRIPE_PRICE_FAMILIA_MENSAL:
      return { plan: 'familia', interval: 'month' }
    case process.env.STRIPE_PRICE_FAMILIA_ANUAL:
      return { plan: 'familia', interval: 'year' }
    case process.env.STRIPE_PRICE_PLUS_MENSAL:
      return { plan: 'plus', interval: 'month' }
    case process.env.STRIPE_PRICE_PLUS_ANUAL:
      return { plan: 'plus', interval: 'year' }
    default:
      return null
  }
}

// Mapa inverso: (plano, intervalo) → price_id. Usado pelo checkout.
export function planToPrice(plan: PlanId, interval: BillingInterval): string | null {
  const map: Record<string, string | undefined> = {
    'familia:month': process.env.STRIPE_PRICE_FAMILIA_MENSAL,
    'familia:year': process.env.STRIPE_PRICE_FAMILIA_ANUAL,
    'plus:month': process.env.STRIPE_PRICE_PLUS_MENSAL,
    'plus:year': process.env.STRIPE_PRICE_PLUS_ANUAL,
  }
  return map[`${plan}:${interval}`] ?? null
}

export const TRIAL_DAYS = 14
