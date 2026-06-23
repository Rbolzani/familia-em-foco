import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import VaultClient from './VaultClient'

export default async function VaultPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: children }, { data: documents }] = await Promise.all([
    supabase.from('children').select('*').order('sort_order'),
    // RLS escopa por família (family_id) — owner e partners veem os mesmos docs
    supabase
      .from('documents')
      .select('id, category, child_id, title, expires_at')
      .order('expires_at', { ascending: true, nullsFirst: false }),
  ])

  return (
    <VaultClient
      children={children ?? []}
      documents={documents ?? []}
    />
  )
}
