import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ConfiguracoesClient from './ConfiguracoesClient'

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Família ATIVA do usuário (respeitando o seletor de família, não apenas "qual família ele criou")
  const { data: activeFamilyId } = await supabase.rpc('auth_family_id')

  let familyId: string | null = activeFamilyId ?? null
  let isOwner = false
  let ownerId: string | null = null

  if (familyId) {
    const { data: famRow } = await supabase
      .from('families')
      .select('created_by')
      .eq('id', familyId)
      .maybeSingle()
    ownerId = famRow?.created_by ?? null
    isOwner = ownerId === user.id
  } else {
    // Usuário sem nenhuma família ainda — pode criar uma (bootstrap no convite)
    isOwner = true
  }

  let members: { id: string; user_id: string; display_name: string | null; role: string; access_role: string | null; joined_at: string }[] = []
  let pendingInvites: { id: string; token: string; invited_email: string | null; access_role: string; expires_at: string }[] = []
  let ownerDisplayName: string | null = null
  let ownerEmail: string | null = null

  if (familyId) {
    const { data: mems } = await supabase
      .from('family_members')
      .select('id, user_id, display_name, role, access_role, joined_at')
      .eq('family_id', familyId)
      .order('joined_at')
    const rawMembers = mems ?? []

    // Enrich members whose display_name is null with their auth email
    // (includes the owner, who may not even have a row in family_members)
    const missingIds = Array.from(new Set([
      ...rawMembers.filter(m => !m.display_name).map(m => m.user_id),
      ...(ownerId ? [ownerId] : []),
    ]))

    let emailMap: Record<string, string> = {}
    if (missingIds.length > 0) {
      const admin = createAdminClient()
      const { data: usersRes } = await admin.auth.admin.listUsers({ perPage: 1000 })
      if (usersRes?.users) {
        usersRes.users.forEach(u => { emailMap[u.id] = u.email ?? '' })
      }
    }

    members = rawMembers.map(m => ({
      ...m,
      display_name: m.display_name ?? emailMap[m.user_id] ?? null,
    }))

    if (ownerId) {
      const ownerMember = rawMembers.find(m => m.user_id === ownerId)
      ownerDisplayName = ownerMember?.display_name ?? emailMap[ownerId] ?? null
      ownerEmail = ownerId === user.id ? (user.email ?? null) : (emailMap[ownerId] ?? null)
    }

    if (isOwner) {
      const { data: invs } = await supabase
        .from('family_invites')
        .select('id, token, invited_email, access_role, expires_at')
        .eq('family_id', familyId)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
      pendingInvites = invs ?? []
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  return (
    <ConfiguracoesClient
      userId={user.id}
      userEmail={user.email ?? ''}
      familyId={familyId}
      isOwner={isOwner}
      ownerId={ownerId}
      ownerDisplayName={ownerDisplayName}
      ownerEmail={ownerEmail}
      baseUrl={baseUrl}
      members={members}
      pendingInvites={pendingInvites}
    />
  )
}
