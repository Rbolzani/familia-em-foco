import { createClient } from '@/lib/supabase/server'

export interface FamilyMemberInfo {
  user_id: string
  display_name: string | null
  role: string
}

export async function getFamilyMembersForUser(userId: string): Promise<FamilyMemberInfo[]> {
  const supabase = await createClient()

  // Find family: user is owner
  const { data: ownedFamily } = await supabase
    .from('families').select('id').eq('created_by', userId).single()

  let familyId = ownedFamily?.id ?? null

  // Or user is a member
  if (!familyId) {
    const { data: membership } = await supabase
      .from('family_members').select('family_id').eq('user_id', userId).single()
    familyId = membership?.family_id ?? null
  }

  if (!familyId) return []

  const { data: members } = await supabase
    .from('family_members')
    .select('user_id, display_name, role')
    .eq('family_id', familyId)

  return (members ?? []) as FamilyMemberInfo[]
}
