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

  // Bootstrap: garante que todo usuário autenticado tem uma família com o nome correto.
  // Usuários com auto-confirm não passam por /auth/callback, então criamos aqui.
  // Também corrige o nome se a família foi criada com o nome padrão genérico.
  if (user) {
    const metaFamilyName = (user.user_metadata?.family_name as string | undefined)?.trim()
    const { data: familyId } = await supabase.rpc('auth_family_id')
    if (!familyId) {
      await supabase.rpc('create_my_family', { p_name: metaFamilyName || 'Minha Família' })
    } else if (metaFamilyName && metaFamilyName !== 'Minha Família') {
      // Corrige nome genérico deixado por criação anterior sem metadados
      const { data: fam } = await supabase
        .from('families')
        .select('name, created_by')
        .eq('id', familyId)
        .maybeSingle()
      if (fam?.created_by === user.id && (fam.name === 'Família' || fam.name === 'Minha Família')) {
        await supabase.from('families').update({ name: metaFamilyName }).eq('id', familyId)
      }
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
