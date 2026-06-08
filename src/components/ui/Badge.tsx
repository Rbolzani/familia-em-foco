import { ActivityCategory } from '@/lib/types'

const categoryConfig = {
  escola: {
    label: 'Escola', icon: '📘',
    bg: 'linear-gradient(140deg,#DBEAFE,#BFDBFE)',
    color: '#1D4ED8',
    border: 'rgba(37,99,235,0.18)',
  },
  saude: {
    label: 'Saúde', icon: '🩺',
    bg: 'linear-gradient(140deg,#D1FAE5,#A7F3D0)',
    color: '#065F46',
    border: 'rgba(6,95,70,0.18)',
  },
  extracurricular: {
    label: 'Extracurricular', icon: '⭐',
    bg: 'linear-gradient(140deg,#FEF3C7,#FDE68A)',
    color: '#92400E',
    border: 'rgba(146,64,14,0.18)',
  },
}

const statusConfig = {
  pendente:  {
    label: 'Pendente',
    bg: 'linear-gradient(140deg,#FEF3C7,#FDE68A)',
    color: '#92400E', border: 'rgba(146,64,14,0.18)',
  },
  concluido: {
    label: 'Concluído',
    bg: 'linear-gradient(140deg,#D1FAE5,#A7F3D0)',
    color: '#065F46', border: 'rgba(6,95,70,0.18)',
  },
  cancelado: {
    label: 'Cancelado',
    bg: 'rgba(26,43,28,0.06)',
    color: 'rgba(26,43,28,0.45)', border: 'rgba(26,43,28,0.10)',
  },
}

const badgeBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '3px 10px', borderRadius: 100,
  fontSize: 11, fontWeight: 700,
  border: '1px solid',
  boxShadow: '0 1px 3px rgba(44,74,46,0.08),0 -1px 0 rgba(255,255,255,0.60) inset',
}

export function CategoryBadge({ category }: { category: ActivityCategory }) {
  const c = categoryConfig[category]
  return (
    <span style={{ ...badgeBase, backgroundImage: c.bg, color: c.color, borderColor: c.border }}>
      {c.icon} {c.label}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const s = statusConfig[status as keyof typeof statusConfig] ?? statusConfig.pendente
  return (
    <span style={{ ...badgeBase, backgroundImage: s.bg, color: s.color, borderColor: s.border }}>
      {s.label}
    </span>
  )
}

export function DeadlineBadge({ date }: { date: string }) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const d = new Date(date + 'T00:00:00')
  const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000)

  if (diff < 0) return (
    <span style={{ ...badgeBase,
      backgroundImage: 'linear-gradient(140deg,#FEE2E2,#FECACA)',
      color: '#991B1B', borderColor: 'rgba(220,38,38,0.20)' }}>
      ⚠ Atrasado
    </span>
  )
  if (diff === 0) return (
    <span style={{ ...badgeBase,
      backgroundImage: 'linear-gradient(140deg,#FEE2E2,#FECACA)',
      color: '#B91C1C', borderColor: 'rgba(220,38,38,0.20)' }}>
      🔥 Hoje
    </span>
  )
  if (diff <= 3) return (
    <span style={{ ...badgeBase,
      backgroundImage: 'linear-gradient(140deg,#FEF3C7,#FDE68A)',
      color: '#92400E', borderColor: 'rgba(146,64,14,0.18)' }}>
      Em {diff}d
    </span>
  )
  return (
    <span style={{ ...badgeBase,
      backgroundImage: 'linear-gradient(140deg,#D1FAE5,#A7F3D0)',
      color: '#065F46', borderColor: 'rgba(6,95,70,0.18)' }}>
      Em {diff}d
    </span>
  )
}
