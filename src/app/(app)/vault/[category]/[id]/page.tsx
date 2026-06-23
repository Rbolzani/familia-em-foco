import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { DocumentCategory, AppDocument } from '@/lib/types'
import { VAULT_CATEGORY_KEYS } from '@/lib/vault'
import DocumentDetailClient from './DocumentDetailClient'

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ category: string; id: string }>
}) {
  const { category, id } = await params
  if (!VAULT_CATEGORY_KEYS.includes(category as DocumentCategory)) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: doc }, { data: children }] = await Promise.all([
    // RLS escopa por família — owner e partners acessam o mesmo documento
    supabase
      .from('documents')
      .select('*, child:children(id,name,avatar_color), files:document_files(*)')
      .eq('id', id)
      .single(),
    supabase.from('children').select('*').order('sort_order'),
  ])

  if (!doc) notFound()

  return (
    <DocumentDetailClient
      document={doc as AppDocument}
      category={category as DocumentCategory}
      children={children ?? []}
    />
  )
}
