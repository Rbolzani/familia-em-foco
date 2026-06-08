'use client'
import { useState } from 'react'
import Link from 'next/link'
import {
  BookOpen, HeartPulse, Trophy, Sparkles,
  Bell, SunMedium, MapPin,
  ChevronLeft, ChevronRight,
  CalendarCheck, CalendarRange, AlertTriangle, Stethoscope,
} from 'lucide-react'
import { Activity, Child } from '@/lib/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ── Types ──────────────────────────────────────────────────────────────────
interface Props {
  userName: string
  children: Child[]
  todayActivities:    (Activity & { child: { name: string; avatar_color: string } })[]
  upcomingActivities: (Activity & { child: { name: string; avatar_color: string } })[]
  monthEventDates: string[]   // all dates with events in current month
  totalPending: number        // total pending across all time (matches module count)
}

// ── Textures ───────────────────────────────────────────────────────────────
const NOISE    = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.065'/%3E%3C/svg%3E")`
const NOISE_SM = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='150' height='150' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E")`

const STAT: React.CSSProperties = {
  borderRadius: '20px 13px 18px 15px',
  padding: '22px 20px',
  cursor: 'pointer',
  position: 'relative',
  overflow: 'hidden',
  background: `${NOISE}, linear-gradient(160deg,#FFFFFF 0%,#F7F2EA 100%)`,
  backgroundSize: '200px 200px, 100% 100%',
  border: '1px solid rgba(61,102,65,0.18)',
  boxShadow: '0 6px 22px rgba(44,74,46,0.11),0 2px 6px rgba(44,74,46,0.07),0 -1px 0 rgba(255,255,255,0.95) inset,0 1px 0 rgba(0,0,0,0.035) inset,inset 1px 0 rgba(255,255,255,0.55),inset -1px 0 rgba(0,0,0,0.022)',
  transition: 'transform 0.25s, box-shadow 0.25s',
}
const ACT: React.CSSProperties = {
  borderRadius: '17px 11px 15px 13px',
  padding: '15px 18px',
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  marginBottom: 10,
  cursor: 'pointer',
  position: 'relative',
  overflow: 'hidden',
  background: `${NOISE}, linear-gradient(160deg,#FFFFFF 0%,#FAFAF7 100%)`,
  backgroundSize: '200px 200px, 100% 100%',
  border: '1px solid rgba(61,102,65,0.18)',
  boxShadow: '0 2px 10px rgba(44,74,46,0.09),0 -1px 0 rgba(255,255,255,0.95) inset,0 1px 0 rgba(0,0,0,0.03) inset,inset 1px 0 rgba(255,255,255,0.55)',
  transition: 'transform 0.22s, box-shadow 0.22s',
}
const MINI_CAL: React.CSSProperties = {
  borderRadius: '20px 13px 18px 15px',
  padding: 22,
  border: '1px solid rgba(61,102,65,0.22)',
  background: `${NOISE}, linear-gradient(155deg,#FFFFFF 0%,#F8F3EA 100%)`,
  backgroundSize: '200px 200px, 100% 100%',
  boxShadow: '0 6px 20px rgba(44,74,46,0.12),0 1px 4px rgba(44,74,46,0.08),0 -1px 0 rgba(255,255,255,0.85) inset,0 1px 0 rgba(0,0,0,0.04) inset',
}

// ── Category config ────────────────────────────────────────────────────────
type CatKey = 'escola'|'saude'|'extracurricular'
const CAT: Record<CatKey,{bar:string;barGlow:string;ibg:string;icolor:string;icon:React.ElementType;label:string}> = {
  escola:          { bar:'#3B82F6', barGlow:'rgba(59,130,246,0.35)', ibg:'linear-gradient(140deg,#DBEAFE,#BFDBFE)', icolor:'#2563EB', icon:BookOpen,    label:'Escola'         },
  saude:           { bar:'#3D6641', barGlow:'rgba(61,102,65,0.35)',  ibg:'linear-gradient(140deg,#D1FAE5,#A7F3D0)', icolor:'#065F46', icon:Stethoscope, label:'Saúde'          },
  extracurricular: { bar:'#C49A6C', barGlow:'rgba(196,154,108,0.35)',ibg:'linear-gradient(140deg,#FEF3C7,#FDE68A)', icolor:'#92400E', icon:Trophy,      label:'Extracurricular' },
}

function greet() {
  const h=new Date().getHours()
  return h<12?'Bom dia':h<18?'Boa tarde':'Boa noite'
}
function fmtDate() {
  return format(new Date(),"EEEE, d 'de' MMMM 'de' yyyy",{locale:ptBR}).replace(/^\w/,c=>c.toUpperCase())
}
function SectionH({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4"
      style={{ fontFamily:'var(--font-lora)', fontSize:22, fontWeight:600, color:'#1A2B1C' }}>
      {children}
      <span className="flex-1 h-[2px] rounded" style={{ background:'linear-gradient(90deg,rgba(61,102,65,0.22),transparent)', minWidth:20 }}/>
    </div>
  )
}

