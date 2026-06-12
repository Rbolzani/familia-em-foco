import { createClient } from '@/lib/supabase/server'

export type AccessRole = 'owner' | 'read_only' | 'logistics_editor' | 'full_editor'

export interface Access {
  role: AccessRole
  isOwner: boolean
  isPartner: boolean
  canEdit: boolean        // criar/editar/excluir tudo (owner ou full_editor)
  canLogistics: boolean   // marcar leva/busca (owner, full_editor, logistics_editor)
  ownerName: string | null
}

const FULL: Access = {
  role: 'owner', isOwner: true, isPartner: false,
  canEdit: true, canLogistics: true, ownerName: null,
}

/**
 * Acesso efetivo do usuário logado na família ativa. Usado nos Server
 * Components para gatear botões e exibir o banner de parceiro.
 */
export async function getAccess(): Promise<Access> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ...FULL, role: 'read_only', isOwner: false, canEdit: false, canLogistics: false }

  const { data } = await supabase.rpc('get_my_access')
  const row = data?.[0] as { role: string; access_role: string | null; is_owner: boolean; owner_name: string | null } | undefined

  // Sem membership ainda → trata como owner (vai criar a própria família)
  if (!row) return FULL

  const role: AccessRole = row.is_owner ? 'owner' : ((row.access_role as AccessRole) ?? 'read_only')
  const canEdit = role === 'owner' || role === 'full_editor'
  const canLogistics = canEdit || role === 'logistics_editor'

  return {
    role,
    isOwner: row.is_owner,
    isPartner: !row.is_owner,
    canEdit,
    canLogistics,
    ownerName: row.owner_name,
  }
}
