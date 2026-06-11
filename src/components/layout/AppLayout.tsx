'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import {
  LayoutDashboard, BookOpen, HeartPulse, Trophy,
  CalendarDays, FolderLock, Sparkles, Leaf,
  ChevronRight, Palette, Moon, Sun, SlidersHorizontal,
  Users, LogOut, Car, Settings, UserPlus,
} from 'lucide-react'
import { ChildAvatar } from '@/app/(app)/children/ChildrenClient'
import { createClient } from '@/lib/supabase/client'

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
export default function AppLayout({ children, sidebarChildren: initial }: Props) {
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

  // ── Mobile sidebar NavItem — same visual as old bottom nav, now vertical ──
  function MobileNavItem({ href, icon: Icon, label, amber }: {
    href: string; icon: React.ElementType; label: string; amber?: boolean
  }) {
    const active = isActive(href)
    const color = amber
      ? (active ? '#E5B87A'   : 'rgba(196,154,108,0.78)')
      : (active ? '#D4E8D5'   : 'rgba(180,220,185,0.42)')
    return (
      <Link href={href} onClick={() => setMobileSidebarOpen(false)}
        style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          gap:3, width:58, height:46, position:'relative', textDecoration:'none', flexShrink:0 }}>
        {active && (
          <span style={{ position:'absolute', left:0, top:'50%', transform:'translateY(-50%)',
            width:3, height:22, borderRadius:'0 3px 3px 0',
            background:'linear-gradient(180deg,#C49A6C,#E5B87A)' }} />
        )}
        <Icon size={18} strokeWidth={active ? 2.5 : 1.8} color={color} />
        <span style={{ fontSize:8, fontWeight:600, lineHeight:1.2, letterSpacing:'0.01em',
          textAlign:'center', color, maxWidth:52 }}>{label}</span>
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
      <div ref={appRef} className="app-wrap flex min-h-screen">

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
              <NavItem href="/dashboard"  label="Início"        icon={LayoutDashboard} />
              <NavItem href="/calendario" label="Agenda"        icon={CalendarDays} />
              <NavItem href="/ia"         label="Assistente IA" icon={Sparkles} />
            </div>
            <div>
              <div style={{ fontSize:10, fontWeight:800, letterSpacing:'0.16em', textTransform:'uppercase',
                display:'flex', alignItems:'center', gap:8, padding:'0 10px 6px', color:'rgba(26,43,28,0.36)' }}>
                Módulos
                <div style={{ flex:1, height:1, background:'rgba(61,102,65,0.14)' }} />
              </div>
              <NavItem href="/escola"         label="Escola"         icon={BookOpen} />
              <NavItem href="/saude"          label="Saúde"          icon={HeartPulse} />
              <NavItem href="/atividades"     label="Atividades"     icon={Trophy} />
              <NavItem href="/logistica"      label="Logística"      icon={Car} />
              <NavItem href="/vault"          label="Documentos"     icon={FolderLock} />
              <NavItem href="/configuracoes"  label="Convide Parceiro(a)" icon={UserPlus} />
            </div>
          </nav>

          {/* Children pinned at bottom — always visible */}
          <div style={{ flexShrink:0, padding:'8px 12px 10px', borderTop:'1px solid rgba(61,102,65,0.14)', overflowY:'auto', maxHeight:220 }}>
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
            <button onClick={handleLogout}
              className="w-full transition-all hover:bg-black/[0.04] rounded-[8px]"
              style={{ fontSize:11, fontWeight:500, color:'rgba(26,43,28,0.28)', padding:'6px 0', marginTop:4 }}>
              Sair da conta
            </button>
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

      {/* ── Mobile sidebar — 58px, same visual as old bottom bar, now vertical ── */}
      <div
        ref={navRef}
        className="md:hidden fixed top-0 left-0 bottom-0 z-[75]"
        style={{
          width:58,
          background:'linear-gradient(180deg,#253D27 0%,#1E3320 100%)',
          borderRight:'1px solid rgba(91,143,94,0.14)',
          boxShadow:'4px 0 20px rgba(10,20,12,0.30)',
          transform: mobileSidebarOpen ? 'translateX(0)' : 'translateX(-58px)',
          transition:'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
          display:'flex',
          flexDirection:'column',
          paddingTop:'env(safe-area-inset-top, 0px)',
          paddingBottom:'env(safe-area-inset-bottom, 0px)',
        }}>

        {/* Main nav items */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', gap:0 }}>
          <MobileNavItem href="/dashboard"  icon={LayoutDashboard} label="Início"     />
          <MobileNavItem href="/escola"     icon={BookOpen}        label="Escola"     />
          <MobileNavItem href="/atividades" icon={Trophy}          label="Atividades" />
          <MobileNavItem href="/saude"      icon={HeartPulse}      label="Saúde"      />
          <MobileNavItem href="/calendario" icon={CalendarDays}    label="Agenda"     />
          <MobileNavItem href="/logistica"  icon={Car}             label="Logística"  />
          <MobileNavItem href="/vault"      icon={FolderLock}      label="Docs"       />
        </div>

        {/* Divider */}
        <div style={{ height:0.5, background:'rgba(91,143,94,0.22)', margin:'4px 10px' }} />

        {/* Bottom items */}
        <div style={{ display:'flex', flexDirection:'column', paddingBottom:8 }}>
          <MobileNavItem href="/children"      icon={Users}    label="Meus Filhos"       />
          <MobileNavItem href="/configuracoes" icon={UserPlus} label="Convide parceiro(a)" amber />
          <button
            onClick={() => { setMobileSidebarOpen(false); handleLogout() }}
            style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              gap:3, width:58, height:46, background:'none', border:'none', cursor:'pointer', flexShrink:0 }}>
            <LogOut size={18} strokeWidth={1.8} color="rgba(220,38,38,0.62)" />
            <span style={{ fontSize:8, fontWeight:600, lineHeight:1.2, letterSpacing:'0.01em',
              textAlign:'center', color:'rgba(220,38,38,0.62)' }}>Sair</span>
          </button>
        </div>

      </div>

      {/* ── Mobile TEMA floating button ── */}
      <button
        className="mobile-tema-btn fixed z-[55]"
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
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:16 }}>
              <button onClick={handleLogout}
                style={{ display:'flex', alignItems:'center', gap:8, width:'100%',
                  padding:'10px 14px', borderRadius:12, border:`1px solid rgba(220,38,38,0.20)`,
                  background:'rgba(220,38,38,0.06)', cursor:'pointer',
                  fontSize:13, fontWeight:700, color:'#DC2626' }}>
                <LogOut size={15}/> Sair da conta
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  )
}
