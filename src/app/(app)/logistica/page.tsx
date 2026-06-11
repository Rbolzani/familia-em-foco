import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getFamilyMembersForUser } from '@/lib/get-family-members'
import LogisticaClient from './LogisticaClient'

export default async function LogisticaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const todayStr = new Intl.DateTimeFormat('fr-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())

  const [{ data: activities }, { data: children }, familyMembers] = await Promise.all([
    supabase.from('activities')
      .select('*, child:children(name, avatar_color)')
      .not('date', 'is', null)
      .gte('date', todayStr)
      .neq('status', 'cancelado')
      .order('date').order('time', { nullsFirst: false }),
    supabase.from('children').select('*').order('sort_order'),
    getFamilyMembersForUser(user.id),
  ])

  return (
    <LogisticaClient
      activities={activities ?? []}
      children={children ?? []}
      familyMembers={familyMembers}
      currentUserId={user.id}
    />
  )
}
