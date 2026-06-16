'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import {
  LayoutDashboard, BookOpen, HeartPulse, Trophy,
  CalendarDays, FolderLock, Sparkles, Leaf,
  ChevronRight, Palette, Moon, Sun, SlidersHorizontal,
  Users, LogOut, Car, Settings, UserPlus, Bell, X, Clock,
} from 'lucide-react'
import { ChildAvatar } from '@/app/(app)/children/ChildrenClient'
import { createClient } from '@/lib/supabase/client'
import { Toaster } from '@/components/ui/Toast'
import FamilySwitcher, { type FamilyOption } from '@/components/layout/FamilySwitcher'

// ── Types ──────────────────────────────────────────────────────────────
interface SidebarChild {
  id: string
  name: string
  avatar_color: string
  avatar_url?: string | null
  birth_date: string | null
  school_name: string | null
}

interface Props {
  children: React.ReactNode
  sidebarChildren: SidebarChild[]
  families?: FamilyOption[]
}

// ── Palettes ───────────────────────────────────────────────────────────
const PALETTES = [
  { name:'Floresta', hue:0,   sat:1.00, dot:'linear-gradient(140deg,#5A8C5E,#2C4A2E)' },
  { name:'Índigo',   hue:120, sat:1.10, dot:'linear-gradient(140deg,#6366F1,#3730A3)' },
  { name:'Âmbar',    hue:280, sat:1.20, dot:'linear-gradient(140deg,#F59E0B,#92400E)' },
  { name:'Rosa',     hue:210, sat:1.05, dot:'linear-gradient(140deg,#EC4899,#9D174D)' },
  { name:'Ardósia',  hue:0,   sat:0.08, dot:'linear-gradient(140deg,#64748B,#1E293B)' },
]

