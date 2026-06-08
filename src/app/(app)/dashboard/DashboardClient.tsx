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
  { href: '/escola',     label: 'Escola',         icon: BookOpen,   gradient: 'linear-gradient(135deg,#93C5FD,#3B82F6)', bg: '#EFF6FF', desc: 'Provas, tarefas, eventos' },
  { href: '/saude',      label: 'Saúde',           icon: HeartPulse, gradient: 'linear-gradient(135deg,#A8DDB5,#34A85A)', bg: '#F0FAF2', desc: 'Consultas, vacinas'        },
  { href: '/atividades', label: 'Extracurricular', icon: Star,       gradient: 'linear-gradient(135deg,#FFE4A0,#F59E0B)', bg: '#FFF8EC', desc: 'Esportes, cursos, hobbies' },
  { href: '/calendario', label: 'Calendário',      icon: Calendar,   gradient: 'linear-gradient(135deg,#C084FC,#7B6FE8)', bg: '#F5F0FF', desc: 'Agenda completa'           },
  { href: '/vault',      label: 'Documentos',      icon: FileText,   gradient: 'linear-gradient(135deg,#B0AFCC,#8585A8)', bg: '#F0F0F8', desc: 'Vault de documentos'       },
  { href: '/children',   label: 'Filhos',          icon: Baby,       gradient: 'linear-gradient(135deg,#F4A7B9,#E07A9A)', bg: '#FFF0F4', desc: 'Perfis dos filhos'         },
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
  if (diff < 0)   return { label: 'Atrasado', color: '#C0405A', bg: '#FFF0F4' }
  if (diff === 0)  return { label: 'Hoje',    color: '#B45309', bg: '#FFF8EC' }
  if (diff <= 3)   return { label: `${diff}d`, color: '#B45309', bg: '#FFF8EC' }
  return { label: `${diff}d`, color: '#4A9E5C', bg: '#F0FAF2' }
}

