import { createClient } from '@/lib/supabase/server'
import ChildrenClient from './ChildrenClient'
import type { FamilyOption } from '@/components/layout/FamilySwitcher'

export default async function ChildrenPage() {
  const supabase = await createClient()
  const [{ data: children }, { data: familiesRaw }] = await Promise.all([
    supabase.from('children').select('*').order('sort_order'),
    supabase.rpc('get_my_families'),
  ])

  const families: FamilyOption[] = (familiesRaw ?? []).map((f: {
    family_id: string; family_name: string; is_owner: boolean; is_active: boolean; member_count: number
  }) => ({
    family_id: f.family_id,
    family_name: f.family_name,
    is_owner: f.is_owner,
    is_active: f.is_active,
    member_count: Number(f.member_count),
  }))

  return <ChildrenClient initialChildren={children ?? []} families={families} />
}
