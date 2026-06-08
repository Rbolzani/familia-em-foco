'use client'
import Link from 'next/link'
import { BookOpen, HeartPulse, Star, Calendar, FileText, Baby, Sparkles, ChevronRight, Clock } from 'lucide-react'
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

const modules = [
  { href: '/escola',     label: 'Escola',          icon: BookOpen,   gradient: 'linear-gradient(135deg,#2563EB,#1D4ED8)', desc: 'Provas, tarefas, eventos' },
  { href: '/saude',      label: 'Saúde',            icon: HeartPulse, gradient: 'linear-gradient(135deg,#00C48C,#00A876)', desc: 'Consultas, vacinas'        },
  { href: '/atividades', label: 'Extracurricular',  icon: Star,       gradient: 'linear-gradient(135deg,#7C3AED,#6D28D9)', desc: 'Esportes, cursos, hobbies' },
  { href: '/calendario', label: 'Calendário',       icon: Calendar,   gradient: 'linear-gradient(135deg,#F5A623,#E09014)', desc: 'Agenda completa'           },
  { href: '/vault',      label: 'Documentos',       icon: FileText,   gradient: 'linear-gradient(135deg,#8B7A68,#6B5A48)', desc: 'Vault de documentos'       },
  { href: '/children',   label: 'Filhos',           icon: Baby,       gradient: 'linear-gradient(135deg,#F4522D,#D93D1A)', desc: 'Perfis dos filhos'         },
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
  const today = new Date(); today.setHours(0,0,0,0)
  const d = new Date(date + 'T00:00:00')
  const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000)
  if (diff < 0)  return { label: 'Atrasado', color: '#F4522D', bg: '#FFF0EB' }
  if (diff === 0) return { label: 'Hoje',    color: '#D97706', bg: '#FFF8E6' }
  if (diff <= 3)  return { label: `${diff}d`, color: '#D97706', bg: '#FFF8E6' }
  return { label: `${diff}d`, color: '#00A876', bg: '#E6FBF4' }
}

