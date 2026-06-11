import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import VaultClient from './VaultClient'

export default async function VaultPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: children }, { data: documents }] = await Promise.all([
    supabase.from('children').select('*').order('sort_order'),
    supabase
      .from('documents')
      .select('id, category, child_id, expires_at')
      .eq('user_id', user.id),
  ])

  return (
    <VaultClient
      children={children ?? []}
      documents={documents ?? []}
    />
  )
}
