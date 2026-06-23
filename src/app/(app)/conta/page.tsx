import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ContaClient from './ContaClient'

export default async function ContaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: prof } = await supabase
    .from('profiles')
    .select('full_name, phone, birth_date, cpf, marketing_consent')
    .eq('user_id', user.id)
    .maybeSingle()

  return (
    <ContaClient
      email={user.email ?? ''}
      fullName={prof?.full_name ?? ''}
      phone={prof?.phone ?? ''}
      birthDate={prof?.birth_date ?? ''}
      cpf={prof?.cpf ?? ''}
      marketingConsent={prof?.marketing_consent ?? false}
    />
  )
}
