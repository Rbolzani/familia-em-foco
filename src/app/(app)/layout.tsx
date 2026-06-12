import { createClient } from '@/lib/supabase/server'
import AppLayout from '@/components/layout/AppLayout'
import RealtimeSync from '@/components/layout/RealtimeSync'
import { getAccess } from '@/lib/access'
import { AccessProvider } from '@/components/access/AccessContext'
import PartnerBanner from '@/components/access/PartnerBanner'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const [{ data: sidebarChildren }, access] = await Promise.all([
    supabase.from('children').select('*').order('sort_order'),
    getAccess(),
  ])

  return (
    <AccessProvider value={access}>
      <AppLayout sidebarChildren={sidebarChildren ?? []}>
        <RealtimeSync />
        <PartnerBanner />
        {children}
      </AppLayout>
    </AccessProvider>
  )
}
