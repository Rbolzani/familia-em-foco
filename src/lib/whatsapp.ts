// Server-only: envio de mensagens via Meta WhatsApp Cloud API
// e montagem do resumo matinal da família.
import { createClient as createAdminClient, SupabaseClient } from '@supabase/supabase-js'

const GRAPH_URL = 'https://graph.facebook.com/v25.0'

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
export async function sendWhatsApp(to: string, body: string): Promise<{ ok: boolean; error?: string; metaResponse?: string }> {
  // ── Twilio sandbox (teste) ─────────────────────────────────────────────────
  // Se TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN estiverem configurados, usa Twilio.
  // Ideal para validar entrega real antes de ter número de produção na Meta.
  const twilioSid   = process.env.TWILIO_ACCOUNT_SID
  const twilioToken = process.env.TWILIO_AUTH_TOKEN
  if (twilioSid && twilioToken) {
    const params = new URLSearchParams({
      From: 'whatsapp:+14155238886',   // número sandbox fixo da Twilio
      To:   `whatsapp:+${to}`,
      Body: body,
    })
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      }
    )
    const resText = await res.text()
    if (!res.ok) return { ok: false, error: `Twilio HTTP ${res.status}: ${resText}` }
    return { ok: true, metaResponse: resText }
  }

  // ── Meta WhatsApp Cloud API (produção) ────────────────────────────────────
  const token   = process.env.WHATSAPP_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_ID
  if (!token || !phoneId) return { ok: false, error: 'WHATSAPP_TOKEN/WHATSAPP_PHONE_ID não configurados' }

  const templateName = process.env.WHATSAPP_TEMPLATE_NAME
  let payload: Record<string, unknown>
  if (templateName === 'hello_world') {
    payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: { name: 'hello_world', language: { code: 'en_US' } },
    }
  } else if (templateName) {
    payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'pt_BR' },
        components: [{ type: 'body', parameters: [{ type: 'text', text: body }] }],
      },
    }
  } else {
    payload = { messaging_product: 'whatsapp', to, type: 'text', text: { body } }
  }

  const res = await fetch(`${GRAPH_URL}/${phoneId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const resText = await res.text()
  if (!res.ok) return { ok: false, error: `Meta HTTP ${res.status}: ${resText}` }
  return { ok: true, metaResponse: resText }
}

// ── Datas no fuso de São Paulo ───────────────────────────────────────────────
// Usa aritmética em milissegundos para evitar bugs de "dia errado" ao cruzar
// a meia-noite UTC com o fuso America/Sao_Paulo (UTC-3).
function spDate(offsetDays = 0): string {
  const d = new Date(Date.now() + offsetDays * 86_400_000)
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

  const actsQuery = admin
    .from('activities')
    .select('title, category, date, time, takes_user_id, picks_user_id, child:children(name)')
    .gte('date', today)
    .lte('date', weekEnd)
    .neq('status', 'cancelado')
    .order('date')
    .order('time', { nullsFirst: false })

  const { data: acts } = familyIds.length > 0
    ? await actsQuery.in('family_id', familyIds)
    : await actsQuery.eq('user_id', userId)

  const seen = new Set<string>()
  const activities = ((acts ?? []) as unknown as SummaryActivity[]).filter(a => {
    const key = `${a.date}|${a.title}|${a.child?.name ?? ''}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  const todayActs = activities.filter(a => a.date === today)
  const nextActs = activities.filter(a => a.date > today)

  // ── Aviso de grace period (independente de haver atividades) ────────────
  // Verifica se o owner da família está com parceiro em período de graça.
  // Calculado ANTES de decidir não enviar, para que o aviso saia mesmo quando
  // a família não tem atividades no período.
  // familyIsPaid: a agenda diária é recurso pago. O aviso de grace abaixo é
  // notificação de conta e sai mesmo no free.
  let familyIsPaid = false
  const graceLines: string[] = []
  if (familyIds.length > 0) {
    const { data: families } = await admin
      .from('families')
      .select('id, created_by')
      .in('id', familyIds)

    for (const fam of families ?? []) {
      const { data: ownerSub } = await admin
        .from('subscriptions')
        .select('partner_grace_until, plan, status')
        .eq('user_id', fam.created_by)
        .maybeSingle()

      // Plano efetivo da família = plano do owner (ativo ou em trial).
      if (ownerSub && ownerSub.plan !== 'free' &&
          (ownerSub.status === 'active' || ownerSub.status === 'trialing')) {
        familyIsPaid = true
      }

      if (ownerSub?.partner_grace_until && ownerSub.plan === 'free') {
        const graceEnd  = new Date(ownerSub.partner_grace_until)
        const isExpired = graceEnd <= new Date()
        if (!isExpired) {
          const msLeft   = graceEnd.getTime() - Date.now()
          const daysLeft = Math.max(0, Math.ceil(msLeft / 86_400_000))
          const dayStr   = daysLeft <= 1 ? 'hoje' : `em ${daysLeft} dia${daysLeft > 1 ? 's' : ''}`

          if (fam.created_by === userId) {
            // Mensagem para o owner
            const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://familia-em-foco.vercel.app'
            graceLines.push(`⚠️ *Atenção:* seu parceiro(a) será desconectado ${dayStr}. Assine um plano para manter o acesso compartilhado: ${appUrl}/planos`)
          } else {
            // Mensagem para o parceiro
            graceLines.push(`⚠️ *Atenção:* sua conexão com a família será encerrada ${dayStr}. Peça ao responsável que assine o plano Família.`)
          }
        }
      }
    }
  } else {
    // Usuário sem família (solo) — plano vem da própria assinatura.
    const { data: ownSub } = await admin
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', userId)
      .maybeSingle()
    if (ownSub && ownSub.plan !== 'free' &&
        (ownSub.status === 'active' || ownSub.status === 'trialing')) {
      familyIsPaid = true
    }
  }

  // ── Família no plano gratuito ───────────────────────────────────────────
  // A agenda diária é recurso pago: não é enviada no free. O aviso de grace,
  // por ser notificação de conta, ainda sai (é o que traz o cliente de volta).
  if (!familyIsPaid) {
    if (graceLines.length === 0) return null
    const lines: string[] = []
    lines.push(`🌿 *Família em Foco* — ${fmtShort(today)}`)
    lines.push('')
    lines.push(...graceLines)
    lines.push('')
    lines.push('💚 _Família em Foco_')
    return lines.join('\n')
  }

  // Nada a enviar: plano pago, sem atividades E sem aviso de grace.
  if (activities.length === 0 && graceLines.length === 0) return null

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

  if (graceLines.length > 0) {
    lines.push('')
    lines.push(...graceLines)
  }

  lines.push('')
  lines.push('💚 _Família em Foco_')

  return lines.join('\n')
}
