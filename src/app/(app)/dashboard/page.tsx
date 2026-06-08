import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const today   = new Date()
  const todayDs = today.toISOString().split('T')[0]
  const weekEnd = new Date(Date.now() + 7 * 86_400_000).toISOString().split('T')[0]
  const moStart = format(startOfMonth(today), 'yyyy-MM-dd')
  const moEnd   = format(endOfMonth(today),   'yyyy-MM-dd')

  const [
    { data: children },
    { data: todayActivities },
    { data: upcomingActivities },
    { data: monthActivities },
    { count: totalPending },
  ] = await Promise.all([
    supabase.from('children').select('*').order('sort_order'),

    supabase.from('activities')
      .select('*, child:children(name, avatar_color)')
      .eq('date', todayDs)
      .neq('status', 'cancelado')
      .order('time', { nullsFirst: false }),

    supabase.from('activities')
      .select('*, child:children(name, avatar_color)')
      .gt('date', todayDs)
      .lte('date', weekEnd)
      .neq('status', 'cancelado')
      .order('date').order('time', { nullsFirst: false })
      .limit(10),

    // Full current month — used for mini-calendar dots
    supabase.from('activities')
      .select('date')
      .gte('date', moStart).lte('date', moEnd)
      .neq('status', 'cancelado'),

    // Total pending across ALL time (matches what modules show)
    supabase.from('activities')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pendente'),
  ])

  const userName = user.user_metadata?.full_name?.split(' ')[0] || 'Olá'
  const monthEventDates = (monthActivities ?? []).map(a => a.date as string)

  return (
    <DashboardClient
      userName={userName}
      children={children ?? []}
      todayActivities={todayActivities ?? []}
      upcomingActivities={upcomingActivities ?? []}
      monthEventDates={monthEventDates}
      totalPending={totalPending ?? 0}
    />
  )
}
