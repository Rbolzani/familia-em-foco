import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  // 1. Verificar sessão
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 2. Verificar confirmação explícita (LGPD: ação intencional documentada)
  let confirmation: string
  try {
    const body = await request.json()
    confirmation = body.confirmation
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }
  if (confirmation !== 'EXCLUIR') {
    return NextResponse.json({ error: 'Confirmação inválida' }, { status: 400 })
  }

  const admin = createAdminClient()

  try {
    // 3. Coletar caminhos de Storage a deletar ANTES da limpeza do banco
    //    (só famílias solo — famílias com parceiros ficam intactas)
    const { data: myFamilies } = await admin
      .from('families')
      .select('id')
      .eq('created_by', user.id)

    const myFamilyIds = (myFamilies ?? []).map(f => f.id as string)
    let storagePathsToDelete: string[] = []

    if (myFamilyIds.length > 0) {
      // Famílias que têm pelo menos um outro membro
      const { data: otherMembers } = await admin
        .from('family_members')
        .select('family_id')
        .in('family_id', myFamilyIds)
        .neq('user_id', user.id)

      const familiesWithPartners = new Set((otherMembers ?? []).map(m => m.family_id as string))
      const soloFamilyIds = myFamilyIds.filter(id => !familiesWithPartners.has(id))

      if (soloFamilyIds.length > 0) {
        const { data: paths } = await admin
          .from('document_files')
          .select('storage_path')
          .in('family_id', soloFamilyIds)
        storagePathsToDelete = (paths ?? []).map(p => p.storage_path as string)
      }
    }

    // 4. Executar limpeza do banco (SECURITY DEFINER, service_role only)
    const { error: rpcErr } = await admin.rpc('delete_my_account_admin', { p_uid: user.id })
    if (rpcErr) {
      console.error('[delete-account] rpc error:', rpcErr)
      throw rpcErr
    }

    // 5. Deletar arquivos do Storage (melhor esforço — banco já foi limpo)
    if (storagePathsToDelete.length > 0) {
      const { error: storageErr } = await admin.storage
        .from('documents')
        .remove(storagePathsToDelete)
      if (storageErr) console.error('[delete-account] storage partial error:', storageErr)
    }

    // 6. Deletar auth.users — ponto sem retorno
    const { error: authErr } = await admin.auth.admin.deleteUser(user.id)
    if (authErr) {
      console.error('[delete-account] auth delete error:', authErr)
      throw authErr
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[delete-account]', err)
    return NextResponse.json(
      { error: 'Erro interno ao excluir conta. Tente novamente.' },
      { status: 500 },
    )
  }
}
