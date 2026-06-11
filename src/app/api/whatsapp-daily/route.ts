// Cron diário (Vercel Cron, 07:00 BRT): envia o resumo matinal
// para todos os usuários com o recurso habilitado.
import { NextRequest, NextResponse } from 'next/server'
import { adminClient, buildDailySummary, sendWhatsApp } from '@/lib/whatsapp'

export const maxDuration = 60

export async function GET(req: NextRequest) {
  // Vercel Cron envia Authorization: Bearer ${CRON_SECRET} automaticamente
  const auth = req.headers.get('authorization')
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = adminClient()

  const { data: settings } = await admin
    .from('notification_settings')
    .select('user_id, whatsapp_number')
    .eq('daily_summary_enabled', true)
    .not('whatsapp_number', 'is', null)

  let sent = 0
  let skipped = 0
  let failed = 0

  for (const s of settings ?? []) {
    try {
      const summary = await buildDailySummary(admin, s.user_id)
      if (!summary) { skipped++; continue }
      const result = await sendWhatsApp(s.whatsapp_number!, summary)
      if (result.ok) sent++
      else failed++
    } catch (e) {
      console.error(`Resumo falhou para user ${s.user_id}:`, e)
      failed++
    }
  }

  return NextResponse.json({ sent, skipped, failed, total: settings?.length ?? 0 })
}
