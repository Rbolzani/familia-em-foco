import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Cria o usuário já com email confirmado — usado apenas no fluxo de convite.
// Chamado pelo signup/page.tsx quando há ?redirect=/convite/... na URL.
export async function POST(request: Request) {
  const { email, password, name, familyName } = await request.json()

  if (!email || !password || !name) {
    return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: name,
      family_name: familyName?.trim() || 'Minha Família',
    },
  })

  if (error) {
    const msg = error.message.includes('already registered')
      ? 'Este e-mail já está cadastrado.'
      : error.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  return NextResponse.json({ userId: data.user.id })
}
