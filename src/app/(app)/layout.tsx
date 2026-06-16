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

  // Bootstrap: garante que todo usuário autenticado tem uma família.
  // Usuários que entram via auto-confirm não passam por /auth/callback,
  // então a família precisa ser criada aqui na primeira carga.
  if (user) {
    const { data: familyId } = await supabase.rpc('auth_family_id')
    if (!familyId) {
      await supabase.rpc('create_my_family', {
        p_name: (user.user_metadata?.family_name as string | undefined)?.trim() || 'Minha Família'
      })
    }
  }

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
