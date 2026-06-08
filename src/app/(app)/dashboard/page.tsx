import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const today = new Date().toISOString().split('T')[0]
  const weekEnd = new Date(Date.now() + 7 * 86_400_000).toISOString().split('T')[0]

  const [{ data: children }, { data: todayActivities }, { data: upcomingActivities }] = await Promise.all([
    supabase.from('children').select('*').order('sort_order'),
    supabase.from('activities')
      .select('*, child:children(name, avatar_color)')
      .eq('date', today)
      .neq('status', 'cancelado')
      .order('time', { nullsFirst: false }),
    supabase.from('activities')
      .select('*, child:children(name, avatar_color)')
      .gt('date', today)
      .lte('date', weekEnd)
      .neq('status', 'cancelado')
      .order('date')
      .order('time', { nullsFirst: false })
      .limit(10),
  ])

  const userName = user.user_metadata?.full_name?.split(' ')[0] || 'Olá'

  return (
    <DashboardClient
      userName={userName}
      children={children ?? []}
      todayActivities={todayActivities ?? []}
      upcomingActivities={upcomingActivities ?? []}
    />
  )
}
