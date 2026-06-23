'use client'
import { useState } from 'react'
import { X, UserX } from 'lucide-react'

interface Props {
  type: 'owner_grace' | 'partner_grace'
  daysLeft: number
  ownerName?: string | null
}

export default function GraceBanner({ type, daysLeft, ownerName }: Props) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  const last = daysLeft <= 1
  const urgent = daysLeft <= 2

  const bg     = urgent ? 'linear-gradient(135deg,#FEF3C7,#FDE68A)' : 'linear-gradient(135deg,rgba(239,68,68,0.08),rgba(220,38,38,0.05))'
  const border = urgent ? '1px solid rgba(245,158,11,0.40)' : '1px solid rgba(239,68,68,0.25)'
  const color  = urgent ? '#92400E' : '#991B1B'
  const iconBg = urgent ? 'linear-gradient(140deg,#F59E0B,#D97706)' : 'linear-gradient(140deg,#DC2626,#991B1B)'

  const dayStr = last ? 'hoje' : `em ${daysLeft} dia${daysLeft > 1 ? 's' : ''}`

  const message = type === 'owner_grace'
    ? `Seu parceiro(a) será desconectado ${dayStr}. Assine um plano para manter o acesso compartilhado.`
    : `Sua conexão com ${ownerName ?? 'o proprietário(a)'} será encerrada ${dayStr}. Peça para assinar o plano Família.`

  const showButton = type === 'owner_grace'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 16px',
      background: bg,
      border,
      borderRadius: 14,
      margin: '0 0 12px',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9, flexShrink: 0,
        background: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <UserX size={15} color="white" />
      </div>

      <p style={{ flex: 1, fontSize: 13, fontWeight: 600, color, margin: 0, lineHeight: 1.4 }}>
        {message}
      </p>

      {showButton && (
        <a href="/planos" style={{
          flexShrink: 0, padding: '7px 14px', borderRadius: 10,
          background: iconBg, color: 'white',
          fontSize: 12, fontWeight: 700, textDecoration: 'none',
          whiteSpace: 'nowrap',
        }}>
          Assinar agora
        </a>
      )}

      <button onClick={() => setDismissed(true)} style={{
        flexShrink: 0, background: 'none', border: 'none',
        cursor: 'pointer', padding: 4, color, opacity: 0.55,
      }}>
        <X size={14} />
      </button>
    </div>
  )
}
