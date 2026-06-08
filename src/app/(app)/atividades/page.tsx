import { createClient } from '@/lib/supabase/server'
import ActivitiesPage from '@/components/activities/ActivitiesPage'

export default async function AtividadesPage() {
  const supabase = await createClient()
  const [{ data: activities }, { data: children }] = await Promise.all([
    supabase.from('activities')
      .select('*, child:children(name, avatar_color)')
      .eq('category', 'extracurricular')
      .order('date').order('time', { nullsFirst: false }),
    supabase.from('children').select('*').order('sort_order'),
  ])
  return (
    <ActivitiesPage
      category="extracurricular"
      title="Atividades Extracurriculares"
      emoji="⭐"
      color="#7c3aed"
      initialActivities={activities ?? []}
      initialChildren={children ?? []}
    />
  )
}
