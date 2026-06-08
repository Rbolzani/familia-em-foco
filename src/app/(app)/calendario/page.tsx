'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Activity, Child } from '@/lib/types'
import { CategoryBadge } from '@/components/ui/Badge'
import { ChevronLeft, ChevronRight, Clock, MapPin, X } from 'lucide-react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay,
  isToday, startOfWeek, endOfWeek, addMonths, subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

const CAT_COLORS = {
  escola:          '#3B82F6',
  saude:           '#4A9E5C',
  extracurricular: '#B45309',
}
const CAT_BG = {
  escola:          '#EFF6FF',
  saude:           '#F0FAF2',
  extracurricular: '#FFF8EC',
}
const CAT_PILL = {
  escola:          'rgba(59,130,246,0.85)',
  saude:           'rgba(74,158,92,0.85)',
  extracurricular: 'rgba(180,83,9,0.75)',
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

  const filtered = activities.filter(a => !filterChild || a.child_id === filterChild)
  const calStart  = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 })
  const calEnd    = endOfWeek(endOfMonth(currentDate),     { weekStartsOn: 0 })
  const days      = eachDayOfInterval({ start: calStart, end: calEnd })
  const actsForDay = (day: Date) => filtered.filter(a => a.date === format(day, 'yyyy-MM-dd'))
  const selectedDayActivities = selectedDay ? actsForDay(selectedDay) : []

  return (
    <div className="flex flex-col h-screen md:h-[calc(100vh)] overflow-hidden" style={{ background: '#F7F5FF' }}>

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(123,111,232,0.10)', background: '#FEFEFE' }}>

        <div className="flex items-center gap-4">
          {/* Navegação de mês */}
          <button onClick={() => setCurrentDate(d => subMonths(d, 1))}
            className="w-9 h-9 rounded-2xl flex items-center justify-center transition-all hover:scale-110"
            style={{ background: '#F0EEFF', color: '#7B6FE8' }}>
            <ChevronLeft size={18} />
          </button>

          <div>
            <h1 className="text-xl font-bold capitalize leading-tight"
              style={{ fontFamily: 'var(--font-gilda)', color: '#1A1535' }}>
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </h1>
          </div>

          <button onClick={() => setCurrentDate(d => addMonths(d, 1))}
            className="w-9 h-9 rounded-2xl flex items-center justify-center transition-all hover:scale-110"
            style={{ background: '#F0EEFF', color: '#7B6FE8' }}>
            <ChevronRight size={18} />
          </button>

          <button onClick={() => { setCurrentDate(new Date()); setSelectedDay(new Date()) }}
            className="text-xs font-bold px-3.5 py-1.5 rounded-full transition-all hover:brightness-95"
            style={{ background: '#E8E4FF', color: '#7B6FE8' }}>
            Hoje
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Legenda */}
          <div className="hidden sm:flex gap-3">
            {[['escola','Escola'],['saude','Saúde'],['extracurricular','Extracurricular']].map(([cat, label]) => (
              <span key={cat} className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#8585A8' }}>
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: CAT_COLORS[cat as keyof typeof CAT_COLORS], display: 'inline-block' }} />
                {label}
              </span>
            ))}
          </div>

          {/* Filtro filho */}
          {children.length > 0 && (
            <select value={filterChild} onChange={e => setFilterChild(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 rounded-2xl outline-none cursor-pointer"
              style={{ background: '#F7F5FF', color: '#1A1535', border: '1px solid rgba(123,111,232,0.15)' }}>
              <option value="">Todos os filhos</option>
              {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* ── Corpo: calendário + painel lateral ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Calendário */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Cabeçalho dias da semana */}
          <div className="grid grid-cols-7 flex-shrink-0"
            style={{ borderBottom: '1px solid rgba(123,111,232,0.08)', background: '#FEFEFE' }}>
            {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => (
              <div key={d} className="text-center text-xs font-bold py-3" style={{ color: '#8585A8' }}>{d}</div>
            ))}
          </div>

          {/* Grade de dias */}
          <div className="grid grid-cols-7 flex-1 overflow-hidden"
            style={{ gridAutoRows: '1fr' }}>
            {days.map((day, i) => {
              const isCurrentMonth = day.getMonth() === currentDate.getMonth()
              const dayActs  = actsForDay(day)
              const isSelected = selectedDay && isSameDay(day, selectedDay)
              const todayDay = isToday(day)

              return (
                <div key={i}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className="flex flex-col p-1.5 cursor-pointer transition-all overflow-hidden"
                  style={{
                    borderBottom: '1px solid rgba(123,111,232,0.07)',
                    borderRight: i % 7 !== 6 ? '1px solid rgba(123,111,232,0.07)' : 'none',
                    background: isSelected
                      ? 'rgba(123,111,232,0.07)'
                      : todayDay
                      ? 'rgba(123,111,232,0.03)'
                      : '#FEFEFE',
                    opacity: isCurrentMonth ? 1 : 0.38,
                  }}
                >
                  {/* Número do dia */}
                  <div className="flex-shrink-0 mb-1">
                    <span className="text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full"
                      style={
                        todayDay
                          ? { background: '#7B6FE8', color: '#fff' }
                          : isSelected
                          ? { background: '#E8E4FF', color: '#7B6FE8' }
                          : { color: '#1A1535' }
                      }>
                      {day.getDate()}
                    </span>
                  </div>

                  {/* Pills de atividades */}
                  <div className="flex flex-col gap-0.5 overflow-hidden flex-1">
                    {dayActs.slice(0, 3).map((a, ai) => (
                      <div key={ai}
                        className="text-white truncate font-semibold rounded-md px-1.5 leading-tight flex-shrink-0"
                        style={{
                          background: CAT_PILL[a.category] ?? 'rgba(133,133,168,0.7)',
                          fontSize: 10,
                          paddingTop: 2,
                          paddingBottom: 2,
                        }}
                        title={a.title}>
                        {a.title}
                      </div>
                    ))}
                    {dayActs.length > 3 && (
                      <div className="text-xs font-bold flex-shrink-0" style={{ color: '#8585A8', fontSize: 10 }}>
                        +{dayActs.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Painel lateral — dia selecionado ── */}
        {selectedDay && (
          <div className="w-72 flex-shrink-0 border-l flex flex-col overflow-hidden animate-fade-in"
            style={{ borderColor: 'rgba(123,111,232,0.10)', background: '#FEFEFE' }}>

            {/* Header do painel */}
            <div className="flex items-center justify-between px-4 py-4 flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(123,111,232,0.08)' }}>
              <div>
                <div className="text-xs font-bold uppercase tracking-widest" style={{ color: '#7B6FE8' }}>
                  {format(selectedDay, "EEEE", { locale: ptBR })}
                </div>
                <div className="text-lg font-bold capitalize" style={{ fontFamily: 'var(--font-gilda)', color: '#1A1535' }}>
                  {format(selectedDay, "d 'de' MMMM", { locale: ptBR })}
                </div>
              </div>
              <button onClick={() => setSelectedDay(null)}
                className="w-7 h-7 rounded-xl flex items-center justify-center transition-all hover:bg-lavender"
                style={{ color: '#8585A8', background: 'rgba(123,111,232,0.06)' }}>
                <X size={14} />
              </button>
            </div>

            {/* Contagem */}
            <div className="px-4 py-2.5 flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(123,111,232,0.06)' }}>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: selectedDayActivities.length > 0 ? '#E8E4FF' : '#F7F5FF', color: selectedDayActivities.length > 0 ? '#7B6FE8' : '#8585A8' }}>
                {selectedDayActivities.length === 0
                  ? 'Nenhuma atividade'
                  : `${selectedDayActivities.length} atividade${selectedDayActivities.length !== 1 ? 's' : ''}`}
              </span>
            </div>

            {/* Lista de atividades */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {selectedDayActivities.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <div className="text-3xl mb-2">🌤</div>
                  <p className="text-sm" style={{ color: '#8585A8' }}>Dia livre!</p>
                </div>
              ) : (
                selectedDayActivities.map((a, i) => {
                  const color = CAT_COLORS[a.category] ?? '#8585A8'
                  return (
                    <div key={a.id}
                      className="rounded-2xl p-3 flex items-start gap-2.5 animate-fade-up"
                      style={{ background: CAT_BG[a.category] ?? '#F7F5FF', animationDelay: `${i * 0.05}s` }}>
                      <div className="w-1 self-stretch rounded-full flex-none mt-1" style={{ background: color }} />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm leading-tight" style={{ color: '#1A1535' }}>
                          {a.title}
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {(a as any).child && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                              style={{ background: (a as any).child.avatar_color ?? '#8585A8' }}>
                              {(a as any).child.name}
                            </span>
                          )}
                          {a.time && (
                            <span className="text-xs flex items-center gap-1" style={{ color: '#8585A8' }}>
                              <Clock size={10} /> {a.time.slice(0, 5)}
                            </span>
                          )}
                        </div>
                        {a.location && (
                          <p className="text-xs flex items-center gap-1 mt-1" style={{ color: '#8585A8' }}>
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
