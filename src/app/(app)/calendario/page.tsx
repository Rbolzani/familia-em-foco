'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Activity, Child } from '@/lib/types'
import { CategoryBadge } from '@/components/ui/Badge'
import { ChevronLeft, ChevronRight, Clock, MapPin, X, BookOpen, HeartPulse, Trophy, CalendarDays } from 'lucide-react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay,
  isToday, startOfWeek, endOfWeek, addMonths, subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ── Design tokens ──
const CAT_BAR: Record<string, string> = {
  escola:          '#2563EB',
  saude:           '#065F46',
  extracurricular: '#C49A6C',
}
const CAT_PILL_BG: Record<string, string> = {
  escola:          'rgba(37,99,235,0.80)',
  saude:           'rgba(6,95,70,0.80)',
  extracurricular: 'rgba(146,64,14,0.75)',
}
const CAT_ICO_BG: Record<string, string> = {
  escola:          'linear-gradient(140deg,#DBEAFE,#BFDBFE)',
  saude:           'linear-gradient(140deg,#D1FAE5,#A7F3D0)',
  extracurricular: 'linear-gradient(140deg,#FEF3C7,#FDE68A)',
}
const CAT_ICON: Record<string, React.ElementType> = {
  escola: BookOpen, saude: HeartPulse, extracurricular: Trophy,
}

