'use client'
import Link from 'next/link'
import {
  BookOpen, HeartPulse, Trophy, CalendarDays, FolderLock,
  Baby, Sparkles, ChevronRight, Clock, MapPin,
  Users, CalendarCheck, CalendarRange, AlertTriangle,
} from 'lucide-react'
import { Activity, Child } from '@/lib/types'
import { CategoryBadge } from '@/components/ui/Badge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Props {
  userName: string
  children: Child[]
  todayActivities: (Activity & { child: { name: string; avatar_color: string } })[]
  upcomingActivities: (Activity & { child: { name: string; avatar_color: string } })[]
}

// ── Exact values from musgo-v2 preview ──
const NOISE_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`

// Stat card: white → #F5F0E8 (exact from preview)
const STAT_BG: React.CSSProperties = {
  background: `${NOISE_SVG}, linear-gradient(160deg, #FFFFFF 0%, #F5F0E8 100%)`,
  backgroundSize: '200px 200px, 100% 100%',
  borderRadius: '20px 13px 18px 15px',
  border: '1px solid rgba(61,102,65,0.22)',
  boxShadow: '0 6px 20px rgba(44,74,46,0.12),0 1px 4px rgba(44,74,46,0.08),0 -1px 0 rgba(255,255,255,0.85) inset,0 1px 0 rgba(0,0,0,0.04) inset',
  padding: '22px 20px',
  position: 'relative',
  overflow: 'hidden',
}

// Activity card: white → #FAFAF7 (exact from preview)
const ACT_CARD: React.CSSProperties = {
  background: `${NOISE_SVG}, linear-gradient(160deg, #FFFFFF 0%, #FAFAF7 100%)`,
  backgroundSize: '200px 200px, 100% 100%',
  borderRadius: '17px 11px 15px 13px',
  border: '1px solid rgba(61,102,65,0.22)',
  boxShadow: '0 2px 8px rgba(44,74,46,0.10),0 -1px 0 rgba(255,255,255,0.90) inset,0 1px 0 rgba(0,0,0,0.03) inset',
  padding: '15px 18px',
  position: 'relative',
  overflow: 'hidden',
  cursor: 'pointer',
}

// Module card
const MOD_CARD: React.CSSProperties = {
  background: `${NOISE_SVG}, linear-gradient(160deg, #FFFFFF 0%, #F5F0E8 100%)`,
  backgroundSize: '150px 150px, 100% 100%',
  borderRadius: '17px 11px 15px 13px',
  border: '1px solid rgba(61,102,65,0.22)',
  boxShadow: '0 2px 8px rgba(44,74,46,0.09),0 -1px 0 rgba(255,255,255,0.85) inset,0 1px 0 rgba(0,0,0,0.03) inset',
  padding: '16px',
  position: 'relative',
  overflow: 'hidden',
  cursor: 'pointer',
}

// AI CTA card
const AI_CARD: React.CSSProperties = {
  background: 'linear-gradient(140deg,#2C4A2E 0%,#1E3320 100%)',
  borderRadius: '20px 13px 18px 15px',
  border: '1px solid rgba(44,74,46,0.35)',
  boxShadow: '0 8px 28px rgba(44,74,46,0.28),0 -1px 0 rgba(255,255,255,0.10) inset,0 1px 0 rgba(0,0,0,0.20) inset',
  overflow: 'hidden',
  position: 'relative',
}

