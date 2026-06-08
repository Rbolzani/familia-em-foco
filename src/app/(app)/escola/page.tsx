import { createClient } from '@/lib/supabase/server'
import ActivitiesPage from '@/components/activities/ActivitiesPage'

export default async function EscolaPage() {
  const supabase = await createClient()
  const [{ data: activities }, { data: children }] = await Promise.all([
    supabase.from('activities')
      .select('*, child:children(name, avatar_color)')
      .eq('category', 'escola')
      .order('date').order('time', { nullsFirst: false }),
    supabase.from('children').select('*').order('sort_order'),
  ])
  return (
    <ActivitiesPage
      category="escola"
      title="Atividades Escolares"
      emoji="📘"
      color="#2563eb"
      initialActivities={activities ?? []}
      initialChildren={children ?? []}
    />
  )
}
