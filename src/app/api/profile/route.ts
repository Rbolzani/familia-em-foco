import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isValidCPF, isValidPhoneBR, onlyDigits } from '@/lib/cpf'

// Salva o cadastro inicial de dados pessoais (LGPD / cobrança) e marca
// profile_completed_at. Validação no servidor — o cliente é só conveniência.
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { full_name?: string; phone?: string; cpf?: string; birth_date?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }

  const full_name = (body.full_name ?? '').trim()
  const phone     = onlyDigits(body.phone ?? '')
  const cpf       = onlyDigits(body.cpf ?? '')
  const birthDate = (body.birth_date ?? '').trim() || null

  if (full_name.length < 3)        return NextResponse.json({ error: 'Informe seu nome completo.' }, { status: 400 })
  if (!isValidPhoneBR(phone))      return NextResponse.json({ error: 'Celular inválido. Use DDD + número.' }, { status: 400 })
  if (!isValidCPF(cpf))            return NextResponse.json({ error: 'CPF inválido.' }, { status: 400 })
  if (!birthDate)                  return NextResponse.json({ error: 'Informe sua data de nascimento.' }, { status: 400 })

  // Não permite data de nascimento no futuro.
  if (new Date(birthDate) > new Date()) {
    return NextResponse.json({ error: 'Data de nascimento inválida.' }, { status: 400 })
  }

  // RLS (profiles_upsert_own) garante que o usuário só grava o próprio perfil.
  const { error } = await supabase.from('profiles').upsert({
    user_id: user.id,
    full_name,
    phone,
    cpf,
    birth_date: birthDate,
    profile_completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
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
