// Envia um resumo de teste AGORA para o número salvo do usuário logado.
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient, buildDailySummary, sendWhatsApp } from '@/lib/whatsapp'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: settings } = await supabase
    .from('notification_settings')
    .select('whatsapp_number')
    .eq('user_id', user.id)
    .single()

  if (!settings?.whatsapp_number) {
    return NextResponse.json({ error: 'Salve seu número de WhatsApp primeiro.' }, { status: 400 })
  }

  const admin = adminClient()
  const summary = await buildDailySummary(admin, user.id)
  const body = summary ?? '🌿 *Família em Foco* — teste de conexão OK!\nNenhuma atividade nos próximos 7 dias.'

  const result = await sendWhatsApp(settings.whatsapp_number, body)
  if (!result.ok) {
    return NextResponse.json({ error: `Falha no envio (${result.error}). Verifique a configuração do WhatsApp.` }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}
