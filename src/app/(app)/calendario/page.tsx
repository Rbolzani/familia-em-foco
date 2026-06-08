'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Activity, Child } from '@/lib/types'
import { CategoryBadge } from '@/components/ui/Badge'
import { ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay,
  isToday, startOfWeek, endOfWeek, addMonths, subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

const CAT_COLORS = {
  escola: '#2563EB',
  saude: '#00C48C',
  extracurricular: '#7C3AED',
}
const CAT_BG = {
  escola: '#EEF4FF',
  saude: '#E6FBF4',
  extracurricular: '#F3EEFF',
}

export default function CalendarioPage() {
  const supabase = createClient()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [activities, setActivities] = useState<Activity[]>([])
  const [children, setChildren] = useState<Child[]>([])
  const [filterChild, setFilterChild] = useState('')
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
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

  const filtered = activities.filter(a => !filterChild || a.child_id === filterChild)

  const calStart = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 })
  const calEnd   = endOfWeek(endOfMonth(currentDate),     { weekStartsOn: 0 })
  const days     = eachDayOfInterval({ start: calStart, end: calEnd })

  const actsForDay = (day: Date) => filtered.filter(a => a.date === format(day, 'yyyy-MM-dd'))
  const selectedDayActivities = selectedDay ? actsForDay(selectedDay) : []

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between animate-fade-up">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: '#F5A623' }}>
            📅 Agenda
          </p>
          <h1 className="font-fraunces text-3xl font-bold" style={{ color: '#0F1F3D' }}>Calendário</h1>
          <p className="text-sm mt-0.5 capitalize" style={{ color: '#8B7A68' }}>
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </p>
        </div>
        {children.length > 0 && (
          <select
            value={filterChild}
            onChange={e => setFilterChild(e.target.value)}
            className="input-field text-sm"
            style={{ width: 'auto' }}
          >
            <option value="">Todos os filhos</option>
            {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
      </div>

      {/* Calendar card */}
      <div className="card animate-fade-up overflow-hidden" style={{ padding: 0 }}>
        {/* Month nav */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid #F5EDE0' }}>
          <button
            onClick={() => setCurrentDate(d => subMonths(d, 1))}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
            style={{ background: '#F9F5F0', color: '#0F1F3D' }}
          >
            <ChevronLeft size={17} />
          </button>
          <h2 className="font-fraunces text-xl font-bold capitalize" style={{ color: '#0F1F3D' }}>
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          <button
            onClick={() => setCurrentDate(d => addMonths(d, 1))}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
            style={{ background: '#F9F5F0', color: '#0F1F3D' }}
          >
            <ChevronRight size={17} />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7" style={{ borderBottom: '1px solid #F5EDE0' }}>
          {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => (
            <div key={d} className="text-center text-xs font-bold py-2.5" style={{ color: '#8B7A68' }}>{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7" style={{ background: '#FDF8F2' }}>
          {days.map((day, i) => {
            const isCurrentMonth = day.getMonth() === currentDate.getMonth()
            const dayActs = actsForDay(day)
            const isSelected = selectedDay && isSameDay(day, selectedDay)
            const today = isToday(day)

            return (
              <div
                key={i}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className="min-h-[72px] p-1.5 cursor-pointer transition-all"
                style={{
                  borderBottom: '1px solid #F5EDE0',
                  borderRight: i % 7 !== 6 ? '1px solid #F5EDE0' : 'none',
                  background: isSelected
                    ? '#FFF0EB'
                    : today
                    ? '#FFFBF7'
                    : isCurrentMonth ? '#FDF8F2' : '#F9F5F0',
                  opacity: isCurrentMonth ? 1 : .45,
                }}
              >
                <div
                  className="text-xs font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full"
                  style={
                    today
                      ? { background: '#F4522D', color: '#fff' }
                      : isSelected
                      ? { background: '#FDD5C9', color: '#F4522D' }
                      : { color: '#0F1F3D' }
                  }
                >
                  {day.getDate()}
                </div>
                <div className="space-y-0.5">
                  {dayActs.slice(0, 2).map((a, ai) => (
                    <div
                      key={ai}
                      className="text-xs px-1.5 py-0.5 rounded-md text-white truncate font-semibold"
                      style={{ background: CAT_COLORS[a.category] ?? '#8B7A68', fontSize: 10 }}
                      title={a.title}
                    >
                      {a.title}
                    </div>
                  ))}
                  {dayActs.length > 2 && (
                    <div className="text-xs font-bold" style={{ color: '#8B7A68', fontSize: 10 }}>
                      +{dayActs.length - 2} mais
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 flex-wrap animate-fade-up">
        {Object.entries(CAT_COLORS).map(([cat, color]) => (
          <span key={cat} className="flex items-center gap-1.5 text-xs font-semibold capitalize" style={{ color: '#8B7A68' }}>
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: color }} />
            {cat === 'extracurricular' ? 'Extracurricular' : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </span>
        ))}
        <button
          onClick={() => setCurrentDate(new Date())}
          className="ml-auto text-xs font-bold px-3 py-1 rounded-full transition-all hover:opacity-80"
          style={{ background: '#FFF0EB', color: '#F4522D' }}
        >
          Hoje
        </button>
      </div>

      {/* Selected day */}
      {selectedDay && (
        <div className="animate-fade-up">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-fraunces text-lg font-bold capitalize" style={{ color: '#0F1F3D' }}>
              {format(selectedDay, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </h3>
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: '#FFF8E6', color: '#D97706' }}
            >
              {selectedDayActivities.length} atividade{selectedDayActivities.length !== 1 ? 's' : ''}
            </span>
          </div>

          {selectedDayActivities.length === 0 ? (
            <div className="card p-5 text-center">
              <div className="text-2xl mb-2">🌤</div>
              <p className="text-sm" style={{ color: '#8B7A68' }}>
                Nenhuma atividade neste dia
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 stagger">
              {selectedDayActivities.map((a, i) => {
                const color = CAT_COLORS[a.category] ?? '#8B7A68'
                const bg = CAT_BG[a.category] ?? '#F5F0EB'
                return (
                  <div
                    key={a.id}
                    className="card card-lift animate-fade-up flex items-start gap-3 p-4"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <div className="w-1.5 self-stretch rounded-full flex-none" style={{ background: color }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm" style={{ color: '#0F1F3D' }}>{a.title}</div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {(a as any).child && (
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                            style={{ background: (a as any).child.avatar_color }}
                          >
                            {(a as any).child.name}
                          </span>
                        )}
                        {a.time && (
                          <span className="text-xs flex items-center gap-1" style={{ color: '#8B7A68' }}>
                            <Clock size={11} /> {a.time.slice(0,5)}
                          </span>
                        )}
                        <CategoryBadge category={a.category} />
                      </div>
                      {a.location && (
                        <p className="text-xs flex items-center gap-1 mt-1" style={{ color: '#8B7A68' }}>
                          <MapPin size={11} /> {a.location}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
