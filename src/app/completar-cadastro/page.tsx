import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CompletarCadastroClient from './CompletarCadastroClient'

export default async function CompletarCadastroPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Já completou → vai para o app.
  const { data: prof } = await supabase
    .from('profiles')
    .select('profile_completed_at, full_name, phone, birth_date, cpf')
    .eq('user_id', user.id)
    .maybeSingle()

  if (prof?.profile_completed_at) redirect('/dashboard')

  // Pré-preenche o nome a partir do cadastro inicial, se houver.
  const initialName =
    prof?.full_name ??
    (user.user_metadata?.full_name as string | undefined) ??
    ''

  return (
    <CompletarCadastroClient
      email={user.email ?? ''}
      initialName={initialName}
    />
  )
}
