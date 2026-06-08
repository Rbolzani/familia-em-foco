import { createClient } from '@/lib/supabase/server'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import CalendarioClient from './CalendarioClient'

export default async function CalendarioPage() {
  const supabase  = await createClient()
  const today     = new Date()
  const start     = format(startOfMonth(today), 'yyyy-MM-dd')
  const end       = format(endOfMonth(today),   'yyyy-MM-dd')

  const [{ data: activities }, { data: children }] = await Promise.all([
    supabase.from('activities')
      .select('*, child:children(name, avatar_color)')
      .gte('date', start).lte('date', end)
      .neq('status', 'cancelado')
      .order('time', { nullsFirst: false }),
    supabase.from('children').select('*').order('sort_order'),
  ])

  return (
    <CalendarioClient
      initialActivities={activities ?? []}
      initialChildren={children ?? []}
    />
  )
}
