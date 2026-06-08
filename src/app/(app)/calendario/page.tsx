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

// ── Design tokens ──────────────────────────────────────────────────────────
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

// ── Activity detail card (shared between bottom sheet and desktop panel) ──
function ActivityDetailCard({ a, i }: { a: Activity & { child?: { name: string; avatar_color: string } }, i: number }) {
  const bar  = CAT_BAR[a.category]  ?? '#5A8C5E'
  const ibg  = CAT_ICO_BG[a.category] ?? 'rgba(61,102,65,0.08)'
  const icol = CAT_BAR[a.category]  ?? '#3D6641'
  const Icon = CAT_ICON[a.category] ?? CalendarDays

  return (
    <div className="rounded-[17px] p-3 flex items-start gap-2.5 animate-fade-up"
      style={{
        backgroundImage: 'linear-gradient(160deg,#FFFFFF 0%,#FAF5EC 100%)',
        border: '1px solid rgba(61,102,65,0.16)',
        boxShadow: '0 2px 8px rgba(44,74,46,0.08),0 -1px 0 rgba(255,255,255,0.85) inset',
        animationDelay: `${i * 0.05}s`,
      }}>
      <div className="w-1 self-stretch rounded-full flex-none mt-0.5"
        style={{ background: bar, boxShadow: `0 0 4px ${bar}50` }} />
      <div className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-none"
        style={{ backgroundImage: ibg, border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 3px rgba(44,74,46,0.08),0 -1px 0 rgba(255,255,255,0.55) inset' }}>
        <Icon size={14} color={icol} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm leading-tight truncate" style={{ color: '#1A2B1C' }}>{a.title}</div>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {a.child && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
              style={{ background: a.child.avatar_color ?? '#5A8C5E', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>
              {a.child.name}
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

  const filtered        = activities.filter(a => !filterChild || a.child_id === filterChild)
  const calStart        = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 })
  const calEnd          = endOfWeek(endOfMonth(currentDate),     { weekStartsOn: 0 })
  const days            = eachDayOfInterval({ start: calStart, end: calEnd })
  const actsForDay      = (day: Date) => filtered.filter(a => a.date === format(day, 'yyyy-MM-dd'))
  const selectedDayActs = (selectedDay ? actsForDay(selectedDay) : []) as (Activity & { child?: { name: string; avatar_color: string } })[]

  const closeSheet = () => setSelectedDay(null)

  // ── Day grid cell ────────────────────────────────────────────────────────
  function DayCell({ day, index }: { day: Date; index: number }) {
    const isCurrentMonth = day.getMonth() === currentDate.getMonth()
    const dayActs   = actsForDay(day)
    const isSelected = selectedDay ? isSameDay(day, selectedDay) : false
    const todayDay  = isToday(day)

    return (
      <div
        onClick={() => setSelectedDay(isSelected ? null : day)}
        className="flex flex-col cursor-pointer transition-all overflow-hidden"
        style={{
          padding: '6px 4px 4px',
          borderBottom: '1px solid rgba(61,102,65,0.07)',
          borderRight:  index % 7 !== 6 ? '1px solid rgba(61,102,65,0.07)' : 'none',
          background: isSelected
            ? 'rgba(61,102,65,0.08)'
            : todayDay
            ? 'rgba(61,102,65,0.03)'
            : 'transparent',
          opacity: isCurrentMonth ? 1 : 0.28,
          minHeight: 0,
        }}>
        {/* Day number */}
        <div className="flex-shrink-0 mb-0.5">
          <span className="text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full"
            style={
              todayDay
                ? { backgroundImage: 'linear-gradient(140deg,#3D6641,#2C4A2E)', color: '#D4E8D5', boxShadow: '0 2px 8px rgba(44,74,46,0.30)', fontSize: 10 }
                : isSelected
                ? { background: 'rgba(61,102,65,0.15)', color: '#3D6641' }
                : { color: '#1A2B1C' }
            }>
            {day.getDate()}
          </span>
        </div>
        {/* Event dots / pills */}
        <div className="flex flex-col gap-0.5 overflow-hidden flex-1">
          {dayActs.slice(0, 2).map((a, ai) => (
            <div key={ai}
              className="truncate font-semibold rounded-[5px] px-1 flex-shrink-0 hidden sm:block"
              style={{
                background: CAT_PILL_BG[a.category] ?? 'rgba(90,140,94,0.70)',
                color: '#fff',
                fontSize: 9,
                paddingTop: 2,
                paddingBottom: 2,
                boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
              }}>
              {a.title}
            </div>
          ))}
          {/* On mobile: just dots */}
          {dayActs.length > 0 && (
            <div className="flex gap-0.5 flex-wrap sm:hidden mt-0.5">
              {dayActs.slice(0, 3).map((a, ai) => (
                <span key={ai} className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: CAT_BAR[a.category] ?? '#5A8C5E' }} />
              ))}
            </div>
          )}
          {dayActs.length > 2 && (
            <div className="text-[9px] font-bold flex-shrink-0 italic hidden sm:block"
              style={{ color: 'rgba(26,43,28,0.40)' }}>
              +{dayActs.length - 2}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Day detail panel content ─────────────────────────────────────────────
  function DayDetail({ onClose }: { onClose: () => void }) {
    if (!selectedDay) return null
    return (
      <>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(61,102,65,0.10)' }}>
          <div>
            <div className="text-xs font-extrabold uppercase tracking-[0.14em]" style={{ color: '#5A8C5E' }}>
              {format(selectedDay, "EEEE", { locale: ptBR })}
            </div>
            <div className="text-lg font-bold capitalize mt-0.5"
              style={{ fontFamily: 'var(--font-lora)', color: '#1A2B1C' }}>
              {format(selectedDay, "d 'de' MMMM", { locale: ptBR })}
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-[10px] flex items-center justify-center transition-all hover:bg-black/[0.05]"
            style={{ color: 'rgba(26,43,28,0.45)', background: 'rgba(61,102,65,0.07)', border: '1px solid rgba(61,102,65,0.14)', boxShadow: '0 1px 3px rgba(44,74,46,0.07),0 -1px 0 rgba(255,255,255,0.55) inset' }}>
            <X size={14} />
          </button>
        </div>

        {/* Count */}
        <div className="px-5 py-2.5 flex-shrink-0" style={{ borderBottom: '1px solid rgba(61,102,65,0.07)' }}>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={selectedDayActs.length > 0
              ? { background: 'rgba(61,102,65,0.10)', color: '#3D6641', border: '1px solid rgba(61,102,65,0.18)' }
              : { background: 'rgba(26,43,28,0.04)', color: 'rgba(26,43,28,0.40)' }
            }>
            {selectedDayActs.length === 0
              ? 'Dia livre 🌿'
              : `${selectedDayActs.length} atividade${selectedDayActs.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {selectedDayActs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-24 text-center">
              <p className="text-sm italic" style={{ color: 'rgba(26,43,28,0.40)' }}>Nenhuma atividade neste dia.</p>
            </div>
          ) : (
            selectedDayActs.map((a, i) => <ActivityDetailCard key={a.id} a={a} i={i} />)
          )}
        </div>
      </>
    )
  }

  return (
    // flex-col fills the main area; no fixed height so mobile topbar + bottom nav are respected
    <div className="flex flex-col" style={{ height: '100%', minHeight: 0, background: '#F8F3EA' }}>

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{
          backgroundImage: 'linear-gradient(160deg,#FFFFFF 0%,#F8F3EA 100%)',
          borderBottom: '1px solid rgba(61,102,65,0.16)',
          boxShadow: '0 2px 8px rgba(44,74,46,0.07),0 -1px 0 rgba(255,255,255,0.85) inset',
        }}>

        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentDate(d => subMonths(d, 1))}
            className="w-8 h-8 rounded-[11px] flex items-center justify-center transition-all hover:brightness-95 active:scale-95"
            style={{ backgroundImage: 'linear-gradient(160deg,#FFFFFF,#F2EAD8)', border: '1px solid rgba(61,102,65,0.18)', boxShadow: '0 1px 4px rgba(44,74,46,0.09),0 -1px 0 rgba(255,255,255,0.85) inset', color: '#3D6641' }}>
            <ChevronLeft size={15} />
          </button>

          <h1 className="text-[17px] font-bold capitalize leading-tight"
            style={{ fontFamily: 'var(--font-lora)', color: '#1A2B1C', letterSpacing: '-0.01em', minWidth: 130, textAlign:'center' }}>
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </h1>

          <button onClick={() => setCurrentDate(d => addMonths(d, 1))}
            className="w-8 h-8 rounded-[11px] flex items-center justify-center transition-all hover:brightness-95 active:scale-95"
            style={{ backgroundImage: 'linear-gradient(160deg,#FFFFFF,#F2EAD8)', border: '1px solid rgba(61,102,65,0.18)', boxShadow: '0 1px 4px rgba(44,74,46,0.09),0 -1px 0 rgba(255,255,255,0.85) inset', color: '#3D6641' }}>
            <ChevronRight size={15} />
          </button>

          <button onClick={() => { setCurrentDate(new Date()); setSelectedDay(new Date()) }}
            className="text-xs font-bold px-3 py-1 rounded-full transition-all hover:brightness-95 active:scale-95 ml-1"
            style={{ background: 'rgba(61,102,65,0.10)', color: '#3D6641', border: '1px solid rgba(61,102,65,0.18)' }}>
            Hoje
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Legend — desktop only */}
          <div className="hidden lg:flex gap-3">
            {(['escola','saude','extracurricular'] as const).map(k => (
              <span key={k} className="flex items-center gap-1.5 text-xs font-semibold"
                style={{ color: 'rgba(26,43,28,0.50)' }}>
                <span className="w-2 h-2 rounded-sm inline-block" style={{ background: CAT_BAR[k] }} />
                {k === 'escola' ? 'Escola' : k === 'saude' ? 'Saúde' : 'Extracurr.'}
              </span>
            ))}
          </div>
          {/* Child filter */}
          {children.length > 0 && (
            <select value={filterChild} onChange={e => setFilterChild(e.target.value)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-[11px] outline-none cursor-pointer"
              style={{ backgroundImage: 'linear-gradient(160deg,#FFFFFF,#F2EAD8)', color: '#1A2B1C', border: '1px solid rgba(61,102,65,0.18)', boxShadow: '0 1px 4px rgba(44,74,46,0.08),0 -1px 0 rgba(255,255,255,0.80) inset', maxWidth: 110 }}>
              <option value="">Todos</option>
              {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Calendar grid */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Weekday headers */}
          <div className="grid grid-cols-7 flex-shrink-0"
            style={{ borderBottom: '1px solid rgba(61,102,65,0.10)', backgroundImage: 'linear-gradient(160deg,#FFFFFF,#FAF5EC)' }}>
            {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => (
              <div key={d} className="text-center text-[10px] font-extrabold py-2.5 tracking-[0.06em] uppercase"
                style={{ color: 'rgba(26,43,28,0.38)' }}>{d}</div>
            ))}
          </div>

          {/* Day cells — fill remaining height */}
          <div className="grid grid-cols-7 flex-1 overflow-hidden"
            style={{ gridAutoRows: '1fr' }}>
            {days.map((day, i) => <DayCell key={i} day={day} index={i} />)}
          </div>
        </div>

        {/* ── Desktop side panel (lg+) ── */}
        {selectedDay && (
          <div className="hidden lg:flex w-72 flex-shrink-0 flex-col overflow-hidden animate-fade-in"
            style={{
              borderLeft: '1px solid rgba(61,102,65,0.16)',
              backgroundImage: 'linear-gradient(160deg,#FFFFFF 0%,#F8F3EA 100%)',
              boxShadow: '-4px 0 20px rgba(44,74,46,0.07)',
            }}>
            <DayDetail onClose={closeSheet} />
          </div>
        )}
      </div>

      {/* ── Mobile bottom sheet ── */}
      {/* Sits in the DOM flow outside the calendar flex, fixed to viewport bottom */}
      {selectedDay && (
        <>
          {/* Scrim */}
          <div
            className="lg:hidden fixed inset-0 z-[60]"
            style={{ background: 'rgba(15,31,17,0.45)', backdropFilter: 'blur(2px)' }}
            onClick={closeSheet}
          />
          {/* Sheet */}
          <div
            className="lg:hidden fixed left-0 right-0 z-[70] flex flex-col animate-slide-up"
            style={{
              bottom: 58, /* sits above the bottom nav bar */
              maxHeight: '65vh',
              borderRadius: '20px 20px 0 0',
              backgroundImage: 'linear-gradient(180deg,#FFFFFF 0%,#F8F3EA 100%)',
              border: '1px solid rgba(61,102,65,0.18)',
              boxShadow: '0 -8px 32px rgba(44,74,46,0.18)',
              overflow: 'hidden',
            }}>
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(61,102,65,0.25)' }} />
            </div>
            <DayDetail onClose={closeSheet} />
          </div>
        </>
      )}
    </div>
  )
}