const modules = [
  { href: '/escola',     label: 'Escola',         icon: BookOpen,     icolor: '#2563EB', ibg: 'linear-gradient(140deg,#DBEAFE,#BFDBFE)', desc: 'Provas, tarefas, eventos' },
  { href: '/saude',      label: 'Saúde',           icon: HeartPulse,   icolor: '#065F46', ibg: 'linear-gradient(140deg,#D1FAE5,#A7F3D0)', desc: 'Consultas, vacinas' },
  { href: '/atividades', label: 'Extracurricular', icon: Trophy,       icolor: '#92400E', ibg: 'linear-gradient(140deg,#FEF3C7,#FDE68A)', desc: 'Esportes, cursos, hobbies' },
  { href: '/calendario', label: 'Calendário',      icon: CalendarDays, icolor: '#3D6641', ibg: 'linear-gradient(140deg,#D1FAE5,#A7F3D0)', desc: 'Agenda completa' },
  { href: '/vault',      label: 'Documentos',      icon: FolderLock,   icolor: '#6D28D9', ibg: 'linear-gradient(140deg,#EDE9FE,#DDD6FE)', desc: 'Vault seguro' },
  { href: '/children',   label: 'Filhos',          icon: Baby,         icolor: '#C49A6C', ibg: 'linear-gradient(140deg,#FEF3C7,#FDE68A)', desc: 'Perfis e dados' },
]

function greet() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function fmtDay(date: string) {
  return format(new Date(date + 'T00:00:00'), "EEEE, d 'de' MMMM", { locale: ptBR })
}

function deadlineLabel(date: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const d = new Date(date + 'T00:00:00')
  const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000)
  if (diff < 0)   return { label: 'Atrasado', bg: 'linear-gradient(140deg,#FEE2E2,#FECACA)', color: '#991B1B', border: 'rgba(220,38,38,0.20)' }
  if (diff === 0)  return { label: 'Hoje',    bg: 'linear-gradient(140deg,#FEE2E2,#FECACA)', color: '#B91C1C', border: 'rgba(220,38,38,0.20)' }
  if (diff <= 3)   return { label: `${diff}d`, bg: 'linear-gradient(140deg,#FEF3C7,#FDE68A)', color: '#92400E', border: 'rgba(146,64,14,0.18)' }
  return { label: `${diff}d`, bg: 'linear-gradient(140deg,#D1FAE5,#A7F3D0)', color: '#065F46', border: 'rgba(6,95,70,0.18)' }
}

