'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Activity, Child } from '@/lib/types'
import { CategoryBadge } from '@/components/ui/Badge'
import { ChevronLeft, ChevronRight, Clock, MapPin, X, BookOpen, HeartPulse, Trophy, CalendarDays } from 'lucide-react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay,
  isToday, startOfWeek, endOfWeek, addMonths, subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

const CAT_BAR: Record<string, string> = {
  escola: '#2563EB', saude: '#065F46', extracurricular: '#C49A6C',
}
const CAT_PILL_BG: Record<string, string> = {
  escola: 'rgba(37,99,235,0.82)', saude: 'rgba(6,95,70,0.82)', extracurricular: 'rgba(146,64,14,0.80)',
}
const CAT_ICO_BG: Record<string, string> = {
  escola: 'linear-gradient(140deg,#DBEAFE,#BFDBFE)',
  saude:  'linear-gradient(140deg,#D1FAE5,#A7F3D0)',
  extracurricular: 'linear-gradient(140deg,#FEF3C7,#FDE68A)',
}
const CAT_ICON: Record<string, React.ElementType> = {
  escola: BookOpen, saude: HeartPulse, extracurricular: Trophy,
}
const LEGEND = [
  { key:'escola',          color:'#2563EB', label:'Escola'         },
  { key:'saude',           color:'#065F46', label:'Saúde'          },
  { key:'extracurricular', color:'#C49A6C', label:'Extracurricular' },
]

type ActivityWithChild = Activity & { child?: { name: string; avatar_color: string } }

function ActivityDetailCard({ a, i }: { a: ActivityWithChild; i: number }) {
  const bar  = CAT_BAR[a.category]    ?? '#5A8C5E'
  const ibg  = CAT_ICO_BG[a.category] ?? 'rgba(61,102,65,0.08)'
  const icol = CAT_BAR[a.category]    ?? '#3D6641'
  const Icon = CAT_ICON[a.category]   ?? CalendarDays
  return (
    <div className="rounded-[17px] p-3 flex items-start gap-2.5 animate-fade-up"
      style={{ backgroundImage:'linear-gradient(160deg,#FFFFFF 0%,#FAF5EC 100%)',
        border:'1px solid rgba(61,102,65,0.16)',
        boxShadow:'0 2px 8px rgba(44,74,46,0.08),0 -1px 0 rgba(255,255,255,0.85) inset',
        animationDelay:`${i*0.05}s` }}>
      <div className="w-1 self-stretch rounded-full flex-none mt-0.5"
        style={{ background:bar, boxShadow:`0 0 4px ${bar}50` }} />
      <div className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-none"
        style={{ backgroundImage:ibg, border:'1px solid rgba(0,0,0,0.07)', boxShadow:'0 1px 3px rgba(44,74,46,0.08),0 -1px 0 rgba(255,255,255,0.55) inset' }}>
        <Icon size={14} color={icol} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm leading-tight truncate" style={{ color:'#1A2B1C' }}>{a.title}</div>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {a.child && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
              style={{ background:a.child.avatar_color??'#5A8C5E', boxShadow:'0 1px 3px rgba(0,0,0,0.15)' }}>
              {a.child.name}
            </span>
          )}
          {a.time && (
            <span className="text-xs flex items-center gap-1 italic" style={{ color:'rgba(26,43,28,0.45)' }}>
              <Clock size={10}/> {a.time.slice(0,5)}
            </span>
          )}
        </div>
        {a.location && (
          <p className="text-xs flex items-center gap-1 mt-1 italic" style={{ color:'rgba(26,43,28,0.40)' }}>
            <MapPin size={10}/> {a.location}
          </p>
        )}
        <div className="mt-1.5"><CategoryBadge category={a.category}/></div>
      </div>
    </div>
  )
}

