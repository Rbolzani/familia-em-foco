import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const today   = new Date()
  // Use Brazil timezone (America/Sao_Paulo) — server runs in UTC, so toISOString() would
  // give tomorrow's date for Brazilian users between 21h–24h local time.
  // 'fr-CA' locale returns yyyy-MM-dd which is what Supabase expects.
  const tz      = 'America/Sao_Paulo'
  const todayDs = new Intl.DateTimeFormat('fr-CA', { timeZone: tz }).format(today)
  const weekEnd = new Intl.DateTimeFormat('fr-CA', { timeZone: tz }).format(
    new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7)
  )
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
      .order('date').order('time', { nullsFirst: false }),

    // Full current month — used for mini-calendar dots + click detail
    supabase.from('activities')
      .select('*, child:children(name, avatar_color)')
      .gte('date', moStart).lte('date', moEnd)
      .neq('status', 'cancelado')
      .order('date').order('time', { nullsFirst: false }),

    // Total pending across ALL time (matches what modules show)
    supabase.from('activities')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pendente'),
  ])

  const userName = user.user_metadata?.full_name?.split(' ')[0] || 'Olá'

  return (
    <DashboardClient
      userName={userName}
      children={children ?? []}
      todayActivities={todayActivities ?? []}
      upcomingActivities={upcomingActivities ?? []}
      monthActivities={(monthActivities ?? []) as Parameters<typeof DashboardClient>[0]['monthActivities']}
      totalPending={totalPending ?? 0}
    />
  )
}
