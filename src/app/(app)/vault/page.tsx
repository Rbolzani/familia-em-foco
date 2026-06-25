import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getFamilyPlan, getFamilyStorageUsedBytes, PLAN_LIMITS } from '@/lib/billing'
import VaultClient from './VaultClient'

export default async function VaultPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: children }, { data: documents }, plan, storageUsed] = await Promise.all([
    supabase.from('children').select('*').order('sort_order'),
    // RLS escopa por família (family_id) — owner e partners veem os mesmos docs
    supabase
      .from('documents')
      .select('id, category, child_id, title, expires_at')
      .order('expires_at', { ascending: true, nullsFirst: false }),
    getFamilyPlan(),
    getFamilyStorageUsedBytes(),
  ])

  return (
    <VaultClient
      children={children ?? []}
      documents={documents ?? []}
      canOcr={PLAN_LIMITS[plan].ocr}
      canSearch={PLAN_LIMITS[plan].documentSearch}
      storageUsedBytes={storageUsed}
      storageLimitBytes={PLAN_LIMITS[plan].storageLimitBytes}
    />
  )
}
