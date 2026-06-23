import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

// Configuração do portal em cache (por processo). Desabilita o cancelamento
// dentro do portal — cancelar/reativar acontece exclusivamente no app, evitando
// botões duplicados que confundiriam o usuário. O portal fica só para
// trocar cartão, ver faturas e atualizar dados de cobrança.
let cachedPortalConfigId: string | null = null

async function ensurePortalConfig(): Promise<string> {
  if (cachedPortalConfigId) return cachedPortalConfigId
  const config = await stripe.billingPortal.configurations.create({
    business_profile: {
      headline: 'Família em Foco — gerencie seu pagamento',
    },
    features: {
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      customer_update: {
        enabled: true,
        allowed_updates: ['email', 'address', 'name', 'tax_id'],
      },
      // Cancelamento e troca de plano ficam no app, não no portal.
      subscription_cancel: { enabled: false },
    },
  })
  cachedPortalConfigId = config.id
  return config.id
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin

  try {
    const { data: sub } = await admin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle()

    const customerId = sub?.stripe_customer_id as string | null | undefined
    if (!customerId) {
      return NextResponse.json({ error: 'Sem assinatura ativa' }, { status: 400 })
    }

    const configuration = await ensurePortalConfig()

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      configuration,
      return_url: `${baseUrl}/configuracoes`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[stripe-portal]', err)
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
