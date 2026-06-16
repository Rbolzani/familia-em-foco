import { createClient } from '@/lib/supabase/server'
import AppLayout from '@/components/layout/AppLayout'
import RealtimeSync from '@/components/layout/RealtimeSync'
import { getAccess } from '@/lib/access'
import { AccessProvider } from '@/components/access/AccessContext'
import PartnerBanner from '@/components/access/PartnerBanner'
import type { FamilyOption } from '@/components/layout/FamilySwitcher'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const [{ data: sidebarChildren }, access, { data: familiesRaw }] = await Promise.all([
    supabase.from('children').select('*').order('sort_order'),
    getAccess(),
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

  return (
    <AccessProvider value={access}>
      <AppLayout sidebarChildren={sidebarChildren ?? []} families={families}>
        <RealtimeSync />
        <PartnerBanner />
        {children}
      </AppLayout>
    </AccessProvider>
  )
}
