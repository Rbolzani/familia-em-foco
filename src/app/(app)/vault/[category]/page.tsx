import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { DocumentCategory, AppDocument } from '@/lib/types'
import { VAULT_CATEGORY_KEYS } from '@/lib/vault'
import { getFamilyPlan, PLAN_LIMITS } from '@/lib/billing'
import GavetaClient from './GavetaClient'

export default async function GavetaPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category } = await params
  if (!VAULT_CATEGORY_KEYS.includes(category as DocumentCategory)) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: children }, { data: documents }, plan] = await Promise.all([
    supabase.from('children').select('*').order('sort_order'),
    // RLS escopa por família — owner e partners veem os mesmos docs
    supabase
      .from('documents')
      .select('*, child:children(id,name,avatar_color), files:document_files(id,file_name,file_size,mime_type,created_at)')
      .eq('category', category)
      .order('created_at', { ascending: false }),
    getFamilyPlan(),
  ])

  return (
    <GavetaClient
      category={category as DocumentCategory}
      children={children ?? []}
      documents={(documents ?? []) as AppDocument[]}
      canOcr={PLAN_LIMITS[plan].ocr}
    />
  )
}