function calcAge(birthDate: string | null) {
  if (!birthDate) return null
  const birth = new Date(birthDate), today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  if (today.getMonth() < birth.getMonth() ||
     (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--
  return age
}

// ── Component ──────────────────────────────────────────────────────────
export default function AppLayout({ children, sidebarChildren: initial, families = [] }: Props) {
  const pathname = usePathname()
  const router   = useRouter()

  const [liveChildren, setLiveChildren] = useState<SidebarChild[]>(initial)
  useEffect(() => {
    createClient()
      .from('children')
      .select('id,name,avatar_color,avatar_url,birth_date,school_name')
      .order('sort_order')
      .then(({ data }) => { if (data) setLiveChildren(data) })
  }, [pathname])

  const [palIdx,           setPalIdx]           = useState(0)
  const [sepia,            setSepia]            = useState(0)
  const [brightness,       setBrightness]       = useState(100)
  const [contrast,         setContrast]         = useState(100)
  const [darkMode,         setDarkMode]         = useState(false)
  const [mobileTemaOpen,   setMobileTemaOpen]   = useState(false)
  const [mobileSidebarOpen,setMobileSidebarOpen]= useState(false)
  const [desktopTweaksOpen,setDesktopTweaksOpen]= useState(false)

  // ── Notificações de logística ─────────────────────────────────────────
  const [pendingLogisticsCount, setPendingLogisticsCount] = useState(0)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<{ id: string; type: string; payload: Record<string, string>; read: boolean; created_at: string }[]>([])
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    let userId: string

    async function loadNotifications() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      userId = user.id

      // Contar sugestões pendentes para mim
      const { data: suggestions } = await supabase
        .from('logistics_suggestions')
        .select('id')
        .eq('proposed_to', user.id)
        .eq('status', 'pending')
      setPendingLogisticsCount((suggestions ?? []).length)

      // Notificações in-app não lidas
      const { data: notifs } = await supabase
        .from('app_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)
      setNotifications((notifs ?? []) as typeof notifications)
    }

    loadNotifications()

    // Realtime: novas sugestões para mim
    const channel = supabase.channel('global_logistics_notif')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'logistics_suggestions' }, () => {
        loadNotifications()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_notifications' }, () => {
        loadNotifications()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [pathname])

  useEffect(() => {
    if (!notifOpen) return
    function handler(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [notifOpen])

  async function markAllRead() {
    const supabase = createClient()
    await supabase.from('app_notifications').update({ read: true }).eq('read', false)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  function notifLabel(n: typeof notifications[number]): string {
    const p = n.payload
    if (n.type === 'logistics_suggestion') return `${p.proposed_by_name ?? 'Parceiro(a)'} sugeriu uma tarefa de logística para você`
    if (n.type === 'logistics_rejected') return `${p.rejected_by_name ?? 'Parceiro(a)'} recusou sua sugestão: ${p.activity_title ?? ''}`
    if (n.type === 'logistics_accepted') return `${p.accepted_by_name ?? 'Parceiro(a)'} aceitou sua sugestão: ${p.activity_title ?? ''}`
    return 'Notificação de logística'
  }

  const unreadCount = notifications.filter(n => !n.read).length + pendingLogisticsCount

  const appRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLDivElement>(null)   // mobile sidebar — same filter as app-wrap

  // ── Apply CSS filter ────────────────────────────────────────────────
  useEffect(() => {
    const el  = appRef.current
    const nav = navRef.current
    if (!el) return
    const { hue, sat } = PALETTES[palIdx]
    let filterStr: string
    if (darkMode) {
      const darkHue = (180 + hue) % 360
      filterStr = `invert(1) hue-rotate(${darkHue}deg) saturate(${(sat * 0.95).toFixed(2)}) brightness(0.90) contrast(1.06)`
    } else {
      filterStr = `hue-rotate(${hue}deg) saturate(${sat}) sepia(${sepia}%) brightness(${brightness}%) contrast(${contrast}%)`
    }
    el.style.filter = filterStr
    if (nav) nav.style.filter = filterStr
  }, [palIdx, sepia, brightness, contrast, darkMode])

  // Close sidebar on navigation
  useEffect(() => { setMobileSidebarOpen(false) }, [pathname])

  async function handleLogout() {
    await createClient().auth.signOut()
    router.push('/auth/login')
  }

  function isActive(href: string) {
    return pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
  }

  const panelBg = darkMode
    ? `linear-gradient(175deg,#111C12 0%,#0C1510 100%)`
    : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E"),linear-gradient(175deg,#F2EAD8 0%,#E8DEC8 100%)`
  const panelText  = darkMode ? '#C8DEC9' : '#1A2B1C'
  const panelMuted = darkMode ? 'rgba(200,222,201,0.50)' : 'rgba(26,43,28,0.55)'
  const panelBorder= darkMode ? 'rgba(80,130,84,0.22)' : 'rgba(61,102,65,0.22)'

  // ── Desktop NavItem ──────────────────────────────────────────────────
  function NavItem({ href, label, icon: Icon, badge }: {
    href: string; label: string; icon: React.ElementType; badge?: number
  }) {
    const active = isActive(href)
    return (
      <Link href={href}
        className={`flex items-center gap-3 px-3 py-[6px] rounded-[11px] text-[14px] font-medium transition-all duration-150 relative mb-[1px] ${active ? 'nav-active' : 'hover:bg-black/[0.04]'}`}
        style={active ? { color:'#2C4A2E', fontWeight:700 } : { color:'rgba(26,43,28,0.50)' }}>
        {active && (
          <div className="absolute pointer-events-none"
            style={{ left:-12, top:'50%', transform:'translateY(-50%)', width:4, height:22,
              borderRadius:'0 4px 4px 0', background:'linear-gradient(180deg,#5A8C5E,#2C4A2E)' }} />
        )}
        <div className="w-7 h-7 rounded-[9px] flex items-center justify-center flex-none"
          style={active
            ? { background:'rgba(61,102,65,0.13)', color:'#2C4A2E',
                boxShadow:'0 1px 4px rgba(44,74,46,0.15),0 -1px 0 rgba(255,255,255,0.70) inset' }
            : { background:'rgba(61,102,65,0.07)', color:'rgba(26,43,28,0.30)' }
          }>
          <Icon size={14} strokeWidth={active ? 2.5 : 1.8} />
        </div>
        <span className="flex-1 leading-none">{label}</span>
        {badge !== undefined && badge > 0 && (
          <div className="text-[10.5px] font-extrabold min-w-[20px] h-5 rounded-[7px] flex items-center justify-center px-[5px]"
            style={{ background:'#2C4A2E', color:'#D4E8D5', boxShadow:'0 2px 6px rgba(44,74,46,0.20)' }}>
            {badge}
          </div>
        )}
      </Link>
    )
  }

  // ── Mobile sidebar NavItem ──
  function MobileNavItem({ href, icon: Icon, label, amber }: {
    href: string; icon: React.ElementType; label: string; amber?: boolean
  }) {
    const active = isActive(href)
    const color = amber
      ? (active ? '#E5B87A'   : 'rgba(196,154,108,0.72)')
      : (active ? '#D4E8D5'   : 'rgba(180,220,185,0.55)')
    return (
      <Link href={href} onClick={() => setMobileSidebarOpen(false)}
        style={{ display:'flex', flexDirection:'row', alignItems:'center',
          gap:12, height:48, padding:'0 16px', position:'relative',
          textDecoration:'none', flexShrink:0 }}>
        {active && (
          <span style={{ position:'absolute', left:0, top:'50%', transform:'translateY(-50%)',
            width:4, height:28, borderRadius:'0 4px 4px 0',
            background: amber
              ? 'linear-gradient(180deg,#C49A6C,#E5B87A)'
              : 'linear-gradient(180deg,#7AB87E,#D4E8D5)' }} />
        )}
        <span style={{ width:32, height:32, borderRadius:10, flexShrink:0,
          display:'flex', alignItems:'center', justifyContent:'center',
          background: active ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.05)' }}>
          <Icon size={17} strokeWidth={active ? 2.5 : 1.8} color={color} />
        </span>
        <span style={{ fontSize:14, fontWeight: active ? 700 : 500,
          color, letterSpacing:'0.01em', lineHeight:1 }}>{label}</span>
      </Link>
    )
  }

  const sidebarBg = `
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.038'/%3E%3C/svg%3E"),
    linear-gradient(175deg,#F2EAD8 0%,#E8DEC8 100%)
  `

  return (
    <div className="min-h-screen relative">

      {/* ══ APP WRAP ══ */}
      <div ref={appRef} className="app-wrap flex min-h-screen" data-dark={darkMode ? '1' : undefined}>

        {/* ══ SIDEBAR (desktop only) ══ */}
        <aside className="hidden md:flex flex-col w-[256px] flex-shrink-0 fixed z-40"
          style={{
            height:'100vh', top:0, left:0, overflow:'hidden',
            backgroundColor:'#EAE1CE',
            backgroundImage:sidebarBg,
            backgroundSize:'200px 200px, 100% 100%',
            borderRight:'1px solid rgba(61,102,65,0.22)',
            boxShadow:'4px 0 24px rgba(44,74,46,0.07)',
          }}>

          <div className="absolute pointer-events-none"
            style={{ top:60, left:0, bottom:60, width:3, borderRadius:'0 3px 3px 0',
              background:'linear-gradient(180deg,transparent 0%,#5A8C5E 15%,#3D6641 45%,#C49A6C 75%,transparent 100%)',
              opacity:0.50 }} />

          {/* Logo */}
          <div style={{ flexShrink:0, padding:'14px 20px 12px', borderBottom:'1px solid rgba(61,102,65,0.14)' }}>
            <div className="flex items-center gap-[12px]">
              <div className="w-[40px] h-[40px] rounded-[13px] flex items-center justify-center flex-none relative"
                style={{ background:'linear-gradient(140deg,#2C4A2E,#1E3320)',
                  boxShadow:'0 4px 14px rgba(44,74,46,0.18),0 -1px 0 rgba(255,255,255,0.12) inset' }}>
                <Leaf size={19} color="#D4E8D5" />
                <div className="absolute" style={{ top:-3, right:-3, width:11, height:11, borderRadius:'50% 0 50% 0', background:'#C49A6C', opacity:0.85 }} />
              </div>
              <div>
                <div style={{ fontFamily:'var(--font-lora)', fontSize:16, fontWeight:700, color:'#1A2B1C', letterSpacing:'-0.01em', lineHeight:1.2 }}>
                  Família em Foco
                </div>
                <div style={{ fontSize:'10.5px', marginTop:1, fontStyle:'italic', color:'rgba(26,43,28,0.40)' }}>
                  sua rotina, com leveza
                </div>
              </div>
            </div>
          </div>

          {/* Nav — compact, no overflow so all items always visible */}
          <nav style={{ flex:1, minHeight:0, padding:'10px 12px', overflowY:'hidden' }}>
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:10, fontWeight:800, letterSpacing:'0.16em', textTransform:'uppercase',
                display:'flex', alignItems:'center', gap:8, padding:'0 10px 6px', color:'rgba(26,43,28,0.36)' }}>
                Principal
                <div style={{ flex:1, height:1, background:'rgba(61,102,65,0.14)' }} />
              </div>
              <NavItem href="/dashboard"  label="Início"    icon={LayoutDashboard} />
              <NavItem href="/calendario" label="Agenda"    icon={CalendarDays} />
              <NavItem href="/logistica"  label="Logística" icon={Car} badge={pendingLogisticsCount} />
            </div>
            <div>
              <div style={{ fontSize:10, fontWeight:800, letterSpacing:'0.16em', textTransform:'uppercase',
                display:'flex', alignItems:'center', gap:8, padding:'0 10px 6px', color:'rgba(26,43,28,0.36)' }}>
                Módulos
                <div style={{ flex:1, height:1, background:'rgba(61,102,65,0.14)' }} />
              </div>
              <NavItem href="/escola"     label="Escola"     icon={BookOpen} />
              <NavItem href="/saude"      label="Saúde"      icon={HeartPulse} />
              <NavItem href="/atividades" label="Atividades" icon={Trophy} />
              <NavItem href="/vault"      label="Documentos" icon={FolderLock} />
            </div>
          </nav>

          {/* Bottom section: Filhos + Configurações + Sair */}
          <div style={{ flexShrink:0, borderTop:'1px solid rgba(61,102,65,0.14)', display:'flex', flexDirection:'column' }}>

            {/* Filhos — scrollable */}
            <div style={{ padding:'8px 12px 4px', overflowY:'auto', maxHeight:160 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 8px 7px' }}>
                <span style={{ fontSize:10, fontWeight:800, letterSpacing:'0.15em', textTransform:'uppercase', color:'rgba(26,43,28,0.36)' }}>Filhos</span>
                <Link href="/children" style={{ fontSize:10, fontWeight:700, color:'rgba(61,102,65,0.70)', letterSpacing:'0.04em', textDecoration:'none' }}>
                  + Gerenciar
                </Link>
              </div>
              {liveChildren.length === 0 ? (
                <Link href="/children">
                  <div className="flex items-center gap-2.5 transition-all hover:opacity-80"
                    style={{ padding:'9px 12px', borderRadius:12, border:'1.5px dashed rgba(61,102,65,0.28)',
                      color:'rgba(26,43,28,0.40)', fontSize:12.5, fontWeight:600 }}>
                    <Users size={14} color="rgba(61,102,65,0.55)" />
                    Cadastrar primeiro filho
                  </div>
                </Link>
              ) : (
                liveChildren.map(child => {
                  const age = calcAge(child.birth_date)
                  return (
                    <Link key={child.id} href="/children">
                      <div className="flex items-center gap-3 transition-all duration-150 hover:translate-x-1 cursor-pointer"
                        style={{ padding:'6px 10px', borderRadius:11, marginBottom:4,
                          background:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.045'/%3E%3C/svg%3E"), rgba(255,255,255,0.62)`,
                          backgroundSize:'200px 200px, 100% 100%',
                          border:'1px solid rgba(61,102,65,0.18)',
                          boxShadow:'0 2px 10px rgba(44,74,46,0.09),0 -1px 0 rgba(255,255,255,0.85) inset,inset 1px 0 rgba(255,255,255,0.55)',
                        }}>
                        <ChildAvatar child={{ ...child, avatar_url: child.avatar_url ?? null }} size={32} radius={10} />
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13.5, fontWeight:700, color:'#1A2B1C', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{child.name}</div>
                          {(age !== null || child.school_name) && (
                            <div style={{ fontSize:10.5, fontStyle:'italic', color:'rgba(26,43,28,0.40)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                              {age !== null ? `${age} anos` : ''}{age !== null && child.school_name ? ' · ' : ''}{child.school_name ?? ''}
                            </div>
                          )}
                        </div>
                        <ChevronRight size={12} color="rgba(26,43,28,0.28)" />
                      </div>
                    </Link>
                  )
                })
              )}
            </div>

            {/* Configurações section */}
            <div style={{ padding:'0 12px 4px', borderTop:'1px solid rgba(61,102,65,0.10)' }}>
              <div style={{ fontSize:10, fontWeight:800, letterSpacing:'0.16em', textTransform:'uppercase',
                display:'flex', alignItems:'center', gap:8, padding:'8px 10px 4px', color:'rgba(26,43,28,0.36)' }}>
                Configurações
                <div style={{ flex:1, height:1, background:'rgba(61,102,65,0.14)' }} />
              </div>
              <NavItem href="/configuracoes" label="Compartilhar Acesso" icon={UserPlus} />
              <NavItem href="/alertas"       label="Alertas"             icon={Bell} />
            </div>

            {/* Sair + Tweaks */}
            <div style={{ padding:'2px 12px 10px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <button onClick={handleLogout}
                className="transition-all hover:bg-black/[0.04] rounded-[8px]"
                style={{ fontSize:11, fontWeight:500, color:'rgba(26,43,28,0.28)', padding:'6px 10px', background:'none', border:'none', cursor:'pointer' }}>
                Sair da conta
              </button>
              <button onClick={() => setDesktopTweaksOpen(true)}
                title="Personalizar tema"
                className="transition-all hover:bg-black/[0.06] rounded-[9px]"
                style={{ width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center',
                  background:'rgba(61,102,65,0.08)', border:'none', cursor:'pointer', flexShrink:0 }}>
                <Palette size={14} color="rgba(61,102,65,0.55)" />
              </button>
            </div>
          </div>

        </aside>

        {/* ══ MAIN ══ */}
        <main className="flex-1 md:ml-[256px] musgo-bg relative z-[1] flex flex-col main-container"
          style={{ paddingBottom:'env(safe-area-inset-bottom, 0px)' }}>

          {/* ── Mobile topbar: [hambúrguer] [logo] [IA] ── */}
          <div className="md:hidden flex items-center justify-between px-3 sticky top-0 z-30 flex-shrink-0"
            style={{ background:'rgba(248,243,234,0.94)', backdropFilter:'blur(18px)',
              borderBottom:'1px solid rgba(61,102,65,0.12)', height:56 }}>

            {/* Hambúrguer */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Abrir menu"
              style={{ width:36, height:36, background:'rgba(61,102,65,0.10)', borderRadius:10,
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4,
                border:'none', cursor:'pointer', flexShrink:0 }}>
              <span style={{ width:15, height:1.8, background:'#2C4A2E', borderRadius:2, display:'block' }} />
              <span style={{ width:15, height:1.8, background:'#2C4A2E', borderRadius:2, display:'block' }} />
              <span style={{ width:15, height:1.8, background:'#2C4A2E', borderRadius:2, display:'block' }} />
            </button>

            {/* Logo + título 2 linhas */}
            <div className="flex items-center gap-2">
              <div className="relative flex-none" style={{ width:38, height:38 }}>
                <div className="w-full h-full rounded-[12px] flex items-center justify-center"
                  style={{ background:'linear-gradient(140deg,#2C4A2E,#1E3320)', boxShadow:'0 4px 14px rgba(44,74,46,0.28),0 -1px 0 rgba(255,255,255,0.10) inset' }}>
                  <Leaf size={19} color="#D4E8D5" />
                </div>
                <div className="absolute" style={{ top:-3, right:-3, width:11, height:11, borderRadius:'50% 0 50% 0', background:'#C49A6C', opacity:0.88 }} />
              </div>
              <div style={{ fontFamily:'var(--font-lora)', fontWeight:700, color:'#1A2B1C', lineHeight:1.15 }}>
                <div style={{ fontSize:13 }}>Família</div>
                <div style={{ fontSize:13 }}>em Foco</div>
              </div>
            </div>

            {/* Seletor de família (só aparece quando usuário tem 2+ famílias) */}
            <FamilySwitcher families={families} />

            {/* Notificações (sino) */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => { setNotifOpen(o => !o); if (!notifOpen) markAllRead() }}
                style={{ width:36, height:36, borderRadius:10, border:'none', cursor:'pointer', flexShrink:0, position:'relative',
                  background: unreadCount > 0 ? 'rgba(245,158,11,0.15)' : 'rgba(61,102,65,0.10)',
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Bell size={16} color={unreadCount > 0 ? '#D97706' : 'rgba(44,74,46,0.55)'} />
                {unreadCount > 0 && (
                  <span style={{ position:'absolute', top:-3, right:-3, minWidth:16, height:16, borderRadius:8,
                    background:'#D97706', color:'#fff', fontSize:9, fontWeight:800,
                    display:'flex', alignItems:'center', justifyContent:'center', padding:'0 3px' }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notif dropdown */}
              {notifOpen && (
                <div className="rounded-2xl shadow-xl z-50"
                  style={{ position:'fixed', top:60, right:8, left:8, maxWidth:360, margin:'0 auto', maxHeight:'70vh', overflowY:'auto',
                    background:'linear-gradient(160deg,#FFFFFF,#F8F3EA)',
                    border:'1px solid rgba(61,102,65,0.18)',
                    boxShadow:'0 8px 32px rgba(44,74,46,0.18)' }}>
                  <div className="flex items-center justify-between px-4 py-3"
                    style={{ borderBottom:'1px solid rgba(61,102,65,0.10)' }}>
                    <span style={{ fontSize:13, fontWeight:700, color:'#1A2B1C' }}>Notificações</span>
                    <Link href="/logistica" onClick={() => setNotifOpen(false)}
                      style={{ fontSize:11, fontWeight:700, color:'#2D6A35', textDecoration:'none' }}>
                      Ver logística →
                    </Link>
                  </div>
                  {pendingLogisticsCount > 0 && (
                    <div className="flex items-center gap-2 px-4 py-3"
                      style={{ background:'rgba(245,158,11,0.06)', borderBottom:'1px solid rgba(245,158,11,0.15)' }}>
                      <Clock size={13} color="#D97706" />
                      <span style={{ fontSize:12, color:'#92400E', fontWeight:600 }}>
                        {pendingLogisticsCount} sugestão{pendingLogisticsCount > 1 ? 'ões' : ''} de logística aguardando sua resposta
                      </span>
                    </div>
                  )}
                  {notifications.length === 0 && pendingLogisticsCount === 0 && (
                    <div style={{ padding:'24px 16px', textAlign:'center', fontSize:12, color:'rgba(26,43,28,0.40)', fontStyle:'italic' }}>
                      Nenhuma notificação
                    </div>
                  )}
                  {notifications.map(n => (
                    <div key={n.id} className="flex items-start gap-3 px-4 py-3"
                      style={{ borderBottom:'1px solid rgba(61,102,65,0.07)',
                        background: n.read ? 'transparent' : 'rgba(245,158,11,0.04)' }}>
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize:12, color:'#1A2B1C', lineHeight:1.4 }}>{notifLabel(n)}</p>
                        <p style={{ fontSize:10, color:'rgba(26,43,28,0.40)', marginTop:2 }}>
                          {new Date(n.created_at).toLocaleDateString('pt-BR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                        </p>
                      </div>
                      {!n.read && <div style={{ width:7, height:7, borderRadius:'50%', background:'#D97706', flexShrink:0, marginTop:4 }} />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Captura IA */}
            <Link href="/ia">
              <div className="flex items-center gap-1.5 rounded-[13px] px-3"
                style={{ height:36, background:'linear-gradient(140deg,#3D6641,#2C4A2E)', boxShadow:'0 3px 12px rgba(44,74,46,0.30)' }}>
                <Sparkles size={13} color="#D4E8D5" />
                <span style={{ fontSize:12, fontWeight:700, color:'#D4E8D5', whiteSpace:'nowrap' }}>Captura IA</span>
              </div>
            </Link>
          </div>

          {children}
        </main>

      </div>{/* end app-wrap */}

      {/* ══════════════════════════════════════════════════════════════
          Siblings of app-wrap — CSS filter applied manually via refs
          ═══════════════════════════════════════════════════════════ */}

      {/* ── Mobile sidebar overlay ── */}
      <div
        className="md:hidden fixed inset-0 z-[70]"
        onClick={() => setMobileSidebarOpen(false)}
        style={{
          background:'rgba(10,20,12,0.50)',
          opacity: mobileSidebarOpen ? 1 : 0,
          pointerEvents: mobileSidebarOpen ? 'auto' : 'none',
          transition:'opacity 0.22s ease',
        }}
      />

      {/* ── Mobile sidebar — 230px, slide-in via hambúrguer ── */}
      <div
        ref={navRef}
        className="md:hidden fixed top-0 left-0 bottom-0 z-[75]"
        style={{
          width:230,
          background:'linear-gradient(180deg,#253D27 0%,#1E3320 100%)',
          borderRight:'1px solid rgba(91,143,94,0.18)',
          boxShadow:'6px 0 28px rgba(10,20,12,0.38)',
          transform: mobileSidebarOpen ? 'translateX(0)' : 'translateX(-230px)',
          transition:'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
          display:'flex',
          flexDirection:'column',
          paddingTop:'env(safe-area-inset-top, 0px)',
          paddingBottom:'env(safe-area-inset-bottom, 0px)',
        }}>

        {/* Logo + fechar */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'14px 16px 12px', borderBottom:'1px solid rgba(91,143,94,0.14)', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:11, background:'linear-gradient(140deg,#3D6641,#2C4A2E)',
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
              boxShadow:'0 3px 10px rgba(44,74,46,0.30)' }}>
              <Leaf size={17} color="#D4E8D5" />
            </div>
            <div style={{ fontFamily:'var(--font-lora)', fontSize:14, fontWeight:700,
              color:'rgba(212,232,213,0.92)', lineHeight:1.2 }}>
              Família<br/>em Foco
            </div>
          </div>
          <button onClick={() => setMobileSidebarOpen(false)}
            style={{ width:30, height:30, borderRadius:8, border:'none', cursor:'pointer',
              background:'rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={15} color="rgba(180,220,185,0.60)" />
          </button>
        </div>

        {/* Main nav items */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', gap:0, padding:'4px 0' }}>
          <MobileNavItem href="/dashboard"  icon={LayoutDashboard} label="Início"     />
          <MobileNavItem href="/calendario" icon={CalendarDays}    label="Agenda"     />
          <MobileNavItem href="/logistica"  icon={Car}             label="Logística"  />

          <div style={{ height:1, background:'rgba(91,143,94,0.18)', margin:'6px 16px' }} />

          <MobileNavItem href="/escola"     icon={BookOpen}        label="Escola"     />
          <MobileNavItem href="/saude"      icon={HeartPulse}      label="Saúde"      />
          <MobileNavItem href="/atividades" icon={Trophy}          label="Atividades" />
          <MobileNavItem href="/vault"      icon={FolderLock}      label="Documentos" />
        </div>

        {/* Divider */}
        <div style={{ height:1, background:'rgba(91,143,94,0.18)', margin:'2px 16px' }} />

        {/* Bottom items */}
        <div style={{ display:'flex', flexDirection:'column', paddingBottom:8 }}>
          <MobileNavItem href="/children"      icon={Users}    label="Meus Filhos"         amber />
          <MobileNavItem href="/configuracoes" icon={UserPlus} label="Compartilhar Acesso"  amber />
          <MobileNavItem href="/alertas"       icon={Bell}     label="Alertas"             amber />
          <button
            onClick={() => { setMobileSidebarOpen(false); handleLogout() }}
            style={{ display:'flex', flexDirection:'row', alignItems:'center',
              gap:12, height:48, padding:'0 16px',
              background:'none', border:'none', cursor:'pointer', flexShrink:0 }}>
            <span style={{ width:32, height:32, borderRadius:10, flexShrink:0,
              display:'flex', alignItems:'center', justifyContent:'center',
              background:'rgba(255,255,255,0.05)' }}>
              <LogOut size={17} strokeWidth={1.8} color="rgba(196,154,108,0.72)" />
            </span>
            <span style={{ fontSize:14, fontWeight:500, color:'rgba(196,154,108,0.72)' }}>Sair da conta</span>
          </button>
        </div>

      </div>

      {/* ── Toasts globais (fora do app-wrap: cores fiéis em qualquer tema) ── */}
      <Toaster />

      {/* ── Desktop TWEAKS overlay (conditional render — no Tailwind responsive needed) ── */}
      {desktopTweaksOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:58, background:'rgba(10,20,12,0.30)', backdropFilter:'blur(2px)' }}
          onClick={() => setDesktopTweaksOpen(false)} />
      )}

      {/* ── Desktop TWEAKS panel (always in DOM, slides in/out via transform) ── */}
      <div style={{
          position:'fixed', zIndex:59, top:0, right:0, bottom:0,
          display:'flex', flexDirection:'column',
          width:300,
          transform: desktopTweaksOpen ? 'translateX(0)' : 'translateX(100%)',
          transition:'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
          background: panelBg,
          backgroundSize: darkMode ? 'auto' : '200px 200px, 100% 100%',
          borderLeft:`1px solid ${panelBorder}`,
          boxShadow: darkMode ? '-8px 0 32px rgba(0,0,0,0.50)' : '-8px 0 32px rgba(44,74,46,0.20)',
        }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 20px 16px',
          borderBottom:`1px solid ${panelBorder}` }}>
          <div style={{ display:'flex', alignItems:'center', gap:8,
            fontFamily:'var(--font-lora)', fontSize:16, fontWeight:600, color:panelText }}>
            <Palette size={15} color={darkMode ? '#8CC891' : '#3D6641'} />
            Personalizar Tema
          </div>
          <button onClick={() => setDesktopTweaksOpen(false)}
            style={{ width:28, height:28, borderRadius:8, border:'none', background:'rgba(61,102,65,0.09)',
              display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <X size={14} color={panelMuted} />
          </button>
        </div>
        {/* Content */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px' }}>
          {/* Paleta */}
          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:11, fontWeight:700, marginBottom:12, color:panelMuted, textTransform:'uppercase', letterSpacing:'0.10em' }}>
              Paleta de cor
            </div>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:8 }}>
              {PALETTES.map((p, i) => (
                <button key={p.name} title={p.name} onClick={() => setPalIdx(i)}
                  style={{
                    width:40, height:40, borderRadius:13, background:p.dot, cursor:'pointer',
                    boxShadow: palIdx===i ? '0 4px 14px rgba(0,0,0,0.35)' : '0 2px 8px rgba(44,74,46,0.12)',
                    border: palIdx===i ? '2.5px solid rgba(255,255,255,0.50)' : '2px solid transparent',
                    transform: palIdx===i ? 'scale(1.18)' : undefined,
                    transition:'all .2s',
                  }} />
              ))}
            </div>
            <div style={{ fontSize:12, fontStyle:'italic', color:panelMuted }}>{PALETTES[palIdx].name}</div>
          </div>
          {/* Dark mode */}
          <div style={{ paddingTop:18, borderTop:`1px solid ${panelBorder}` }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ fontSize:14, fontWeight:700, display:'flex', alignItems:'center', gap:8, color:panelText }}>
                {darkMode ? <Moon size={16}/> : <Sun size={16}/>}
                {darkMode ? 'Modo noturno' : 'Modo claro'}
              </div>
              <button onClick={() => setDarkMode(d => !d)}
                style={{ position:'relative', width:48, height:26, borderRadius:13, border:'none', cursor:'pointer',
                  background: darkMode ? 'linear-gradient(135deg,#3D6641,#2C4A2E)' : 'rgba(61,102,65,0.22)',
                  boxShadow:'0 1px 4px rgba(0,0,0,0.15)', flexShrink:0, transition:'background .25s' }}>
                <span style={{ position:'absolute', top:3, width:20, height:20, borderRadius:'50%', background:'white',
                  boxShadow:'0 2px 5px rgba(0,0,0,0.25)',
                  left: darkMode ? 25 : 3, transition:'left .3s cubic-bezier(.4,0,.2,1)' }} />
              </button>
            </div>
            <p style={{ fontSize:11.5, color:panelMuted, marginTop:6 }}>
              {darkMode ? 'Cores invertidas para uso noturno' : 'Cores naturais do aplicativo'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Mobile TEMA floating button ── */}
      <button
        className="mobile-tema-btn fixed z-[55] md:hidden"
        onClick={() => setMobileTemaOpen(true)}
        style={{
          bottom:20, right:16,
          width:44, height:44, borderRadius:'50%',
          background: darkMode
            ? 'rgba(80,130,84,0.28)'
            : 'linear-gradient(140deg,#2C4A2E,#1E3320)',
          backdropFilter:'blur(12px)',
          boxShadow: darkMode
            ? '0 4px 16px rgba(0,0,0,0.40), 0 0 0 1px rgba(90,140,94,0.30)'
            : '0 4px 16px rgba(44,74,46,0.35)',
          border: darkMode ? '1.5px solid rgba(90,140,94,0.35)' : '1.5px solid rgba(255,255,255,0.12)',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
        <SlidersHorizontal size={18} color={darkMode ? '#A8D4AB' : '#D4E8D5'} />
      </button>

      {/* ── Mobile TEMA sheet ── */}
      {mobileTemaOpen && (
        <>
          <div className="md:hidden fixed inset-0 z-[80]"
            style={{ background:'rgba(10,20,11,0.55)', backdropFilter:'blur(4px)' }}
            onClick={() => setMobileTemaOpen(false)} />
          <div className="md:hidden fixed left-0 right-0 z-[90] animate-slide-up"
            style={{
              bottom:0,
              borderRadius:'20px 20px 0 0',
              background:panelBg,
              backgroundSize: darkMode ? 'auto' : '200px 200px, 100% 100%',
              border:`1px solid ${panelBorder}`,
              boxShadow: darkMode
                ? '0 -8px 32px rgba(0,0,0,0.50)'
                : '0 -8px 32px rgba(44,74,46,0.20)',
              padding:'16px 24px 28px',
            }}>
            <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}>
              <div style={{ width:36, height:4, borderRadius:2, background: darkMode ? 'rgba(140,200,145,0.30)' : 'rgba(61,102,65,0.28)' }} />
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20,
              fontFamily:'var(--font-lora)', fontSize:16, fontWeight:600, color:panelText }}>
              <Palette size={15} color={darkMode ? '#8CC891' : '#3D6641'} /> Personalizar Tema
            </div>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, fontWeight:700, marginBottom:10, color:panelMuted }}>Paleta de cor</div>
              <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                {PALETTES.map((p, i) => (
                  <button key={p.name} title={p.name} onClick={() => setPalIdx(i)}
                    style={{
                      width:36, height:36, borderRadius:12, background:p.dot, cursor:'pointer',
                      boxShadow: palIdx===i ? '0 4px 14px rgba(0,0,0,0.35)' : '0 2px 8px rgba(44,74,46,0.12)',
                      border: palIdx===i ? '2.5px solid rgba(255,255,255,0.50)' : '2px solid transparent',
                      transform: palIdx===i ? 'scale(1.18)' : undefined,
                      transition:'all .2s',
                    }} />
                ))}
              </div>
              <div style={{ fontSize:11, fontStyle:'italic', marginTop:8, color:panelMuted }}>{PALETTES[palIdx].name}</div>
            </div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:12, borderTop:`1px solid ${panelBorder}` }}>
              <div style={{ fontSize:14, fontWeight:700, display:'flex', alignItems:'center', gap:8, color:panelMuted }}>
                {darkMode ? <Moon size={16}/> : <Sun size={16}/>}
                {darkMode ? 'Modo noturno' : 'Modo claro'}
              </div>
              <button onClick={() => setDarkMode(d => !d)}
                style={{ position:'relative', width:48, height:26, borderRadius:13, border:'none', cursor:'pointer',
                  background: darkMode ? 'linear-gradient(135deg,#3D6641,#2C4A2E)' : 'rgba(61,102,65,0.22)',
                  boxShadow:'0 1px 4px rgba(0,0,0,0.15)', flexShrink:0, transition:'background .25s' }}>
                <span style={{ position:'absolute', top:3, width:20, height:20, borderRadius:'50%', background:'white',
                  boxShadow:'0 2px 5px rgba(0,0,0,0.25)',
                  left: darkMode ? 25 : 3, transition:'left .3s cubic-bezier(.4,0,.2,1)' }} />
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  )
}
