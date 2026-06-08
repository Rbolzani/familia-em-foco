import { createClient } from '@/lib/supabase/server'
import ActivitiesPage from '@/components/activities/ActivitiesPage'

export default async function SaudePage() {
  const supabase = await createClient()
  const [{ data: activities }, { data: children }] = await Promise.all([
    supabase.from('activities')
      .select('*, child:children(name, avatar_color)')
      .eq('category', 'saude')
      .order('date').order('time', { nullsFirst: false }),
    supabase.from('children').select('*').order('sort_order'),
  ])
  return (
    <ActivitiesPage
      category="saude"
      title="Saúde & Médico"
      emoji="🩺"
      color="#059669"
      initialActivities={activities ?? []}
      initialChildren={children ?? []}
    />
  )
}
