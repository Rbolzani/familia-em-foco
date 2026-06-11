import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ConfiguracoesClient from './ConfiguracoesClient'

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Ensure family exists and get members
  const { data: familyData } = await supabase
    .from('families')
    .select('id, name, created_by')
    .eq('created_by', user.id)
    .single()

  // If no family yet, also check if user is a member somewhere
  let familyId = familyData?.id ?? null
  let isOwner = !!familyData

  if (!familyId) {
    const { data: memberData } = await supabase
      .from('family_members')
      .select('family_id')
      .eq('user_id', user.id)
      .single()
    familyId = memberData?.family_id ?? null
    isOwner = false
  }

  let members: { id: string; user_id: string; display_name: string | null; role: string; joined_at: string }[] = []
  let pendingInvite: { token: string; expires_at: string } | null = null

  if (familyId) {
    const { data: mems } = await supabase
      .from('family_members')
      .select('id, user_id, display_name, role, joined_at')
      .eq('family_id', familyId)
      .order('joined_at')
    members = mems ?? []

    if (isOwner) {
      const { data: inv } = await supabase
        .from('family_invites')
        .select('token, expires_at')
        .eq('family_id', familyId)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      pendingInvite = inv ?? null
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  return (
    <ConfiguracoesClient
      userId={user.id}
      userEmail={user.email ?? ''}
      familyId={familyId}
      isOwner={isOwner}
      members={members}
      pendingInvite={pendingInvite ? {
        token: pendingInvite.token,
        url: `${baseUrl}/convite/${pendingInvite.token}`,
        expires_at: pendingInvite.expires_at,
      } : null}
    />
  )
}
