'use server'
import { createClient } from '@/lib/supabase/server'

export interface FamilyMember {
  id: string
  family_id: string
  user_id: string
  display_name: string | null
  role: 'owner' | 'partner'
  joined_at: string
  email?: string
}

export interface FamilyInvite {
  id: string
  family_id: string
  token: string
  status: 'pending' | 'accepted' | 'expired'
  expires_at: string
  created_at: string
}

export async function getOrCreateFamily(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase.rpc('get_or_create_family', { p_user_id: user.id })
  return data as string | null
}

export async function getFamilyMembers(): Promise<FamilyMember[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const familyId = await getOrCreateFamily()
  if (!familyId) return []

  const { data } = await supabase
    .from('family_members')
    .select('*')
    .eq('family_id', familyId)
    .order('joined_at')

  return (data ?? []) as FamilyMember[]
}

export async function getFamilyId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Owner
  const { data: owned } = await supabase
    .from('families')
    .select('id')
    .eq('created_by', user.id)
    .single()
  if (owned) return owned.id

  // Member
  const { data: member } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', user.id)
    .single()
  return member?.family_id ?? null
}

export async function createInvite(): Promise<{ token: string; url: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const familyId = await getOrCreateFamily()
  if (!familyId) return null

  // Expire any existing pending invites
  await supabase
    .from('family_invites')
    .update({ status: 'expired' })
    .eq('family_id', familyId)
    .eq('status', 'pending')

  const { data } = await supabase
    .from('family_invites')
    .insert({ family_id: familyId, invited_by: user.id })
    .select('token')
    .single()

  if (!data) return null

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return { token: data.token, url: `${baseUrl}/convite/${data.token}` }
}

export async function getInviteByToken(token: string): Promise<{
  invite: FamilyInvite
  familyName: string
  inviterName: string
} | null> {
  const supabase = await createClient()

  const { data: invite } = await supabase
    .from('family_invites')
    .select('*, family:families(name, created_by)')
    .eq('token', token)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!invite) return null

  // Get inviter display name from family_members
  const { data: member } = await supabase
    .from('family_members')
    .select('display_name')
    .eq('user_id', (invite.family as { created_by: string }).created_by)
    .single()

  return {
    invite: invite as unknown as FamilyInvite,
    familyName: (invite.family as { name: string }).name,
    inviterName: member?.display_name ?? 'Um familiar',
  }
}

export async function acceptInvite(token: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data: invite } = await supabase
    .from('family_invites')
    .select('id, family_id')
    .eq('token', token)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!invite) return false

  // Add user to family_members
  const { error: memberError } = await supabase
    .from('family_members')
    .upsert({ family_id: invite.family_id, user_id: user.id, role: 'partner' }, { onConflict: 'family_id,user_id' })

  if (memberError) return false

  // Mark invite as accepted
  await supabase
    .from('family_invites')
    .update({ status: 'accepted' })
    .eq('id', invite.id)

  return true
}

export async function revokePartner(memberUserId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const familyId = await getFamilyId()
  if (!familyId) return false

  const { error } = await supabase
    .from('family_members')
    .delete()
    .eq('family_id', familyId)
    .eq('user_id', memberUserId)
    .neq('role', 'owner')

  return !error
}
