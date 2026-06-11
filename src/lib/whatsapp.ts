// Server-only: envio de mensagens via Meta WhatsApp Cloud API
// e montagem do resumo matinal da família.
import { createClient as createAdminClient, SupabaseClient } from '@supabase/supabase-js'

const GRAPH_URL = 'https://graph.facebook.com/v21.0'

// ── Cliente admin (service role — ignora RLS; nunca importar em client components) ──
export function adminClient(): SupabaseClient {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// ── Envio ────────────────────────────────────────────────────────────────────
// Se WHATSAPP_TEMPLATE_NAME estiver configurado, envia via template aprovado
// (obrigatório para mensagens iniciadas pelo negócio fora da janela de 24h).
// Caso contrário envia texto simples (funciona em testes / janela aberta).
export async function sendWhatsApp(to: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.WHATSAPP_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_ID
  if (!token || !phoneId) return { ok: false, error: 'WHATSAPP_TOKEN/WHATSAPP_PHONE_ID não configurados' }

  const templateName = process.env.WHATSAPP_TEMPLATE_NAME

  const payload = templateName
    ? {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'pt_BR' },
          components: [{ type: 'body', parameters: [{ type: 'text', text: body }] }],
        },
      }
    : { messaging_product: 'whatsapp', to, type: 'text', text: { body } }

  const res = await fetch(`${GRAPH_URL}/${phoneId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('WhatsApp send error:', err)
    return { ok: false, error: `HTTP ${res.status}` }
  }
  return { ok: true }
}

// ── Datas no fuso de São Paulo ───────────────────────────────────────────────
function spDate(offsetDays = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return new Intl.DateTimeFormat('fr-CA', { timeZone: 'America/Sao_Paulo' }).format(d)
}

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
function fmtShort(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return `${WEEKDAYS[d.getDay()]} ${dateStr.slice(8, 10)}/${dateStr.slice(5, 7)}`
}

const CAT_EMOJI: Record<string, string> = { escola: '📘', saude: '🩺', extracurricular: '⭐' }

interface SummaryActivity {
  title: string
  category: string
  date: string
  time: string | null
  takes_user_id: string | null
  picks_user_id: string | null
  child: { name: string } | null
}

// ── Monta o resumo do dia + próximos 7 dias para um usuário ─────────────────
// Retorna null se o usuário não tiver nenhuma atividade no período.
export async function buildDailySummary(admin: SupabaseClient, userId: string): Promise<string | null> {
  // Usuários da família (o próprio + parceiros)
  const { data: myMemberships } = await admin
    .from('family_members')
    .select('family_id')
    .eq('user_id', userId)

  let userIds = [userId]
  const familyIds = (myMemberships ?? []).map(m => m.family_id)
  if (familyIds.length > 0) {
    const { data: allMembers } = await admin
      .from('family_members')
      .select('user_id, display_name')
      .in('family_id', familyIds)
    if (allMembers) userIds = [...new Set([userId, ...allMembers.map(m => m.user_id)])]
  }

  // Nomes para leva/busca (relativo ao destinatário)
  const names = new Map<string, string>()
  if (familyIds.length > 0) {
    const { data: mems } = await admin
      .from('family_members')
      .select('user_id, display_name')
      .in('family_id', familyIds)
    for (const m of mems ?? []) names.set(m.user_id, m.display_name ?? 'Parceiro(a)')
  }
  const who = (id: string | null) => (id ? (id === userId ? 'Você' : names.get(id) ?? 'Parceiro(a)') : null)

  const today = spDate(0)
  const weekEnd = spDate(7)

  const { data: acts } = await admin
    .from('activities')
    .select('title, category, date, time, takes_user_id, picks_user_id, child:children(name)')
    .in('user_id', userIds)
    .gte('date', today)
    .lte('date', weekEnd)
    .neq('status', 'cancelado')
    .order('date')
    .order('time', { nullsFirst: false })

  const activities = (acts ?? []) as unknown as SummaryActivity[]
  if (activities.length === 0) return null

  const todayActs = activities.filter(a => a.date === today)
  const nextActs = activities.filter(a => a.date > today)

  const lines: string[] = []
  lines.push(`🌿 *Bom dia! Resumo da família* — ${fmtShort(today)}`)
  lines.push('')

  if (todayActs.length > 0) {
    lines.push('*Hoje*')
    for (const a of todayActs) {
      const emoji = CAT_EMOJI[a.category] ?? '•'
      const time = a.time ? ` (${a.time.slice(0, 5)})` : ''
      const childName = a.child?.name ? `${a.child.name} — ` : ''
      lines.push(`${emoji} ${childName}${a.title}${time}`)
      const leva = who(a.takes_user_id)
      const busca = who(a.picks_user_id)
      if (leva || busca) {
        const parts = []
        if (leva) parts.push(`🚗 leva: ${leva}`)
        if (busca) parts.push(`🏠 busca: ${busca}`)
        lines.push(`   ${parts.join(' · ')}`)
      }
    }
  } else {
    lines.push('*Hoje* — nenhuma atividade. Aproveite! 💚')
  }

  if (nextActs.length > 0) {
    lines.push('')
    lines.push('*Próximos 7 dias*')
    for (const a of nextActs.slice(0, 8)) {
      const childName = a.child?.name ? ` (${a.child.name})` : ''
      lines.push(`• ${fmtShort(a.date)} — ${a.title}${childName}`)
    }
    if (nextActs.length > 8) lines.push(`… e mais ${nextActs.length - 8} atividades no app`)
  }

  lines.push('')
  lines.push('💚 _Família em Foco_')

  return lines.join('\n')
}
