import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AlertasClient from './AlertasClient'

export default async function AlertasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: waSettings } = await supabase
    .from('notification_settings')
    .select('whatsapp_number, daily_summary_enabled')
    .eq('user_id', user.id)
    .single()

  return (
    <AlertasClient
      userId={user.id}
      userEmail={user.email ?? ''}
      whatsapp={{
        number: waSettings?.whatsapp_number ?? '',
        enabled: waSettings?.daily_summary_enabled ?? false,
      }}
    />
  )
}
