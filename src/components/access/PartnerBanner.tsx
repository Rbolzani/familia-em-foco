'use client'
import { Eye, Truck, Pencil } from 'lucide-react'
import { useAccess } from './AccessContext'

const LABEL: Record<string, { text: string; icon: React.ElementType }> = {
  read_only:        { text: 'somente leitura',        icon: Eye },
  logistics_editor: { text: 'leitura + logística',    icon: Truck },
  full_editor:      { text: 'acesso completo',        icon: Pencil },
}

/**
 * Faixa fixa no topo avisando o parceiro do seu nível de acesso.
 * Não aparece para o owner.
 */
export default function PartnerBanner() {
  const access = useAccess()
  if (!access.isPartner) return null

  const meta = LABEL[access.role] ?? LABEL.read_only
  const Icon = meta.icon

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      padding: '7px 14px', fontSize: 12.5, fontWeight: 600,
      background: 'rgba(99,102,241,0.10)', color: '#4338CA',
      borderBottom: '1px solid rgba(99,102,241,0.18)',
    }}>
      <Icon size={14} style={{ flexShrink: 0 }} />
      <span>
        Acesso compartilhado de <strong>{access.ownerName ?? 'o proprietário'}</strong>
        {' · '}voc&ecirc; tem <strong>{meta.text}</strong>
      </span>
    </div>
  )
}
