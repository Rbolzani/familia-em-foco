// Cron diário (Vercel Cron, 07:00 BRT): envia o resumo matinal
// para todos os usuários com o recurso habilitado.
import { NextRequest, NextResponse } from 'next/server'
import { adminClient, buildDailySummary, sendWhatsApp } from '@/lib/whatsapp'

export const maxDuration = 60

export async function GET(req: NextRequest) {
  const now = new Date().toISOString()
  console.log(`[whatsapp-daily] iniciando às ${now}`)

  // Vercel Cron envia Authorization: Bearer ${CRON_SECRET} automaticamente
  const auth = req.headers.get('authorization')
  if (!process.env.CRON_SECRET) {
    console.error('[whatsapp-daily] CRON_SECRET não configurado')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error('[whatsapp-daily] Authorization header inválido')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[whatsapp-daily] SUPABASE_SERVICE_ROLE_KEY não configurado')
    return NextResponse.json({ error: 'Misconfigured' }, { status: 500 })
  }

  const admin = adminClient()

  const { data: settings, error: settingsError } = await admin
    .from('notification_settings')
    .select('user_id, whatsapp_number')
    .eq('daily_summary_enabled', true)
    .not('whatsapp_number', 'is', null)

  if (settingsError) {
    console.error('[whatsapp-daily] erro ao buscar notification_settings:', settingsError)
    return NextResponse.json({ error: 'DB error', detail: settingsError.message }, { status: 500 })
  }

  const total = settings?.length ?? 0
  console.log(`[whatsapp-daily] ${total} usuário(s) com resumo habilitado`)

  let sent = 0
  let skipped = 0
  let failed = 0

  for (const s of settings ?? []) {
    try {
      const summary = await buildDailySummary(admin, s.user_id)
      if (!summary) {
        console.log(`[whatsapp-daily] user ${s.user_id}: sem atividades no período, pulando`)
        skipped++
        continue
      }
      const result = await sendWhatsApp(s.whatsapp_number!, summary)
      if (result.ok) {
        console.log(`[whatsapp-daily] user ${s.user_id}: enviado com sucesso`)
        sent++
      } else {
        console.error(`[whatsapp-daily] user ${s.user_id}: falha no envio —`, result.error)
        failed++
      }
    } catch (e) {
      console.error(`[whatsapp-daily] user ${s.user_id}: exceção —`, e)
      failed++
    }
  }

  const result = { sent, skipped, failed, total }
  console.log('[whatsapp-daily] concluído:', result)
  return NextResponse.json(result)
}
