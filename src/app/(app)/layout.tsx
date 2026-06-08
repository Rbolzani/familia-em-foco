import { createClient } from '@/lib/supabase/server'
import AppLayout from '@/components/layout/AppLayout'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: sidebarChildren } = await supabase
    .from('children')
    .select('id, name, avatar_color, avatar_url, birth_date, school_name')
    .order('sort_order')

  return (
    <AppLayout sidebarChildren={sidebarChildren ?? []}>
      {children}
    </AppLayout>
  )
}