// ── Mini Calendar ──────────────────────────────────────────────────────────
function MiniCalendar({ eventDates }: { eventDates: Set<string> }) {
  const today=new Date()
  const [yr,setYr]=useState(today.getFullYear())
  const [mo,setMo]=useState(today.getMonth())

  function prev() { if(mo===0){setMo(11);setYr(y=>y-1)}else setMo(m=>m-1) }
  function next() { if(mo===11){setMo(0);setYr(y=>y+1)}else setMo(m=>m+1) }

  const monthLabel=format(new Date(yr,mo,1),'MMMM yyyy',{locale:ptBR}).replace(/^\w/,c=>c.toUpperCase())
  const firstDow=new Date(yr,mo,1).getDay()
  const lastDay=new Date(yr,mo+1,0).getDate()
  const prevLast=new Date(yr,mo,0).getDate()

  type Cell={d:number;type:'prev'|'curr'|'next';isToday:boolean;hasEvent:boolean}
  const cells:Cell[]=[]
  for(let i=firstDow-1;i>=0;i--) cells.push({d:prevLast-i,type:'prev',isToday:false,hasEvent:false})
  for(let d=1;d<=lastDay;d++){
    const ds=`${yr}-${String(mo+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    const isT=today.getFullYear()===yr&&today.getMonth()===mo&&today.getDate()===d
    cells.push({d,type:'curr',isToday:isT,hasEvent:eventDates.has(ds)})
  }
  while(cells.length<42) cells.push({d:cells.filter(c=>c.type==='next').length+1,type:'next',isToday:false,hasEvent:false})

  return (
    <div style={MINI_CAL}>
      <div className="flex items-center justify-between mb-[18px]">
        <div style={{ fontFamily:'var(--font-lora)', fontSize:18, fontWeight:600, color:'#1A2B1C' }}>{monthLabel}</div>
        <div className="flex gap-[7px]">
          {[{fn:prev,I:ChevronLeft},{fn:next,I:ChevronRight}].map(({fn,I},i)=>(
            <button key={i} onClick={fn} className="w-[30px] h-[30px] rounded-[10px] flex items-center justify-center transition-all"
              style={{ background:'rgba(255,255,255,0.70)', border:'1px solid rgba(61,102,65,0.22)', boxShadow:'0 2px 8px rgba(44,74,46,0.10),0 -1px 0 rgba(255,255,255,0.80) inset', color:'rgba(26,43,28,0.58)' }}>
              <I size={13}/>
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-7 gap-[2px] text-center mb-[2px]">
        {['D','S','T','Q','Q','S','S'].map((d,i)=>(
          <div key={i} style={{ fontSize:10, fontWeight:800, color:'rgba(26,43,28,0.36)', padding:'4px 0', letterSpacing:'0.06em', textTransform:'uppercase' }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-[2px]">
        {cells.map((cell,i)=>(
          <div key={i} className="relative flex items-center justify-center rounded-[10px] cursor-pointer transition-all hover:bg-[rgba(61,102,65,0.10)]"
            style={{ aspectRatio:'1', fontSize:12.5,
              fontWeight:cell.isToday?800:500,
              color:cell.isToday?'white':cell.type!=='curr'?'rgba(26,43,28,0.25)':'rgba(26,43,28,0.58)',
              background:cell.isToday?'linear-gradient(140deg,#3D6641,#2C4A2E)':undefined,
              boxShadow:cell.isToday?'0 3px 10px rgba(44,74,46,0.35),0 -1px 0 rgba(255,255,255,0.18) inset':undefined,
            }}>
            {cell.d}
            {cell.hasEvent&&!cell.isToday&&(
              <span className="absolute bottom-[2px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ background:'#C49A6C' }}/>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Activity Row ───────────────────────────────────────────────────────────
function ActivityRow({ activity }: { activity: Activity & { child:{name:string;avatar_color:string} } }) {
  const cat    = CAT[activity.category as CatKey]??CAT.escola
  const todayDs= new Date().toISOString().split('T')[0]
  const overdue= activity.status==='pendente'&&activity.date<todayDs

  // Weekday + date
  const dateLabel = format(new Date(activity.date+'T00:00:00'), "EEE, dd/MM", {locale:ptBR})
    .replace(/^\w/,c=>c.toUpperCase())

  const timeText = overdue ? '⚠ Atrasado' : activity.time ? activity.time.slice(0,5) : dateLabel

  return (
    <Link href={`/${activity.category==='escola'?'escola':activity.category==='saude'?'saude':'atividades'}`}>
      <div style={ACT}
        onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.transform='translateX(5px) rotate(0.25deg)';el.style.boxShadow='0 6px 20px rgba(44,74,46,0.12),0 1px 4px rgba(44,74,46,0.08),0 -1px 0 rgba(255,255,255,0.90) inset,0 1px 0 rgba(0,0,0,0.04) inset'}}
        onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.transform='';el.style.boxShadow=''}}>

        <div className="absolute pointer-events-none"
          style={{ left:0, top:10, bottom:10, width:4, borderRadius:'0 4px 4px 0', background:cat.bar, boxShadow:`0 0 6px ${cat.barGlow}` }}/>

        <div className="w-9 h-9 rounded-[11px] flex items-center justify-center flex-none"
          style={{ backgroundImage:cat.ibg, border:'1px solid rgba(0,0,0,0.07)', boxShadow:'0 1px 4px rgba(0,0,0,0.09),0 -1px 0 rgba(255,255,255,0.55) inset' }}>
          <cat.icon size={16} color={cat.icolor} strokeWidth={2}/>
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-bold truncate" style={{ fontSize:14, color:'#1A2B1C', lineHeight:1.3 }}>{activity.title}</div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {/* Child badge — prominent colored pill */}
            {activity.child && (
              <span className="text-[11px] font-extrabold px-2.5 py-[3px] rounded-full text-white flex-shrink-0"
                style={{ background:activity.child.avatar_color, boxShadow:`0 2px 6px ${activity.child.avatar_color}55` }}>
                {activity.child.name}
              </span>
            )}
            {/* Date with weekday */}
            <span className="text-[11px] italic flex-shrink-0" style={{ color:'rgba(26,43,28,0.45)' }}>
              {dateLabel}
            </span>
            {/* Location */}
            {activity.location && (
              <span className="text-[11px] italic flex items-center gap-1 truncate" style={{ color:'rgba(26,43,28,0.38)' }}>
                <MapPin size={10}/> {activity.location}
              </span>
            )}
          </div>
        </div>

        {/* Time / status badge */}
        <div className="flex-none text-xs font-bold px-3 py-[5px] rounded-full"
          style={{
            background:'rgba(255,255,255,0.75)',
            color:overdue?'#DC2626':'rgba(26,43,28,0.58)',
            border:`1px solid ${overdue?'rgba(220,38,38,0.22)':'rgba(61,102,65,0.22)'}`,
            boxShadow:'0 2px 8px rgba(44,74,46,0.09),0 -1px 0 rgba(255,255,255,0.85) inset',
            whiteSpace:'nowrap',
          }}>
          {timeText}
        </div>
      </div>
    </Link>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function DashboardClient({ userName, children, todayActivities, upcomingActivities, monthEventDates, totalPending }: Props) {
  // Mini-calendar uses ALL month events (not just 7 days)
  const eventDates = new Set<string>(monthEventDates)

  // 3 stats: removed "filhos cadastrados"
  const stats = [
    { n:todayActivities.length,    label:'Atividades hoje', icon:CalendarCheck, icolor:'#2563EB', ibg:'linear-gradient(140deg,#DBEAFE,#BFDBFE)', corner:'#2563EB' },
    { n:upcomingActivities.length, label:'Próximos 7 dias', icon:CalendarRange, icolor:'#B45309', ibg:'linear-gradient(140deg,#FEF3C7,#FDE68A)', corner:'#C49A6C' },
    {
      n:totalPending, label:'Pendentes total', icon:AlertTriangle,
      icolor: totalPending>0?'#DC2626':'#065F46',
      ibg:    totalPending>0?'linear-gradient(140deg,#FEE2E2,#FECACA)':'linear-gradient(140deg,#D1FAE5,#A7F3D0)',
      corner: totalPending>0?'#DC2626':'#3D6641',
    },
  ]

  return (
    <div className="px-4 md:px-9 py-5 md:py-[34px] relative z-10 animate-fade-in max-w-full overflow-x-hidden">

      {/* Topbar */}
      <div className="flex items-start justify-between mb-6 md:mb-8">
        <div className="min-w-0">
          <div className="flex items-center gap-[7px] mb-[5px]"
            style={{ fontSize:'11px', fontWeight:700, letterSpacing:'0.13em', textTransform:'uppercase', color:'#5A8C5E' }}>
            <SunMedium size={13}/>
            <span className="md:hidden">{format(new Date(),"EEEE, d 'de' MMMM",{locale:ptBR}).replace(/^\w/,c=>c.toUpperCase())}</span>
            <span className="hidden md:inline">{fmtDate()}</span>
          </div>
          <h1 style={{ fontFamily:'var(--font-lora)', fontWeight:700, color:'#1A2B1C', lineHeight:1.1, letterSpacing:'-0.02em' }}
            className="text-[26px] md:text-[40px]">
            {greet()},<br/>
            <em style={{ fontStyle:'italic', background:'linear-gradient(120deg,#3D6641 30%,#C49A6C 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
              {userName}
            </em>
          </h1>
          <p className="mt-[5px] italic" style={{ fontSize:'13px', color:'rgba(26,43,28,0.36)' }}>
            A família em ordem, o coração em paz.
          </p>
        </div>
        <div className="topbar-actions flex gap-[10px] pt-1 flex-shrink-0">
          <button className="flex items-center gap-2 px-5 py-[11px] rounded-full text-[14px] font-bold transition-all"
            style={{ background:'rgba(255,255,255,0.70)', color:'rgba(26,43,28,0.58)', border:'1px solid rgba(61,102,65,0.22)', boxShadow:'0 2px 8px rgba(44,74,46,0.10),0 -1px 0 rgba(255,255,255,0.70) inset' }}>
            <Bell size={15}/> Alertas
          </button>
          <Link href="/ia">
            <button className="flex items-center gap-2 px-5 py-[11px] rounded-full text-[14px] font-bold transition-all hover:-translate-y-[2px]"
              style={{ background:'linear-gradient(140deg,#3D6641 0%,#2C4A2E 100%)', color:'#D4E8D5', boxShadow:'0 4px 18px rgba(44,74,46,0.30),0 -1px 0 rgba(255,255,255,0.12) inset' }}>
              <Sparkles size={15}/> Adicionar com IA
            </button>
          </Link>
        </div>
      </div>

      {/* Stats — 3 cards: grid-cols-3 on desktop, grid-cols-3 on mobile (smaller padding) */}
      <div className="grid grid-cols-3 gap-[10px] md:gap-[14px] mb-5 md:mb-7">
        {stats.map((s,i)=>(
          <div key={i} style={{ ...STAT, padding:'14px 12px' }}
            className="md:p-[22px_20px]"
            onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.transform='translateY(-4px) rotate(-0.4deg)';el.style.boxShadow='0 12px 36px rgba(44,74,46,0.14),0 2px 8px rgba(44,74,46,0.09),0 -1px 0 rgba(255,255,255,0.85) inset,0 1px 0 rgba(0,0,0,0.04) inset'}}
            onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.transform='';el.style.boxShadow=''}}>

            <div aria-hidden className="absolute pointer-events-none"
              style={{ top:-24, right:-24, width:80, height:80, borderRadius:'50%', background:s.corner, opacity:0.10 }}/>

            <div className="w-8 h-8 md:w-10 md:h-10 rounded-[10px] md:rounded-[13px] flex items-center justify-center mb-2 md:mb-4"
              style={{ backgroundImage:s.ibg, border:'1px solid rgba(0,0,0,0.06)', boxShadow:'0 1px 3px rgba(0,0,0,0.10),0 -1px 0 rgba(255,255,255,0.60) inset' }}>
              <s.icon size={14} color={s.icolor} strokeWidth={2}/>
            </div>
            <div style={{ fontFamily:'var(--font-lora)', lineHeight:1, color:'#1A2B1C' }} className="text-[26px] md:text-[40px] font-bold">{s.n}</div>
            <div style={{ color:'rgba(26,43,28,0.36)', fontWeight:500 }} className="text-[10px] md:text-[12.5px] mt-1 leading-tight">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="layout-cols grid gap-[18px] md:gap-[22px]" style={{ gridTemplateColumns:'1fr 308px' }}>

        {/* Left */}
        <div className="min-w-0">
          <SectionH>Atividades de Hoje</SectionH>
          {todayActivities.length===0 ? (
            <div className="text-center py-8" style={{ ...STAT, display:'block', padding:28 }}>
              <div className="text-3xl mb-2">🎉</div>
              <p className="italic" style={{ fontSize:14, color:'rgba(26,43,28,0.50)' }}>Nenhuma atividade para hoje — aproveite!</p>
            </div>
          ) : (
            todayActivities.map(a=><ActivityRow key={a.id} activity={a}/>)
          )}

          {upcomingActivities.length>0&&(
            <div className="mt-5 md:mt-6">
              <SectionH>Próximos 7 dias</SectionH>
              {upcomingActivities.slice(0,5).map(a=><ActivityRow key={a.id} activity={a}/>)}
            </div>
          )}
        </div>

        {/* Right */}
        <div>
          <SectionH>Calendário</SectionH>
          <MiniCalendar eventDates={eventDates}/>
        </div>
      </div>

      <div className="md:hidden h-20"/>
    </div>
  )
}