export default function CalendarioPage() {
  const supabase = createClient()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [activities, setActivities]   = useState<Activity[]>([])
  const [children, setChildren]       = useState<Child[]>([])
  const [filterChild, setFilterChild] = useState('')
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [loading, setLoading]         = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const start = format(startOfMonth(currentDate), 'yyyy-MM-dd')
    const end   = format(endOfMonth(currentDate),   'yyyy-MM-dd')
    const [{ data: acts }, { data: kids }] = await Promise.all([
      supabase.from('activities')
        .select('*, child:children(name, avatar_color)')
        .gte('date', start).lte('date', end)
        .neq('status', 'cancelado')
        .order('time', { nullsFirst: false }),
      supabase.from('children').select('*').order('sort_order'),
    ])
    setActivities(acts ?? [])
    setChildren(kids ?? [])
    setLoading(false)
  }, [currentDate])

  useEffect(() => { load() }, [load])

  const filtered       = activities.filter(a => !filterChild || a.child_id === filterChild)
  const calStart       = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 })
  const calEnd         = endOfWeek(endOfMonth(currentDate),     { weekStartsOn: 0 })
  const days           = eachDayOfInterval({ start: calStart, end: calEnd })
  const actsForDay     = (day: Date) => filtered.filter(a => a.date === format(day, 'yyyy-MM-dd'))
  const selectedDayActs = selectedDay ? actsForDay(selectedDay) : []

  return (
    <div className="flex flex-col overflow-hidden"
      style={{ height: '100vh', background: '#F8F3EA' }}>

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-5 py-3.5 flex-shrink-0"
        style={{
          backgroundImage: 'linear-gradient(160deg,#FFFFFF 0%,#F8F3EA 100%)',
          borderBottom: '1px solid rgba(61,102,65,0.16)',
          boxShadow: '0 2px 8px rgba(44,74,46,0.07),0 -1px 0 rgba(255,255,255,0.85) inset',
        }}>

        <div className="flex items-center gap-3">
          {/* Month navigation */}
          <button onClick={() => setCurrentDate(d => subMonths(d, 1))}
            className="w-9 h-9 rounded-[12px] flex items-center justify-center transition-all hover:brightness-95 active:scale-95"
            style={{ backgroundImage: 'linear-gradient(160deg,#FFFFFF,#F2EAD8)', border: '1px solid rgba(61,102,65,0.18)', boxShadow: '0 1px 4px rgba(44,74,46,0.09),0 -1px 0 rgba(255,255,255,0.85) inset', color: '#3D6641' }}>
            <ChevronLeft size={16} />
          </button>

          <div>
            <h1 className="text-xl font-bold capitalize leading-tight"
              style={{ fontFamily: 'var(--font-lora)', color: '#1A2B1C', letterSpacing: '-0.01em' }}>
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </h1>
          </div>

          <button onClick={() => setCurrentDate(d => addMonths(d, 1))}
            className="w-9 h-9 rounded-[12px] flex items-center justify-center transition-all hover:brightness-95 active:scale-95"
            style={{ backgroundImage: 'linear-gradient(160deg,#FFFFFF,#F2EAD8)', border: '1px solid rgba(61,102,65,0.18)', boxShadow: '0 1px 4px rgba(44,74,46,0.09),0 -1px 0 rgba(255,255,255,0.85) inset', color: '#3D6641' }}>
            <ChevronRight size={16} />
          </button>

          <button onClick={() => { setCurrentDate(new Date()); setSelectedDay(new Date()) }}
            className="text-xs font-bold px-3.5 py-1.5 rounded-full transition-all hover:brightness-95 active:scale-95"
            style={{ background: 'rgba(61,102,65,0.10)', color: '#3D6641', border: '1px solid rgba(61,102,65,0.18)' }}>
            Hoje
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="hidden sm:flex gap-4">
            {([
              ['escola','#2563EB','Escola'],
              ['saude','#065F46','Saúde'],
              ['extracurricular','#92400E','Extracurricular'],
            ] as const).map(([, color, label]) => (
              <span key={label} className="flex items-center gap-1.5 text-xs font-semibold"
                style={{ color: 'rgba(26,43,28,0.50)' }}>
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: color, display: 'inline-block' }} />
                {label}
              </span>
            ))}
          </div>

          {/* Child filter */}
          {children.length > 0 && (
            <select value={filterChild} onChange={e => setFilterChild(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 rounded-[12px] outline-none cursor-pointer"
              style={{ backgroundImage: 'linear-gradient(160deg,#FFFFFF,#F2EAD8)', color: '#1A2B1C', border: '1px solid rgba(61,102,65,0.18)', boxShadow: '0 1px 4px rgba(44,74,46,0.08),0 -1px 0 rgba(255,255,255,0.80) inset' }}>
              <option value="">Todos os filhos</option>
              {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* ── Body: calendar + side panel ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Calendar */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Week-day header */}
          <div className="grid grid-cols-7 flex-shrink-0"
            style={{ borderBottom: '1px solid rgba(61,102,65,0.10)', backgroundImage: 'linear-gradient(160deg,#FFFFFF,#FAF5EC)' }}>
            {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => (
              <div key={d} className="text-center text-xs font-extrabold py-3 tracking-[0.06em] uppercase"
                style={{ color: 'rgba(26,43,28,0.38)' }}>{d}</div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 flex-1 overflow-hidden"
            style={{ gridAutoRows: '1fr' }}>
            {days.map((day, i) => {
              const isCurrentMonth = day.getMonth() === currentDate.getMonth()
              const dayActs   = actsForDay(day)
              const isSelected = selectedDay && isSameDay(day, selectedDay)
              const todayDay  = isToday(day)

              return (
                <div key={i}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className="flex flex-col p-1.5 cursor-pointer transition-all overflow-hidden"
                  style={{
                    borderBottom: '1px solid rgba(61,102,65,0.07)',
                    borderRight:  i % 7 !== 6 ? '1px solid rgba(61,102,65,0.07)' : 'none',
                    background: isSelected
                      ? 'rgba(61,102,65,0.08)'
                      : todayDay
                      ? 'rgba(61,102,65,0.03)'
                      : 'transparent',
                    opacity: isCurrentMonth ? 1 : 0.30,
                  }}
                >
                  {/* Day number */}
                  <div className="flex-shrink-0 mb-1">
                    <span className="text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full"
                      style={
                        todayDay
                          ? { backgroundImage: 'linear-gradient(140deg,#3D6641,#2C4A2E)', color: '#D4E8D5', boxShadow: '0 2px 8px rgba(44,74,46,0.30)' }
                          : isSelected
                          ? { background: 'rgba(61,102,65,0.15)', color: '#3D6641' }
                          : { color: '#1A2B1C' }
                      }>
                      {day.getDate()}
                    </span>
                  </div>

                  {/* Activity pills */}
                  <div className="flex flex-col gap-0.5 overflow-hidden flex-1">
                    {dayActs.slice(0, 3).map((a, ai) => (
                      <div key={ai}
                        className="text-white truncate font-semibold rounded-[6px] px-1.5 flex-shrink-0"
                        style={{
                          background: CAT_PILL_BG[a.category] ?? 'rgba(90,140,94,0.70)',
                          fontSize: 10,
                          paddingTop: 2,
                          paddingBottom: 2,
                          boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
                        }}
                        title={a.title}>
                        {a.title}
                      </div>
                    ))}
                    {dayActs.length > 3 && (
                      <div className="text-[10px] font-bold flex-shrink-0 italic"
                        style={{ color: 'rgba(26,43,28,0.40)' }}>
                        +{dayActs.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Side panel ── */}
        {selectedDay && (
          <div className="w-72 flex-shrink-0 flex flex-col overflow-hidden animate-fade-in"
            style={{
              borderLeft: '1px solid rgba(61,102,65,0.16)',
              backgroundImage: 'linear-gradient(160deg,#FFFFFF 0%,#F8F3EA 100%)',
              boxShadow: '-4px 0 20px rgba(44,74,46,0.07)',
            }}>

            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-4 flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(61,102,65,0.10)' }}>
              <div>
                <div className="text-xs font-extrabold uppercase tracking-[0.14em]" style={{ color: '#5A8C5E' }}>
                  {format(selectedDay, "EEEE", { locale: ptBR })}
                </div>
                <div className="text-lg font-bold capitalize mt-0.5" style={{ fontFamily: 'var(--font-lora)', color: '#1A2B1C' }}>
                  {format(selectedDay, "d 'de' MMMM", { locale: ptBR })}
                </div>
              </div>
              <button onClick={() => setSelectedDay(null)}
                className="w-7 h-7 rounded-[10px] flex items-center justify-center transition-all hover:bg-black/[0.05]"
                style={{ color: 'rgba(26,43,28,0.45)', background: 'rgba(61,102,65,0.07)', border: '1px solid rgba(61,102,65,0.14)', boxShadow: '0 1px 3px rgba(44,74,46,0.07),0 -1px 0 rgba(255,255,255,0.55) inset' }}>
                <X size={13} />
              </button>
            </div>

            {/* Activity count */}
            <div className="px-4 py-2.5 flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(61,102,65,0.07)' }}>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={selectedDayActs.length > 0
                  ? { background: 'rgba(61,102,65,0.10)', color: '#3D6641', border: '1px solid rgba(61,102,65,0.18)' }
                  : { background: 'rgba(26,43,28,0.04)', color: 'rgba(26,43,28,0.40)' }
                }>
                {selectedDayActs.length === 0
                  ? 'Nenhuma atividade'
                  : `${selectedDayActs.length} atividade${selectedDayActs.length !== 1 ? 's' : ''}`}
              </span>
            </div>

            {/* Activities list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {selectedDayActs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <div className="text-3xl mb-2">🌿</div>
                  <p className="text-sm italic" style={{ color: 'rgba(26,43,28,0.45)' }}>Dia livre!</p>
                </div>
              ) : (
                selectedDayActs.map((a, i) => {
                  const bar  = CAT_BAR[a.category] ?? '#5A8C5E'
                  const ibg  = CAT_ICO_BG[a.category] ?? 'rgba(61,102,65,0.08)'
                  const icol = CAT_BAR[a.category] ?? '#3D6641'
                  const Icon = CAT_ICON[a.category] ?? CalendarDays

                  return (
                    <div key={a.id}
                      className="rounded-[17px] p-3 flex items-start gap-2.5 animate-fade-up"
                      style={{
                        backgroundImage: 'linear-gradient(160deg,#FFFFFF 0%,#FAF5EC 100%)',
                        border: '1px solid rgba(61,102,65,0.16)',
                        boxShadow: '0 2px 8px rgba(44,74,46,0.08),0 -1px 0 rgba(255,255,255,0.85) inset',
                        animationDelay: `${i * 0.05}s`,
                      }}>
                      {/* Color bar */}
                      <div className="w-1 self-stretch rounded-full flex-none mt-0.5"
                        style={{ background: bar, boxShadow: `0 0 4px ${bar}50` }} />

                      {/* Icon chip */}
                      <div className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-none"
                        style={{ backgroundImage: ibg, border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 3px rgba(44,74,46,0.08),0 -1px 0 rgba(255,255,255,0.55) inset' }}>
                        <Icon size={14} color={icol} strokeWidth={2} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm leading-tight" style={{ color: '#1A2B1C' }}>
                          {a.title}
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {(a as any).child && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                              style={{ background: (a as any).child.avatar_color ?? '#5A8C5E', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>
                              {(a as any).child.name}
                            </span>
                          )}
                          {a.time && (
                            <span className="text-xs flex items-center gap-1 italic" style={{ color: 'rgba(26,43,28,0.45)' }}>
                              <Clock size={10} /> {a.time.slice(0, 5)}
                            </span>
                          )}
                        </div>
                        {a.location && (
                          <p className="text-xs flex items-center gap-1 mt-1 italic" style={{ color: 'rgba(26,43,28,0.40)' }}>
                            <MapPin size={10} /> {a.location}
                          </p>
                        )}
                        <div className="mt-1.5">
                          <CategoryBadge category={a.category} />
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
