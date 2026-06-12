import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  // Fetch all files to delete from storage (RLS escopa por família)
  const { data: files } = await supabase
    .from('document_files')
    .select('storage_path')
    .eq('document_id', id)

  if (files?.length) {
    await supabase.storage.from('documents').remove(files.map(f => f.storage_path))
  }

  // RLS permite delete apenas a owner/full_editor da mesma família
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