export default function DashboardClient({ userName, children, todayActivities, upcomingActivities }: Props) {
  const today = new Date().toISOString().split('T')[0]
  const pendentes = todayActivities.filter(a => a.status === 'pendente').length

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

      {/* ── Greeting ── */}
      <div className="animate-fade-up pt-2">
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#7B6FE8' }}>
          {greet()},
        </p>
        <h1 className="text-4xl font-bold leading-tight" style={{ fontFamily: 'var(--font-gilda)', color: '#1A1535' }}>
          {userName}! 👋
        </h1>
        <p className="text-sm mt-1.5 capitalize" style={{ color: '#8585A8' }}>
          {fmtDay(today)}
        </p>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger">
        {[
          { label: 'Filhos',      n: children.length,           color: '#7B6FE8', bg: '#E8E4FF', icon: '🧒' },
          { label: 'Hoje',        n: todayActivities.length,    color: '#3B82F6', bg: '#EFF6FF', icon: '📅' },
          { label: 'Esta semana', n: upcomingActivities.length,  color: '#C084FC', bg: '#F5F0FF', icon: '📆' },
          { label: 'Pendentes',   n: pendentes,
            color: pendentes > 0 ? '#C0405A' : '#4A9E5C',
            bg:    pendentes > 0 ? '#FFF0F4' : '#F0FAF2',
            icon:  pendentes > 0 ? '⚡' : '✅' },
        ].map((s, i) => (
          <div key={i}
            className="card card-lift p-4 animate-fade-up flex items-center gap-3"
            style={{ animationDelay: `${i * 0.06}s` }}>
            <span className="text-2xl w-10 h-10 flex items-center justify-center rounded-2xl flex-none"
              style={{ background: s.bg }}>
              {s.icon}
            </span>
            <div>
              <div className="text-2xl font-extrabold leading-none" style={{ fontFamily: 'var(--font-gilda)', color: s.color }}>
                {s.n}
              </div>
              <div className="text-xs font-semibold mt-0.5" style={{ color: '#8585A8' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── No children onboarding ── */}
      {children.length === 0 && (
        <div className="card p-8 text-center animate-fade-up"
          style={{ border: '2px dashed rgba(123,111,232,0.20)' }}>
          <div className="text-5xl mb-4 animate-float">👶</div>
          <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-gilda)', color: '#1A1535' }}>
            Cadastre seu primeiro filho
          </h2>
          <p className="text-sm mb-5" style={{ color: '#8585A8' }}>
            Adicione os dados dos seus filhos para começar a organizar a rotina.
          </p>
          <Link href="/children">
            <button className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-white transition-all hover:brightness-105 active:scale-95"
              style={{ background: 'linear-gradient(135deg,#7B6FE8,#C084FC)', boxShadow: '0 4px 16px rgba(123,111,232,0.30)' }}>
              <Baby size={16} /> Adicionar filho
            </button>
          </Link>
        </div>
      )}

      {/* ── AI CTA ── */}
      <div className="card animate-fade-up overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #7B6FE8 0%, #C084FC 100%)', border: 'none' }}>
        <div className="p-5 flex items-center gap-4 relative">
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20"
            style={{ background: 'white' }} />
          <div className="absolute -bottom-6 right-16 w-20 h-20 rounded-full opacity-10"
            style={{ background: 'white' }} />
          <div className="w-13 h-13 rounded-2xl flex items-center justify-center flex-none relative bg-white/20"
            style={{ width: 52, height: 52 }}>
            <Sparkles size={24} color="white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-lg font-bold text-white leading-tight" style={{ fontFamily: 'var(--font-gilda)' }}>
              Adicionar com IA ✨
            </div>
            <div className="text-sm mt-0.5 text-white/65">
              Foto da agenda ou texto — a IA extrai tudo automaticamente
            </div>
          </div>
          <Link href="/ia">
            <button className="flex-none px-4 py-2.5 rounded-2xl text-sm font-bold transition-all hover:brightness-110 active:scale-95 bg-white"
              style={{ color: '#7B6FE8' }}>
              Usar IA
            </button>
          </Link>
        </div>
      </div>

      {/* ── Today ── */}
      <div className="animate-fade-up">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-gilda)', color: '#1A1535' }}>Hoje</h2>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: '#FFF8EC', color: '#B45309' }}>
            {todayActivities.length} atividade{todayActivities.length !== 1 ? 's' : ''}
          </span>
        </div>
        {todayActivities.length === 0 ? (
          <div className="card p-6 text-center">
            <div className="text-3xl mb-2">🎉</div>
            <p className="text-sm font-medium" style={{ color: '#8585A8' }}>
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

      {/* ── Upcoming ── */}
      {upcomingActivities.length > 0 && (
        <div className="animate-fade-up">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-gilda)', color: '#1A1535' }}>
              Próximos 7 dias
            </h2>
            <Link href="/calendario"
              className="text-xs font-bold flex items-center gap-1 transition-opacity hover:opacity-70"
              style={{ color: '#7B6FE8' }}>
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

      {/* ── Modules grid ── */}
      <div className="animate-fade-up">
        <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'var(--font-gilda)', color: '#1A1535' }}>
          Módulos
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 stagger">
          {modules.map((m) => (
            <Link key={m.href} href={m.href}>
              <div className="card card-lift cursor-pointer p-4 h-full">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white mb-3"
                  style={{ background: m.gradient, boxShadow: '0 4px 12px rgba(0,0,0,.10)' }}>
                  <m.icon size={20} strokeWidth={2} />
                </div>
                <div className="font-bold text-sm leading-tight" style={{ color: '#1A1535' }}>{m.label}</div>
                <div className="text-xs mt-1" style={{ color: '#8585A8' }}>{m.desc}</div>
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
  const catColors: Record<string, string> = {
    escola: '#93C5FD',
    saude: '#A8DDB5',
    extracurricular: '#FFE4A0',
  }
  const barColor = catColors[activity.category] ?? '#C0BFD5'
  const dl = deadlineLabel(activity.date)
  const href = { escola: '/escola', saude: '/saude', extracurricular: '/atividades' }[activity.category] ?? '/'

  return (
    <Link href={href}>
      <div className="card card-lift cursor-pointer animate-fade-up"
        style={{ animationDelay: `${index * 0.05}s`, padding: '14px 16px' }}>
        <div className="flex items-center gap-3">
          <div className="w-1.5 self-stretch rounded-full flex-none" style={{ background: barColor }} />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate" style={{ color: '#1A1535' }}>
              {activity.title}
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                style={{ background: activity.child?.avatar_color ?? '#8585A8' }}>
                {activity.child?.name}
              </span>
              {activity.time && (
                <span className="text-xs flex items-center gap-1" style={{ color: '#8585A8' }}>
                  <Clock size={11} /> {activity.time.slice(0,5)}
                </span>
              )}
              <CategoryBadge category={activity.category} />
            </div>
          </div>
          <span className="flex-none text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: dl.bg, color: dl.color }}>
            {dl.label}
          </span>
        </div>
      </div>
    </Link>
  )
}