function DayDetail({ selectedDay, selectedDayActs, onClose }: {
  selectedDay: Date; selectedDayActs: ActivityWithChild[]; onClose: ()=>void
}) {
  return (
    <>
      <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
        style={{ borderBottom:'1px solid rgba(61,102,65,0.10)' }}>
        <div>
          <div className="text-xs font-extrabold uppercase tracking-[0.14em]" style={{ color:'#5A8C5E' }}>
            {format(selectedDay,"EEEE",{locale:ptBR})}
          </div>
          <div className="text-lg font-bold capitalize mt-0.5"
            style={{ fontFamily:'var(--font-lora)', color:'#1A2B1C' }}>
            {format(selectedDay,"d 'de' MMMM",{locale:ptBR})}
          </div>
        </div>
        <button onClick={onClose}
          className="w-8 h-8 rounded-[10px] flex items-center justify-center transition-all hover:bg-black/[0.05]"
          style={{ color:'rgba(26,43,28,0.45)', background:'rgba(61,102,65,0.07)', border:'1px solid rgba(61,102,65,0.14)', boxShadow:'0 1px 3px rgba(44,74,46,0.07),0 -1px 0 rgba(255,255,255,0.55) inset' }}>
          <X size={14}/>
        </button>
      </div>
      <div className="px-5 py-2.5 flex-shrink-0" style={{ borderBottom:'1px solid rgba(61,102,65,0.07)' }}>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full"
          style={selectedDayActs.length>0
            ? { background:'rgba(61,102,65,0.10)', color:'#3D6641', border:'1px solid rgba(61,102,65,0.18)' }
            : { background:'rgba(26,43,28,0.04)', color:'rgba(26,43,28,0.40)' }}>
          {selectedDayActs.length===0 ? 'Dia livre 🌿' : `${selectedDayActs.length} atividade${selectedDayActs.length!==1?'s':''}`}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {selectedDayActs.length===0
          ? <div className="flex flex-col items-center justify-center h-24 text-center">
              <p className="text-sm italic" style={{ color:'rgba(26,43,28,0.40)' }}>Nenhuma atividade neste dia.</p>
            </div>
          : selectedDayActs.map((a,i)=><ActivityDetailCard key={a.id} a={a} i={i}/>)
        }
      </div>
    </>
  )
}

// ── Props ──────────────────────────────────────────────────────────────────
interface Props {
  initialActivities: Activity[]
  initialChildren:   Child[]
}

