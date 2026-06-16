import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OnboardingClient from './OnboardingClient'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: children } = await supabase.from('children').select('id').limit(1)

  // Se já tem filhos, onboarding concluído — vai para dashboard
  if (children && children.length > 0) redirect('/dashboard')

  const name = (user.user_metadata?.full_name as string | undefined)?.split(' ')[0]
    ?? user.email?.split('@')[0]
    ?? 'você'

  return <OnboardingClient firstName={name} />
}
