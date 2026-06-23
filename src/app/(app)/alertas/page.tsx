import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AlertasClient from './AlertasClient'
import { getFamilyPlan } from '@/lib/billing'

export default async function AlertasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: waSettings }, plan] = await Promise.all([
    supabase
      .from('notification_settings')
      .select('whatsapp_number, daily_summary_enabled, summary_time')
      .eq('user_id', user.id)
      .single(),
    getFamilyPlan(),
  ])

  const twilioMode    = !!process.env.TWILIO_ACCOUNT_SID
  const twilioKeyword = process.env.TWILIO_SANDBOX_KEYWORD ?? ''

  return (
    <AlertasClient
      userId={user.id}
      userEmail={user.email ?? ''}
      whatsapp={{
        number: waSettings?.whatsapp_number ?? '',
        enabled: waSettings?.daily_summary_enabled ?? false,
        time: (waSettings?.summary_time ?? '07:00').slice(0, 5),
      }}
      twilioMode={twilioMode}
      twilioKeyword={twilioKeyword}
      whatsappBlocked={plan === 'free'}
    />
  )
}
