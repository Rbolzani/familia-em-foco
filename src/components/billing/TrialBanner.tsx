'use client'
import { useState } from 'react'
import { X, Clock } from 'lucide-react'

interface Props {
  daysLeft: number
  planLabel: string
  hasPartner?: boolean
  isPartner?: boolean
}

export default function TrialBanner({ daysLeft, planLabel, hasPartner, isPartner }: Props) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  const urgent = daysLeft <= 3
  const last   = daysLeft === 0

  const bg      = urgent ? 'linear-gradient(135deg,#FEF3C7,#FDE68A)' : 'linear-gradient(135deg,rgba(61,102,65,0.10),rgba(44,74,46,0.06))'
  const border  = urgent ? '1px solid rgba(245,158,11,0.40)' : '1px solid rgba(61,102,65,0.20)'
  const color   = urgent ? '#92400E' : '#2C4A2E'
  const iconBg  = urgent ? 'linear-gradient(140deg,#F59E0B,#D97706)' : 'linear-gradient(140deg,#3D6641,#2C4A2E)'
  const btnBg   = urgent ? 'linear-gradient(140deg,#F59E0B,#D97706)' : 'linear-gradient(140deg,#3D6641,#2C4A2E)'

  let message: string
  if (isPartner) {
    // Parceiro: o trial é do responsável; texto adaptado e sem botão de assinar.
    const head = last
      ? `O período de teste do plano ${planLabel} termina hoje.`
      : `O período de teste do plano ${planLabel} termina em ${daysLeft} dia${daysLeft > 1 ? 's' : ''}.`
    message = head + ' Após isso, você terá 5 dias antes de perder o acesso compartilhado.'
  } else {
    const baseMsg = last
      ? `Seu período de teste do plano ${planLabel} termina hoje.`
      : `${daysLeft} dia${daysLeft > 1 ? 's' : ''} restante${daysLeft > 1 ? 's' : ''} no seu período de teste do plano ${planLabel}.`
    const partnerSuffix = hasPartner
      ? ' Após isso, seu parceiro(a) terá 5 dias antes de ser desconectado(a).'
      : ''
    message = baseMsg + partnerSuffix
  }

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
        <Clock size={15} color="white" />
      </div>

      <p style={{ flex: 1, fontSize: 13, fontWeight: 600, color, margin: 0, lineHeight: 1.4 }}>
        {message}
      </p>

      {!isPartner && (
        <a href="/planos"
          style={{
            flexShrink: 0, padding: '7px 14px', borderRadius: 10,
            background: btnBg, color: 'white',
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
