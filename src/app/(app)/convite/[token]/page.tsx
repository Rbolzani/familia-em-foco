import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ConviteClient from './ConviteClient'

interface Props {
  params: Promise<{ token: string }>
}

export default async function ConvitePage({ params }: Props) {
  const { token } = await params
  const supabase = await createClient()

  // Must be logged in
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/login?redirect=/convite/${token}`)

  // Load invite info
  const { data: invite } = await supabase
    .from('family_invites')
    .select('id, family_id, status, expires_at, invited_by, family:families(name)')
    .eq('token', token)
    .single()

  // Load inviter name from family_members
  let inviterName = 'Um familiar'
  if (invite?.invited_by) {
    const { data: mem } = await supabase
      .from('family_members')
      .select('display_name')
      .eq('user_id', invite.invited_by)
      .single()
    if (mem?.display_name) inviterName = mem.display_name
  }

  const isValid = invite &&
    invite.status === 'pending' &&
    new Date(invite.expires_at) > new Date()

  // Already a member of this family?
  let alreadyMember = false
  if (invite?.family_id) {
    const { data: existing } = await supabase
      .from('family_members')
      .select('id')
      .eq('family_id', invite.family_id)
      .eq('user_id', user.id)
      .single()
    alreadyMember = !!existing
  }

  return (
    <ConviteClient
      token={token}
      isValid={isValid ?? false}
      alreadyMember={alreadyMember}
      familyName={(invite?.family as { name?: string } | null)?.name ?? 'Família'}
      inviterName={inviterName}
      inviteId={invite?.id ?? null}
      familyId={invite?.family_id ?? null}
      userId={user.id}
    />
  )
}
