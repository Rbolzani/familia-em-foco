import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ConfiguracoesClient from './ConfiguracoesClient'

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Family owned by this user
  const { data: familyData } = await supabase
    .from('families')
    .select('id, name, created_by')
    .eq('created_by', user.id)
    .maybeSingle()

  let familyId = familyData?.id ?? null
  let isOwner = !!familyData

  // If not an owner, maybe a partner in someone else's family
  if (!familyId) {
    const { data: memberData } = await supabase
      .from('family_members')
      .select('family_id')
      .eq('user_id', user.id)
      .order('joined_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    familyId = memberData?.family_id ?? null
    isOwner = false
  }

  if (!familyId && !isOwner) isOwner = true

  let members: { id: string; user_id: string; display_name: string | null; role: string; access_role: string | null; joined_at: string }[] = []
  let pendingInvites: { id: string; token: string; invited_email: string | null; access_role: string; expires_at: string }[] = []

  if (familyId) {
    const { data: mems } = await supabase
      .from('family_members')
      .select('id, user_id, display_name, role, access_role, joined_at')
      .eq('family_id', familyId)
      .order('joined_at')
    const rawMembers = mems ?? []

    // Enrich partners whose display_name is null with their auth email
    const missingIds = rawMembers
      .filter(m => !m.display_name)
      .map(m => m.user_id)

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
      baseUrl={baseUrl}
      members={members}
      pendingInvites={pendingInvites}
    />
  )
}