export default function DashboardClient({ userName, children, todayActivities, upcomingActivities }: Props) {
  const today     = new Date().toISOString().split('T')[0]
  const pendentes = todayActivities.filter(a => a.status === 'pendente').length

  // Corner wash colors per stat card (mirrors preview ::before)
  const statDefs = [
    { label: 'Filhos',      n: children.length,           icon: Users,          icolor: '#3D6641', ibg: 'linear-gradient(140deg,#D1FAE5,#A7F3D0)', corner: '#3D6641' },
    { label: 'Hoje',        n: todayActivities.length,    icon: CalendarCheck,  icolor: '#2563EB', ibg: 'linear-gradient(140deg,#DBEAFE,#BFDBFE)', corner: '#2563EB' },
    { label: 'Esta semana', n: upcomingActivities.length, icon: CalendarRange,  icolor: '#92400E', ibg: 'linear-gradient(140deg,#FEF3C7,#FDE68A)', corner: '#C49A6C' },
    { label: 'Pendentes',   n: pendentes,
      icon: AlertTriangle,
      icolor: pendentes > 0 ? '#991B1B' : '#065F46',
      ibg:   pendentes > 0 ? 'linear-gradient(140deg,#FEE2E2,#FECACA)' : 'linear-gradient(140deg,#D1FAE5,#A7F3D0)',
      corner: pendentes > 0 ? '#DC2626' : '#3D6641',
    },
  ]

  return (
    <div className="max-w-4xl mx-auto px-5 py-7 space-y-7 relative z-10">

      {/* ── Greeting ── */}
      <div className="animate-fade-up pt-1">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] mb-2 flex items-center gap-2"
          style={{ color: '#5A8C5E' }}>
          <span className="inline-block w-4 h-[2px] rounded"
            style={{ background: 'linear-gradient(90deg,#5A8C5E,#C49A6C)' }} />
          {greet()}
        </p>
        <h1 style={{ fontFamily: 'var(--font-lora)', fontSize: 38, fontWeight: 700, color: '#1A2B1C', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
          {userName}! 👋
        </h1>
        <p className="text-sm mt-1.5 capitalize italic" style={{ color: 'rgba(26,43,28,0.45)' }}>
          {fmtDay(today)}
        </p>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-[14px] stagger">
        {statDefs.map((s, i) => (
          <div key={i} className="animate-fade-up" style={{ ...STAT_BG, animationDelay: `${i * 0.06}s` }}>
            {/* Corner colour wash — mirrors ::before in preview */}
            <div aria-hidden className="absolute pointer-events-none"
              style={{
                top: -24, right: -24,
                width: 80, height: 80, borderRadius: '50%',
                background: s.corner, opacity: 0.10,
                transition: 'opacity .28s,transform .28s',
              }} />

            {/* Icon chip */}
            <div className="w-10 h-10 rounded-[13px] flex items-center justify-center mb-4 relative"
              style={{ backgroundImage: s.ibg, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.10),0 -1px 0 rgba(255,255,255,0.60) inset' }}>
              <s.icon size={18} color={s.icolor} strokeWidth={2} />
            </div>

            <div style={{ fontFamily: 'var(--font-lora)', fontSize: 40, fontWeight: 700, lineHeight: 1, color: '#1A2B1C' }}>
              {s.n}
            </div>
            <div style={{ fontSize: 12.5, color: 'rgba(26,43,28,0.36)', marginTop: 5, fontWeight: 500 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── No children onboarding ── */}
      {children.length === 0 && (
        <div className="p-8 text-center animate-fade-up"
          style={{ ...STAT_BG, padding: '32px', borderStyle: 'dashed', borderWidth: 2, borderColor: 'rgba(61,102,65,0.22)' }}>
          <div className="text-5xl mb-4 animate-float">🌿</div>
          <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-lora)', color: '#1A2B1C' }}>
            Cadastre seu primeiro filho
          </h2>
          <p className="text-sm mb-5 italic" style={{ color: 'rgba(26,43,28,0.50)' }}>
            Adicione os dados dos seus filhos para começar a organizar a rotina.
          </p>
          <Link href="/children">
            <button className="inline-flex items-center gap-2 px-5 py-3 rounded-[13px] text-sm font-bold transition-all hover:brightness-105 active:scale-95"
              style={{ background: 'linear-gradient(140deg,#3D6641,#2C4A2E)', color: '#D4E8D5', boxShadow: '0 4px 16px rgba(44,74,46,0.28),0 -1px 0 rgba(255,255,255,0.12) inset' }}>
              <Baby size={16} /> Adicionar filho
            </button>
          </Link>
        </div>
      )}

      {/* ── AI CTA ── */}
      <div className="animate-fade-up" style={AI_CARD}>
        {/* Decorative orbs */}
        <div className="absolute pointer-events-none" style={{ top: -40, right: -40, width: 128, height: 128, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div className="absolute pointer-events-none" style={{ bottom: -32, right: 80, width: 80, height: 80, borderRadius: '50%', background: 'rgba(196,154,108,0.10)' }} />

        <div className="p-5 flex items-center gap-4 relative">
          <div className="flex-none flex items-center justify-center rounded-[17px]"
            style={{ width: 52, height: 52, background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.16)', boxShadow: '0 4px 14px rgba(0,0,0,0.18),0 -1px 0 rgba(255,255,255,0.12) inset' }}>
            <Sparkles size={24} color="#D4E8D5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-lg font-bold leading-tight" style={{ fontFamily: 'var(--font-lora)', color: '#D4E8D5' }}>
              Adicionar com IA ✨
            </div>
            <div className="text-sm mt-0.5 italic" style={{ color: 'rgba(212,232,213,0.60)' }}>
              Foto da agenda, texto livre ou voz — extração automática
            </div>
          </div>
          <Link href="/ia">
            <button className="flex-none px-5 py-2.5 rounded-[13px] text-sm font-bold transition-all hover:brightness-110 active:scale-95"
              style={{ background: 'rgba(255,255,255,0.14)', color: '#D4E8D5', border: '1px solid rgba(255,255,255,0.20)', boxShadow: '0 2px 8px rgba(0,0,0,0.14),0 -1px 0 rgba(255,255,255,0.10) inset' }}>
              Usar IA
            </button>
          </Link>
        </div>
      </div>

      {/* ── Today ── */}
      <div className="animate-fade-up">
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontFamily: 'var(--font-lora)', fontSize: 22, fontWeight: 600, color: '#1A2B1C', display: 'flex', alignItems: 'center', gap: 12 }}>
            Hoje
            <span style={{ flex: 1, height: 2, background: 'linear-gradient(90deg,rgba(61,102,65,0.22) 0%,transparent 100%)', borderRadius: 1, display: 'inline-block', minWidth: 40 }} />
          </h2>
          <span className="text-xs font-bold px-3 py-1 rounded-full"
            style={{ background: 'linear-gradient(140deg,#FEF3C7,#FDE68A)', color: '#92400E', border: '1px solid rgba(146,64,14,0.18)', boxShadow: '0 1px 3px rgba(44,74,46,0.08)' }}>
            {todayActivities.length} atividade{todayActivities.length !== 1 ? 's' : ''}
          </span>
        </div>

        {todayActivities.length === 0 ? (
          <div className="p-6 text-center" style={STAT_BG}>
            <div className="text-3xl mb-2">🎉</div>
            <p className="text-sm font-medium italic" style={{ color: 'rgba(26,43,28,0.50)' }}>
              Nenhuma atividade para hoje — aproveite!
            </p>
          </div>
        ) : (
          <div className="space-y-[10px] stagger">
            {todayActivities.map((a, i) => (
              <ActivityRow key={a.id} activity={a} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* ── Upcoming ── */}
      {upcomingActivities.length > 0 && (
        <div className="animate-fade-up">
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ fontFamily: 'var(--font-lora)', fontSize: 22, fontWeight: 600, color: '#1A2B1C', display: 'flex', alignItems: 'center', gap: 12 }}>
              Próximos 7 dias
              <span style={{ flex: 1, height: 2, background: 'linear-gradient(90deg,rgba(61,102,65,0.22) 0%,transparent 100%)', borderRadius: 1, display: 'inline-block', minWidth: 40 }} />
            </h2>
            <Link href="/calendario"
              className="text-xs font-bold flex items-center gap-1 transition-opacity hover:opacity-70"
              style={{ color: '#3D6641' }}>
              Ver agenda <ChevronRight size={13} />
            </Link>
          </div>
          <div className="space-y-[10px] stagger">
            {upcomingActivities.slice(0, 5).map((a, i) => (
              <ActivityRow key={a.id} activity={a} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* ── Modules ── */}
      <div className="animate-fade-up">
        <h2 style={{ fontFamily: 'var(--font-lora)', fontSize: 22, fontWeight: 600, color: '#1A2B1C', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          Módulos
          <span style={{ flex: 1, height: 2, background: 'linear-gradient(90deg,rgba(61,102,65,0.22) 0%,transparent 100%)', borderRadius: 1, display: 'inline-block', minWidth: 40 }} />
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-[10px] stagger">
          {modules.map((m, i) => (
            <Link key={m.href} href={m.href}>
              <div className="h-full animate-fade-up"
                style={{ ...MOD_CARD, animationDelay: `${i * 0.05}s` }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.transform = 'translateY(-3px) rotate(-0.35deg)'
                  el.style.boxShadow = '0 10px 32px rgba(44,74,46,0.13),0 2px 8px rgba(44,74,46,0.08),0 -1px 0 rgba(255,255,255,0.85) inset'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.transform = ''
                  el.style.boxShadow = ''
                }}>
                <div className="w-11 h-11 rounded-[13px] flex items-center justify-center mb-3"
                  style={{ backgroundImage: m.ibg, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(44,74,46,0.09),0 -1px 0 rgba(255,255,255,0.60) inset' }}>
                  <m.icon size={20} color={m.icolor} strokeWidth={2} />
                </div>
                <div className="font-bold text-sm" style={{ color: '#1A2B1C' }}>{m.label}</div>
                <div className="text-xs mt-1 italic" style={{ color: 'rgba(26,43,28,0.45)' }}>{m.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}

// ────────────────────────────────────────────
// Activity Row
// ────────────────────────────────────────────
const CAT: Record<string, { bar: string; ibg: string; icolor: string; Icon: React.ElementType; href: string }> = {
  escola:          { bar: '#2563EB', ibg: 'linear-gradient(140deg,#DBEAFE,#BFDBFE)', icolor: '#2563EB', Icon: BookOpen,   href: '/escola'     },
  saude:           { bar: '#065F46', ibg: 'linear-gradient(140deg,#D1FAE5,#A7F3D0)', icolor: '#065F46', Icon: HeartPulse, href: '/saude'       },
  extracurricular: { bar: '#C49A6C', ibg: 'linear-gradient(140deg,#FEF3C7,#FDE68A)', icolor: '#92400E', Icon: Trophy,     href: '/atividades'  },
}
const CAT_DEFAULT = { bar: '#5A8C5E', ibg: 'rgba(61,102,65,0.08)', icolor: '#3D6641', Icon: CalendarDays, href: '/' }

function ActivityRow({
  activity, index,
}: {
  activity: Activity & { child: { name: string; avatar_color: string } }
  index: number
}) {
  const cat = CAT[activity.category] ?? CAT_DEFAULT
  const dl  = deadlineLabel(activity.date)

  return (
    <Link href={cat.href}>
      <div className="animate-fade-up"
        style={{ ...ACT_CARD, animationDelay: `${index * 0.05}s` }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement
          el.style.transform = 'translateX(5px) rotate(0.25deg)'
          el.style.boxShadow = '0 6px 20px rgba(44,74,46,0.12),0 1px 4px rgba(44,74,46,0.07),0 -1px 0 rgba(255,255,255,0.90) inset'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement
          el.style.transform = ''
          el.style.boxShadow = ''
        }}>

        {/* Left colour bar — exact from preview: absolute, top/bottom 10px */}
        <div className="absolute"
          style={{ left: 0, top: 10, bottom: 10, width: 4, borderRadius: '0 4px 4px 0', background: cat.bar, boxShadow: `0 0 6px ${cat.bar}50` }} />

        <div className="flex items-center gap-3 pl-2">
          {/* Category icon chip */}
          <div className="w-9 h-9 rounded-[11px] flex items-center justify-center flex-none"
            style={{ backgroundImage: cat.ibg, border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 4px rgba(0,0,0,0.09),0 -1px 0 rgba(255,255,255,0.55) inset' }}>
            <cat.Icon size={16} color={cat.icolor} strokeWidth={2} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm truncate" style={{ color: '#1A2B1C', lineHeight: 1.3 }}>
              {activity.title}
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                style={{ background: activity.child?.avatar_color ?? '#5A8C5E', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>
                {activity.child?.name}
              </span>
              {activity.time && (
                <span className="text-xs flex items-center gap-1 italic" style={{ color: 'rgba(26,43,28,0.45)' }}>
                  <Clock size={11} /> {activity.time.slice(0, 5)}
                </span>
              )}
              {(activity as any).location && (
                <span className="text-xs flex items-center gap-1 italic" style={{ color: 'rgba(26,43,28,0.40)' }}>
                  <MapPin size={10} /> {(activity as any).location}
                </span>
              )}
              <CategoryBadge category={activity.category} />
            </div>
          </div>

          {/* Deadline badge */}
          <span className="flex-none text-xs font-bold px-3 py-[5px] rounded-full"
            style={{ backgroundImage: dl.bg, color: dl.color, border: `1px solid ${dl.border}`, boxShadow: '0 2px 8px rgba(44,74,46,0.09),0 -1px 0 rgba(255,255,255,0.85) inset' }}>
            {dl.label}
          </span>
        </div>
      </div>
    </Link>
  )
}
