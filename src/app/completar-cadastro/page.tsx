import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
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

  // Convite capturado no middleware (cookie). Se existir, ao final do cadastro
  // o usuário é levado para a tela de aceite em vez do dashboard — garantindo
  // que ele entre no ambiente compartilhado, não numa família nova vazia.
  const cookieStore = await cookies()
  const inviteToken = cookieStore.get('pending_invite')?.value ?? null

  return (
    <CompletarCadastroClient
      email={user.email ?? ''}
      initialName={initialName}
      inviteToken={inviteToken}
    />
  )
}
