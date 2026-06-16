import { createClient } from '@/lib/supabase/server'
import AppLayout from '@/components/layout/AppLayout'
import RealtimeSync from '@/components/layout/RealtimeSync'
import { getAccess, getActiveFamily } from '@/lib/access'
import { AccessProvider } from '@/components/access/AccessContext'
import PartnerBanner from '@/components/access/PartnerBanner'
import { TourProvider } from '@/components/tour/TourContext'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const [{ data: sidebarChildren }, access, { familyId: activeFamilyId }] = await Promise.all([
    supabase.from('children').select('*').order('sort_order'),
    getAccess(),
    getActiveFamily(supabase),
  ])

  const hasChildren = (sidebarChildren ?? []).length > 0

  return (
    <TourProvider hasChildren={hasChildren} userId={user?.id ?? ''}>
      <AccessProvider value={access}>
        <AppLayout sidebarChildren={sidebarChildren ?? []} activeFamilyId={activeFamilyId}>
          <RealtimeSync />
          <PartnerBanner />
          {children}
        </AppLayout>
      </AccessProvider>
    </TourProvider>
  )
}
