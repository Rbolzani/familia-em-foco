import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getFamilyPlan, PLAN_LIMITS } from '@/lib/billing'

interface ChildInput {
  name: string
  birth_date: string | null
  school_name: string | null
  avatar_color: string
}

export async function POST(request: Request) {
  // Verificar sessão via client normal
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const children: ChildInput[] = body.children
  if (!children?.length) return NextResponse.json({ error: 'No children provided' }, { status: 400 })

  // Admin client bypassa RLS
  const admin = createAdminClient()

  // Buscar ou criar família
  let { data: family } = await admin
    .from('families')
    .select('id')
    .eq('created_by', user.id)
    .maybeSingle()

  if (!family) {
    const familyName = (user.user_metadata?.family_name as string | undefined)?.trim() || 'Minha Família'
    const { data: newFamily, error: famErr } = await admin
      .from('families')
      .insert({ name: familyName, created_by: user.id })
      .select('id')
      .single()
    if (famErr || !newFamily) {
      return NextResponse.json({ error: `Família: ${famErr?.message}` }, { status: 500 })
    }
    await admin.from('family_members').insert({
      family_id: newFamily.id,
      user_id: user.id,
      role: 'owner',
      access_role: 'owner',
    })
    family = newFamily
  }

  // Verificar limite de filhos do plano (existentes + os que serão inseridos).
  // Fecha o furo de paywall: o onboarding antes inseria sem checar PLAN_LIMITS.
  const plan = await getFamilyPlan()
  const childLimit = PLAN_LIMITS[plan].children
  if (childLimit !== Infinity) {
    const { count } = await admin
      .from('children')
      .select('*', { count: 'exact', head: true })
      .eq('family_id', family.id)
    if ((count ?? 0) + children.length > childLimit) {
      return NextResponse.json(
        { error: 'LIMIT_CHILDREN', plan, current: count ?? 0, adding: children.length, limit: childLimit },
        { status: 402 }
      )
    }
  }

  // Inserir filhos
  const inserted: { id: string; index: number }[] = []
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    const { data, error } = await admin
      .from('children')
      .insert({
        user_id: user.id,
        family_id: family.id,
        name: child.name,
        birth_date: child.birth_date || null,
        school_name: child.school_name || null,
        avatar_color: child.avatar_color,
        sort_order: i,
      })
      .select('id')
      .single()
    if (error || !data) {
      return NextResponse.json({ error: `Filho ${child.name}: ${error?.message}` }, { status: 500 })
    }
    inserted.push({ id: data.id, index: i })
  }

  return NextResponse.json({ familyId: family.id, children: inserted })
}
