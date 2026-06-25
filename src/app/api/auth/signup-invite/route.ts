import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Cria o usuário já com email confirmado — usado apenas no fluxo de convite.
// Também cria a família própria do usuário via admin, porque o bootstrap do
// layout (que normalmente cria a família) só roda quando auth_family_id é null.
// Após aceitar o convite, auth_family_id já aponta para a família do convidante,
// então o bootstrap nunca criaria a família própria sem este passo.
export async function POST(request: Request) {
  const { email, password, name, familyName } = await request.json()

  if (!email || !password || !name) {
    return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const resolvedFamilyName = familyName?.trim() || 'Minha Família'

  // 1. Cria o usuário com email já confirmado
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: name,
      family_name: resolvedFamilyName,
    },
  })

  if (error) {
    const msg = error.message.includes('already registered')
      ? 'Este e-mail já está cadastrado.'
      : error.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const userId = data.user.id

  // 2. Cria a família própria do usuário imediatamente (via admin, bypassando RLS).
  // Isso garante que, mesmo após aceitar o convite e ter a família do dono como
  // "ativa", o usuário ainda possui a sua própria família como owner.
  const { data: fam } = await admin
    .from('families')
    .insert({ name: resolvedFamilyName, created_by: userId })
    .select('id')
    .single()

  if (fam?.id) {
    await admin.from('family_members').insert({
      family_id: fam.id,
      user_id: userId,
      role: 'owner',
    })
  }

  return NextResponse.json({ userId })
}
