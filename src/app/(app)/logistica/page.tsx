import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getFamilyMembersForUser } from '@/lib/get-family-members'
import LogisticaClient from './LogisticaClient'

export default async function LogisticaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const todayStr = new Intl.DateTimeFormat('fr-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())

  // Resolve familyId for this user (owner or member)
  const { data: ownedFamily } = await supabase.from('families').select('id').eq('created_by', user.id).maybeSingle()
  let familyId = ownedFamily?.id ?? null
  if (!familyId) {
    const { data: membership } = await supabase.from('family_members').select('family_id').eq('user_id', user.id).maybeSingle()
    familyId = membership?.family_id ?? null
  }

  const [{ data: activities }, { data: children }, familyMembers, { data: pendingSuggestions }] = await Promise.all([
    supabase.from('activities')
      .select('*, child:children(name, avatar_color)')
      .not('date', 'is', null)
      .gte('date', todayStr)
      .neq('status', 'cancelado')
      .order('date').order('time', { nullsFirst: false }),
    supabase.from('children').select('*').order('sort_order'),
    getFamilyMembersForUser(user.id),
    familyId
      ? supabase.from('logistics_suggestions')
          .select('*')
          .eq('family_id', familyId)
          .eq('status', 'pending')
      : Promise.resolve({ data: [] }),
  ])

  return (
    <LogisticaClient
      activities={activities ?? []}
      children={children ?? []}
      familyMembers={familyMembers}
      currentUserId={user.id}
      familyId={familyId}
      pendingSuggestions={pendingSuggestions ?? []}
    />
  )
}
