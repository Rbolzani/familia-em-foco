import { ActivityCategory } from '@/lib/types'

const categoryConfig = {
  escola: {
    label: 'Escola', emoji: '📘',
    bg: '#EEF4FF', color: '#2563EB', border: '#BFDBFE',
  },
  saude: {
    label: 'Saúde', emoji: '🩺',
    bg: '#E6FBF4', color: '#00A876', border: '#A7F3D0',
  },
  extracurricular: {
    label: 'Extracurricular', emoji: '⭐',
    bg: '#F3EEFF', color: '#7C3AED', border: '#DDD6FE',
  },
}

const statusConfig = {
  pendente:  { label: 'Pendente',  bg: '#FFF8E6', color: '#D97706', border: '#FDE68A' },
  concluido: { label: 'Concluído', bg: '#E6FBF4', color: '#00A876', border: '#A7F3D0' },
  cancelado: { label: 'Cancelado', bg: '#F5F0EB', color: '#8B7A68', border: '#D4C9BC' },
}

export function CategoryBadge({ category }: { category: ActivityCategory }) {
  const c = categoryConfig[category]
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border"
      style={{ background: c.bg, color: c.color, borderColor: c.border }}
    >
      {c.emoji} {c.label}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const s = statusConfig[status as keyof typeof statusConfig] ?? statusConfig.pendente
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border"
      style={{ background: s.bg, color: s.color, borderColor: s.border }}
    >
      {s.label}
    </span>
  )
}

export function DeadlineBadge({ date }: { date: string }) {
  const today = new Date(); today.setHours(0,0,0,0)
  const d = new Date(date + 'T00:00:00')
  const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000)

  if (diff < 0)  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border"
      style={{ background: '#FFF0EB', color: '#F4522D', borderColor: '#FDD5C9' }}>
      ⚠ Atrasado
    </span>
  )
  if (diff === 0) return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border"
      style={{ background: '#FFF8E6', color: '#D97706', borderColor: '#FDE68A' }}>
      🔥 Hoje
    </span>
  )
  if (diff <= 3)  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border"
      style={{ background: '#FFF8E6', color: '#D97706', borderColor: '#FDE68A' }}>
      Em {diff}d
    </span>
  )
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border"
      style={{ background: '#E6FBF4', color: '#00A876', borderColor: '#A7F3D0' }}>
      Em {diff}d
    </span>
  )
}
