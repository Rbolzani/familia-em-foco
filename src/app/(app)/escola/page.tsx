import { createClient } from '@/lib/supabase/server'
import ActivitiesPage from '@/components/activities/ActivitiesPage'
import { getFamilyMembersForUser } from '@/lib/get-family-members'

export default async function EscolaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: activities }, { data: children }, familyMembers] = await Promise.all([
    supabase.from('activities')
      .select('*, child:children(name, avatar_color)')
      .eq('category', 'escola')
      .order('date').order('time', { nullsFirst: false }),
    supabase.from('children').select('*').order('sort_order'),
    getFamilyMembersForUser(user!.id),
  ])

  return (
    <ActivitiesPage
      category="escola"
      title="Atividades Escolares"
      emoji="📘"
      color="#2563eb"
      initialActivities={activities ?? []}
      initialChildren={children ?? []}
      familyMembers={familyMembers}
      currentUserId={user!.id}
    />
  )
}