export default function DashboardClient({ userName, children, todayActivities, upcomingActivities }: Props) {
  const today = new Date().toISOString().split('T')[0]
  const pendentes = todayActivities.filter(a => a.status === 'pendente').length

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-7">

      {/* ── Greeting ───────────────────────────────────────── */}
      <div className="animate-fade-up pt-2">
        <p className="text-sm font-semibold uppercase tracking-widest mb-1"
          style={{ color: '#F4522D', letterSpacing: '.08em' }}>
          {greet()},
        </p>
        <h1 className="font-fraunces text-4xl font-bold leading-tight"
          style={{ color: '#0F1F3D' }}>
          {userName}! 👋
        </h1>
        <p className="text-sm mt-1.5 capitalize" style={{ color: '#8B7A68' }}>
          {fmtDay(today)}
        </p>
      </div>

      {/* ── Stats row ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger">
        {[
          { label: 'Filhos',     n: children.length,          color: '#F4522D', bg: '#FFF0EB', icon: '🧒' },
          { label: 'Hoje',       n: todayActivities.length,   color: '#2563EB', bg: '#EEF4FF', icon: '📅' },
          { label: 'Esta semana',n: upcomingActivities.length, color: '#7C3AED', bg: '#F3EEFF', icon: '📆' },
          { label: 'Pendentes',  n: pendentes,                 color: pendentes > 0 ? '#F4522D' : '#00A876',
            bg: pendentes > 0 ? '#FFF0EB' : '#E6FBF4', icon: pendentes > 0 ? '⚡' : '✅' },
        ].map((s, i) => (
          <div key={i}
            className="card card-lift p-4 animate-fade-up flex items-center gap-3"
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <span className="text-2xl w-10 h-10 flex items-center justify-center rounded-2xl flex-none"
              style={{ background: s.bg }}>
              {s.icon}
            </span>
            <div>
              <div className="text-2xl font-extrabold leading-none font-fraunces"
                style={{ color: s.color }}>
                {s.n}
              </div>
              <div className="text-xs font-semibold mt-0.5" style={{ color: '#8B7A68' }}>
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── No children onboarding ─────────────────────────── */}
      {children.length === 0 && (
        <div className="card p-8 text-center animate-fade-up"
          style={{ border: '2px dashed #EDE4D6' }}>
          <div className="text-5xl mb-4 animate-float">👶</div>
          <h2 className="font-fraunces text-xl font-bold mb-2" style={{ color: '#0F1F3D' }}>
            Cadastre seu primeiro filho
          </h2>
          <p className="text-sm mb-5" style={{ color: '#8B7A68' }}>
            Adicione os dados dos seus filhos para começar a organizar a rotina.
          </p>
          <Link href="/children">
            <button
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-white transition-all hover:brightness-105 active:scale-95"
              style={{ background: 'linear-gradient(135deg,#F4522D,#D93D1A)', boxShadow: '0 4px 16px rgba(244,82,45,.3)' }}
            >
              <Baby size={16} /> Adicionar filho
            </button>
          </Link>
        </div>
      )}

      {/* ── AI CTA ─────────────────────────────────────────── */}
      <div className="card animate-fade-up overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0F1F3D 0%, #1D3461 100%)', border: 'none' }}>
        <div className="p-5 flex items-center gap-4 relative">
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10"
            style={{ background: '#F4522D' }} />
          <div className="absolute -bottom-6 right-16 w-20 h-20 rounded-full opacity-10"
            style={{ background: '#F5A623' }} />

          <div
            className="w-13 h-13 rounded-2xl flex items-center justify-center flex-none relative"
            style={{
              background: 'linear-gradient(135deg, #F4522D, #F5A623)',
              boxShadow: '0 4px 20px rgba(244,82,45,.4)',
              width: 52, height: 52,
            }}
          >
            <Sparkles size={24} color="white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-fraunces text-lg font-bold text-white leading-tight">
              Adicionar com IA ✨
            </div>
            <div className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,.55)' }}>
              Foto da agenda ou texto — a IA extrai tudo automaticamente
            </div>
          </div>
          <Link href="/ia">
            <button
              className="flex-none px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:brightness-110 active:scale-95"
              style={{ background: '#F4522D', color: '#fff', boxShadow: '0 4px 14px rgba(244,82,45,.4)' }}
            >
              Usar IA
            </button>
          </Link>
        </div>
      </div>

      {/* ── Today's activities ─────────────────────────────── */}
      <div className="animate-fade-up">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-fraunces text-xl font-bold" style={{ color: '#0F1F3D' }}>
            Hoje
          </h2>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: '#FFF8E6', color: '#D97706' }}>
            {todayActivities.length} atividade{todayActivities.length !== 1 ? 's' : ''}
          </span>
        </div>

        {todayActivities.length === 0 ? (
          <div className="card p-6 text-center">
            <div className="text-3xl mb-2">🎉</div>
            <p className="text-sm font-medium" style={{ color: '#8B7A68' }}>
              Nenhuma atividade para hoje — aproveite!
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 stagger">
            {todayActivities.map((a, i) => (
              <ActivityRow key={a.id} activity={a} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* ── Upcoming ───────────────────────────────────────── */}
      {upcomingActivities.length > 0 && (
        <div className="animate-fade-up">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-fraunces text-xl font-bold" style={{ color: '#0F1F3D' }}>
              Próximos 7 dias
            </h2>
            <Link href="/calendario"
              className="text-xs font-bold flex items-center gap-1 transition-opacity hover:opacity-70"
              style={{ color: '#F4522D' }}>
              Ver agenda <ChevronRight size={13} />
            </Link>
          </div>
          <div className="space-y-2.5 stagger">
            {upcomingActivities.slice(0, 5).map((a, i) => (
              <ActivityRow key={a.id} activity={a} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* ── Modules grid ───────────────────────────────────── */}
      <div className="animate-fade-up">
        <h2 className="font-fraunces text-xl font-bold mb-4" style={{ color: '#0F1F3D' }}>
          Módulos
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 stagger">
          {modules.map((m) => (
            <Link key={m.href} href={m.href}>
              <div className="card card-lift cursor-pointer p-4 h-full">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-white mb-3"
                  style={{ background: m.gradient, boxShadow: '0 4px 12px rgba(0,0,0,.15)' }}
                >
                  <m.icon size={20} strokeWidth={2} />
                </div>
                <div className="font-bold text-sm leading-tight" style={{ color: '#0F1F3D' }}>
                  {m.label}
                </div>
                <div className="text-xs mt-1" style={{ color: '#8B7A68' }}>
                  {m.desc}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}

function ActivityRow({
  activity, index
}: {
  activity: Activity & { child: { name: string; avatar_color: string } }
  index: number
}) {
  const catColors = { escola: '#2563EB', saude: '#00C48C', extracurricular: '#7C3AED' }
  const barColor = catColors[activity.category] ?? '#8B7A68'
  const dl = deadlineLabel(activity.date)
  const href = { escola: '/escola', saude: '/saude', extracurricular: '/atividades' }[activity.category] ?? '/'

  return (
    <Link href={href}>
      <div
        className="card card-lift cursor-pointer animate-fade-up"
        style={{ animationDelay: `${index * 0.05}s`, padding: '14px 16px' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-1.5 self-stretch rounded-full flex-none" style={{ background: barColor }} />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate" style={{ color: '#1A1410' }}>
              {activity.title}
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                style={{ background: activity.child?.avatar_color ?? '#8B7A68' }}
              >
                {activity.child?.name}
              </span>
              {activity.time && (
                <span className="text-xs flex items-center gap-1" style={{ color: '#8B7A68' }}>
                  <Clock size={11} /> {activity.time.slice(0,5)}
                </span>
              )}
              <CategoryBadge category={activity.category} />
            </div>
          </div>
          <span
            className="flex-none text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: dl.bg, color: dl.color }}
          >
            {dl.label}
          </span>
        </div>
      </div>
    </Link>
  )
}
