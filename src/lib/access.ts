import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Retorna { familyId, isOwner } da família ativa do usuário,
 * respeitando a seleção feita pelo FamilySwitcher (switch_active_family).
 */
export async function getActiveFamily(supabase: SupabaseClient): Promise<{ familyId: string | null; isOwner: boolean }> {
  const { data: families } = await supabase.rpc('get_my_families')
  if (!families || families.length === 0) return { familyId: null, isOwner: false }
  const active = (families as Array<{ family_id: string; is_owner: boolean; is_active: boolean }>)
    .find(f => f.is_active) ?? families[0]
  return { familyId: active.family_id, isOwner: active.is_owner }
}

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
