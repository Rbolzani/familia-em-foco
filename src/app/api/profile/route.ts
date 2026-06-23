import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isValidCPF, isValidPhoneBR, onlyDigits } from '@/lib/cpf'

// Salva o cadastro inicial de dados pessoais (LGPD / cobrança) e marca
// profile_completed_at. Validação no servidor — o cliente é só conveniência.
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: {
    full_name?: string; phone?: string; cpf?: string; birth_date?: string
    marketing_consent?: boolean; acquisition_source?: string
    attribution?: Record<string, unknown>
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }

  const full_name = (body.full_name ?? '').trim()
  const phone     = onlyDigits(body.phone ?? '')
  const birthDate = (body.birth_date ?? '').trim() || null

  if (full_name.length < 3)        return NextResponse.json({ error: 'Informe seu nome completo.' }, { status: 400 })
  if (!isValidPhoneBR(phone))      return NextResponse.json({ error: 'Celular inválido. Use DDD + número.' }, { status: 400 })
  if (!birthDate)                  return NextResponse.json({ error: 'Informe sua data de nascimento.' }, { status: 400 })

  // Não permite data de nascimento no futuro.
  if (new Date(birthDate) > new Date()) {
    return NextResponse.json({ error: 'Data de nascimento inválida.' }, { status: 400 })
  }

  // CPF é imutável após o primeiro cadastro (identidade fiscal). Server-side:
  // se já houver CPF salvo, ignora o do cliente; senão, valida e grava o novo.
  const { data: existing } = await supabase
    .from('profiles')
    .select('cpf, profile_completed_at, marketing_consent, marketing_consent_at, acquisition_source, signup_attribution')
    .eq('user_id', user.id)
    .maybeSingle()

  let cpf = existing?.cpf as string | null | undefined
  if (!cpf) {
    cpf = onlyDigits(body.cpf ?? '')
    if (!isValidCPF(cpf)) return NextResponse.json({ error: 'CPF inválido.' }, { status: 400 })
  }

  // Consentimento de marketing (LGPD): editável a qualquer momento. Registra o
  // timestamp na transição para "concedido"; mantém o original se já concedido.
  const consent = body.marketing_consent === true
  const now = new Date().toISOString()
  const consentAt = consent
    ? (existing?.marketing_consent ? existing.marketing_consent_at : now)
    : null

  // "Como conheceu" e atribuição (UTM/referrer) são set-once: não sobrescreve.
  const acquisitionSource = existing?.acquisition_source ?? (body.acquisition_source?.trim() || null)
  const attribution = existing?.signup_attribution ?? (body.attribution ?? null)

  // RLS (profiles_upsert_own) garante que o usuário só grava o próprio perfil.
  const { error } = await supabase.from('profiles').upsert({
    user_id: user.id,
    full_name,
    phone,
    cpf,
    birth_date: birthDate,
    marketing_consent: consent,
    marketing_consent_at: consentAt,
    acquisition_source: acquisitionSource,
    signup_attribution: attribution,
    // Carimba a conclusão só na primeira vez; edições preservam o original.
    profile_completed_at: existing?.profile_completed_at ?? now,
    updated_at: now,
  }, { onConflict: 'user_id' })

  if (error) {
    // Índice único de CPF
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Este CPF já está cadastrado em outra conta.' }, { status: 409 })
    }
    console.error('[profile] erro ao salvar', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
