import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const form = await req.formData()
  const title       = form.get('title') as string
  const category    = form.get('category') as string
  const child_id    = (form.get('child_id') as string) || null
  const description = (form.get('description') as string) || null
  const expires_at  = (form.get('expires_at') as string) || null
  const files       = form.getAll('files') as File[]

  if (!title || !category) {
    return NextResponse.json({ error: 'Título e categoria são obrigatórios' }, { status: 400 })
  }

  // Create document record first
  const { data: doc, error: docErr } = await supabase
    .from('documents')
    .insert({ user_id: user.id, child_id, category, title, description, expires_at })
    .select()
    .single()

  if (docErr) return NextResponse.json({ error: docErr.message }, { status: 500 })

  // Upload files to Storage
  const uploadedFiles = []
  for (const file of files) {
    const ext = file.name.split('.').pop() ?? 'bin'
    const rand = Math.random().toString(36).slice(2, 6)
    const storagePath = `${user.id}/${doc.id}/${Date.now()}-${rand}.${ext}`

    const bytes = await file.arrayBuffer()
    const { error: storageErr } = await supabase.storage
      .from('documents')
      .upload(storagePath, bytes, { contentType: file.type, upsert: false })

    if (storageErr) {
      // rollback document
      await supabase.from('documents').delete().eq('id', doc.id)
      return NextResponse.json({ error: `Falha no upload: ${storageErr.message}` }, { status: 500 })
    }

    const { data: fileRec, error: fileErr } = await supabase
      .from('document_files')
      .insert({
        document_id: doc.id,
        user_id: user.id,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        storage_path: storagePath,
      })
      .select()
      .single()

    if (fileErr) {
      await supabase.from('documents').delete().eq('id', doc.id)
      return NextResponse.json({ error: fileErr.message }, { status: 500 })
    }
    uploadedFiles.push(fileRec)
  }

  return NextResponse.json({ document: doc, files: uploadedFiles })
}
