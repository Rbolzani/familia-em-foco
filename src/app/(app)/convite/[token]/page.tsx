import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ConviteClient from './ConviteClient'

interface Props {
  params: Promise<{ token: string }>
}

interface InviteDetails {
  invite_id: string
  family_id: string
  family_name: string
  inviter_name: string
  access_role: 'read_only' | 'logistics_editor' | 'full_editor'
  status: 'pending' | 'accepted' | 'expired'
  expires_at: string
  children_names: string[]
}

export default async function ConvitePage({ params }: Props) {
  const { token } = await params
  const supabase = await createClient()

  // Must be logged in
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/login?redirect=/convite/${token}`)

  // Invite preview via SECURITY DEFINER function (invitee is not a member yet)
  const { data: rows } = await supabase.rpc('get_invite_details', { p_token: token })
  const invite = (rows?.[0] ?? null) as InviteDetails | null

  const isValid = !!invite &&
    invite.status === 'pending' &&
    new Date(invite.expires_at) > new Date()

  // Already a member of this family? (invitee can read their own membership)
  let alreadyMember = false
  if (invite?.family_id) {
    const { data: existing } = await supabase
      .from('family_members')
      .select('id')
      .eq('family_id', invite.family_id)
      .eq('user_id', user.id)
      .maybeSingle()
    alreadyMember = !!existing
  }

  return (
    <ConviteClient
      token={token}
      isValid={isValid}
      alreadyMember={alreadyMember}
      familyId={invite?.family_id ?? null}
      familyName={invite?.family_name ?? 'Família'}
      inviterName={invite?.inviter_name ?? 'Um familiar'}
      accessRole={invite?.access_role ?? 'logistics_editor'}
      childrenNames={invite?.children_names ?? []}
    />
  )
}
