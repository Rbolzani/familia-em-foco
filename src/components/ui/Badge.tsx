import { ActivityCategory } from '@/lib/types'

const categoryConfig = {
  escola: {
    label: 'Escola', emoji: '📘',
    bg: '#EFF6FF', color: '#3B82F6', border: 'rgba(147,197,253,0.4)',
  },
  saude: {
    label: 'Saúde', emoji: '🩺',
    bg: '#F0FAF2', color: '#4A9E5C', border: 'rgba(168,221,181,0.4)',
  },
  extracurricular: {
    label: 'Extracurricular', emoji: '⭐',
    bg: '#FFF8EC', color: '#B45309', border: 'rgba(255,228,160,0.6)',
  },
}

const statusConfig = {
  pendente:  { label: 'Pendente',  bg: '#FFF8EC', color: '#B45309', border: 'rgba(255,228,160,0.5)' },
  concluido: { label: 'Concluído', bg: '#F0FAF2', color: '#4A9E5C', border: 'rgba(168,221,181,0.4)' },
  cancelado: { label: 'Cancelado', bg: '#F0F0F8', color: '#8585A8', border: 'rgba(133,133,168,0.2)' },
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

  if (diff < 0) return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border"
      style={{ background: '#FFF0F4', color: '#C0405A', borderColor: 'rgba(240,100,130,0.25)' }}>
      ⚠ Atrasado
    </span>
  )
  if (diff === 0) return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border"
      style={{ background: '#FFF8EC', color: '#B45309', borderColor: 'rgba(255,228,160,0.5)' }}>
      🔥 Hoje
    </span>
  )
  if (diff <= 3) return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border"
      style={{ background: '#FFF8EC', color: '#B45309', borderColor: 'rgba(255,228,160,0.5)' }}>
      Em {diff}d
    </span>
  )
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border"
      style={{ background: '#F0FAF2', color: '#4A9E5C', borderColor: 'rgba(168,221,181,0.4)' }}>
      Em {diff}d
    </span>
  )
}