export default function CalendarioClient({ initialActivities, initialChildren }: Props) {
  const supabase = createClient()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [activities,  setActivities]  = useState<Activity[]>(initialActivities)
  const [children,    setChildren]    = useState<Child[]>(initialChildren)
  const [filterChild, setFilterChild] = useState('')
  const [selectedDay, setSelectedDay] = useState<Date|null>(null)
  const [loading,     setLoading]     = useState(false)   // no initial load spinner

  // track if we've already loaded the current month (initial data covers it)
  const loadedMonth = useRef(format(new Date(),'yyyy-MM'))

  const [dragY,    setDragY]    = useState(0)
  const dragStartY              = useRef(0)
  const isDragging              = useRef(false)

  const load = useCallback(async (date: Date) => {
    const monthKey = format(date,'yyyy-MM')
    if (monthKey === loadedMonth.current) return   // already have this month's data
    loadedMonth.current = monthKey
    setLoading(true)
    const start = format(startOfMonth(date),'yyyy-MM-dd')
    const end   = format(endOfMonth(date),  'yyyy-MM-dd')
    const [{ data: acts }, { data: kids }] = await Promise.all([
      supabase.from('activities')
        .select('*, child:children(name, avatar_color)')
        .gte('date',start).lte('date',end)
        .neq('status','cancelado')
        .order('time',{nullsFirst:false}),
      supabase.from('children').select('*').order('sort_order'),
    ])
    setActivities(acts??[])
    setChildren(kids??[])
    setLoading(false)
  }, [])

  // only re-fetch when month changes, not on initial render
  useEffect(() => { load(currentDate) }, [currentDate, load])

  const filtered        = activities.filter(a => !filterChild || a.child_id===filterChild)
  const calStart        = startOfWeek(startOfMonth(currentDate),{weekStartsOn:0})
  const calEnd          = endOfWeek(endOfMonth(currentDate),    {weekStartsOn:0})
  const days            = eachDayOfInterval({start:calStart, end:calEnd})
  const actsForDay      = (day:Date) => filtered.filter(a=>a.date===format(day,'yyyy-MM-dd'))
  const selectedDayActs = (selectedDay?actsForDay(selectedDay):[]) as ActivityWithChild[]

  function closeSheet() { setSelectedDay(null); setDragY(0) }

  function onTouchStart(e:React.TouchEvent) { dragStartY.current=e.touches[0].clientY; isDragging.current=true }
  function onTouchMove(e:React.TouchEvent)  {
    if (!isDragging.current) return
    setDragY(Math.max(0,e.touches[0].clientY-dragStartY.current))
  }
  function onTouchEnd() {
    isDragging.current=false
    if (dragY>90) closeSheet(); else setDragY(0)
  }

  return (
    <div className="flex flex-col flex-1 min-h-0" style={{ background:'#F8F3EA' }}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ backgroundImage:'linear-gradient(160deg,#FFFFFF 0%,#F8F3EA 100%)',
          borderBottom:'1px solid rgba(61,102,65,0.16)',
          boxShadow:'0 2px 8px rgba(44,74,46,0.07),0 -1px 0 rgba(255,255,255,0.85) inset' }}>

        <div className="flex items-center gap-2">
          <button onClick={()=>setCurrentDate(d=>subMonths(d,1))}
            className="w-8 h-8 rounded-[11px] flex items-center justify-center"
            style={{ backgroundImage:'linear-gradient(160deg,#FFFFFF,#F2EAD8)', border:'1px solid rgba(61,102,65,0.18)', boxShadow:'0 1px 4px rgba(44,74,46,0.09),0 -1px 0 rgba(255,255,255,0.85) inset', color:'#3D6641' }}>
            <ChevronLeft size={15}/>
          </button>
          <h1 className="text-[16px] font-bold capitalize"
            style={{ fontFamily:'var(--font-lora)', color:'#1A2B1C', minWidth:120, textAlign:'center' }}>
            {format(currentDate,'MMMM yyyy',{locale:ptBR})}
            {loading && <span className="ml-1 text-[11px] font-normal italic" style={{ color:'rgba(26,43,28,0.38)' }}>…</span>}
          </h1>
          <button onClick={()=>setCurrentDate(d=>addMonths(d,1))}
            className="w-8 h-8 rounded-[11px] flex items-center justify-center"
            style={{ backgroundImage:'linear-gradient(160deg,#FFFFFF,#F2EAD8)', border:'1px solid rgba(61,102,65,0.18)', boxShadow:'0 1px 4px rgba(44,74,46,0.09),0 -1px 0 rgba(255,255,255,0.85) inset', color:'#3D6641' }}>
            <ChevronRight size={15}/>
          </button>
          <button onClick={()=>{setCurrentDate(new Date());setSelectedDay(new Date())}}
            className="text-xs font-bold px-3 py-1 rounded-full ml-1"
            style={{ background:'rgba(61,102,65,0.10)', color:'#3D6641', border:'1px solid rgba(61,102,65,0.18)' }}>
            Hoje
          </button>
        </div>

        {children.length>0 && (
          <select value={filterChild} onChange={e=>setFilterChild(e.target.value)}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-[11px] outline-none cursor-pointer"
            style={{ backgroundImage:'linear-gradient(160deg,#FFFFFF,#F2EAD8)', color:'#1A2B1C', border:'1px solid rgba(61,102,65,0.18)', boxShadow:'0 1px 4px rgba(44,74,46,0.08),0 -1px 0 rgba(255,255,255,0.80) inset', maxWidth:100 }}>
            <option value="">Todos</option>
            {children.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Weekday headers */}
          <div className="grid grid-cols-7 flex-shrink-0"
            style={{ borderBottom:'1px solid rgba(61,102,65,0.10)', backgroundImage:'linear-gradient(160deg,#FFFFFF,#FAF5EC)' }}>
            {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d=>(
              <div key={d} className="text-center text-[10px] font-extrabold py-2 tracking-[0.05em] uppercase"
                style={{ color:'rgba(26,43,28,0.38)' }}>{d}</div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 px-3 py-1.5 flex-shrink-0"
            style={{ borderBottom:'1px solid rgba(61,102,65,0.06)', background:'rgba(248,243,234,0.80)' }}>
            {LEGEND.map(l=>(
              <span key={l.key} className="flex items-center gap-1 text-[10px] font-semibold"
                style={{ color:'rgba(26,43,28,0.50)' }}>
                <span className="w-2 h-2 rounded-[3px] inline-block flex-shrink-0" style={{ background:l.color }}/>
                {l.label}
              </span>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 flex-1 overflow-hidden" style={{ gridAutoRows:'1fr' }}>
            {days.map((day,i)=>{
              const isCurrentMonth = day.getMonth()===currentDate.getMonth()
              const dayActs   = actsForDay(day)
              const isSelected= selectedDay?isSameDay(day,selectedDay):false
              const todayDay  = isToday(day)
              return (
                <div key={i}
                  onClick={()=>setSelectedDay(isSelected?null:day)}
                  className="flex flex-col cursor-pointer transition-colors overflow-hidden"
                  style={{
                    padding:'4px 3px 3px',
                    borderBottom:'1px solid rgba(61,102,65,0.07)',
                    borderRight: i%7!==6?'1px solid rgba(61,102,65,0.07)':'none',
                    background: isSelected?'rgba(61,102,65,0.09)':todayDay?'rgba(61,102,65,0.03)':'transparent',
                    opacity: isCurrentMonth?1:0.28,
                    minHeight: 0,
                  }}>
                  <div className="flex-shrink-0 mb-0.5">
                    <span className="font-bold flex items-center justify-center rounded-full"
                      style={{ fontSize:10.5, width:20, height:20,
                        ...(todayDay
                          ?{backgroundImage:'linear-gradient(140deg,#3D6641,#2C4A2E)',color:'#D4E8D5',boxShadow:'0 2px 8px rgba(44,74,46,0.30)'}
                          :isSelected?{background:'rgba(61,102,65,0.18)',color:'#2C4A2E'}:{color:'#1A2B1C'}) }}>
                      {day.getDate()}
                    </span>
                  </div>
                  <div className="flex flex-col gap-[2px] overflow-hidden flex-1">
                    {dayActs.slice(0,2).map((a,ai)=>(
                      <div key={ai} className="text-white truncate font-semibold rounded-[5px] px-1 flex-shrink-0"
                        style={{ background:CAT_PILL_BG[a.category]??'rgba(90,140,94,0.75)', fontSize:9, lineHeight:'14px', boxShadow:'0 1px 2px rgba(0,0,0,0.14)' }}>
                        {a.title}
                      </div>
                    ))}
                    {dayActs.length>2&&(
                      <div style={{ fontSize:9, fontWeight:700, color:'rgba(26,43,28,0.42)', lineHeight:'14px' }}>
                        +{dayActs.length-2}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Desktop side panel */}
        {selectedDay&&(
          <div className="hidden lg:flex w-72 flex-shrink-0 flex-col overflow-hidden animate-fade-in"
            style={{ borderLeft:'1px solid rgba(61,102,65,0.16)', backgroundImage:'linear-gradient(160deg,#FFFFFF 0%,#F8F3EA 100%)', boxShadow:'-4px 0 20px rgba(44,74,46,0.07)' }}>
            <DayDetail selectedDay={selectedDay} selectedDayActs={selectedDayActs} onClose={closeSheet}/>
          </div>
        )}
      </div>

      {/* Mobile bottom sheet */}
      {selectedDay&&(
        <>
          {/* Scrim — stops ABOVE bottom nav (bottom:58px) so nav stays clickable */}
          <div className="lg:hidden fixed inset-x-0 top-0 z-[60]"
            style={{ bottom:58, background:'rgba(15,31,17,0.45)', backdropFilter:'blur(2px)' }}
            onClick={closeSheet}/>
          <div className="lg:hidden fixed left-0 right-0 z-[70] flex flex-col animate-slide-up"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{
              bottom:58, maxHeight:'65vh', borderRadius:'20px 20px 0 0',
              backgroundImage:'linear-gradient(180deg,#FFFFFF 0%,#F8F3EA 100%)',
              border:'1px solid rgba(61,102,65,0.18)',
              boxShadow:'0 -8px 32px rgba(44,74,46,0.18)',
              overflow:'hidden',
              transform:`translateY(${dragY}px)`,
              transition:isDragging.current?'none':'transform .3s cubic-bezier(.32,.72,0,1)',
              willChange:'transform',
            }}>
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0 cursor-grab active:cursor-grabbing"
              style={{ touchAction:'none' }}>
              <div className="w-10 h-1 rounded-full" style={{ background:'rgba(61,102,65,0.28)' }}/>
            </div>
            <DayDetail selectedDay={selectedDay} selectedDayActs={selectedDayActs} onClose={closeSheet}/>
          </div>
        </>
      )}
    </div>
  )
}
