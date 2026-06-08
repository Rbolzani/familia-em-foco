'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import {
  LayoutDashboard, BookOpen, HeartPulse, Trophy,
  CalendarDays, FolderLock, Sparkles, Leaf,
  ChevronRight, Palette, Moon, Sun,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ── Types ──────────────────────────────────────────────────────────────
interface SidebarChild {
  id: string
  name: string
  avatar_color: string
  birth_date: string | null
  school_name: string | null
}

interface Props {
  children: React.ReactNode
  sidebarChildren: SidebarChild[]
}

// ── Palettes — each includes sidebar colours ──────────────────────────
const PALETTES = [
  { name:'Floresta', md:'#3D6641', dk:'#2C4A2E', xdk:'#1E3320', lt:'#5A8C5E', pale:'#D4E8D5', sbFrom:'#F2EAD8', sbTo:'#E8DEC8', dot:'linear-gradient(140deg,#5A8C5E,#2C4A2E)' },
  { name:'Índigo',   md:'#4F46E5', dk:'#3730A3', xdk:'#1E1B4B', lt:'#818CF8', pale:'#C7D2FE', sbFrom:'#EEF2FF', sbTo:'#E0E7FF', dot:'linear-gradient(140deg,#6366F1,#3730A3)' },
  { name:'Âmbar',    md:'#D97706', dk:'#92400E', xdk:'#451A03', lt:'#FCD34D', pale:'#FEF3C7', sbFrom:'#FFFBEB', sbTo:'#FEF3C7', dot:'linear-gradient(140deg,#F59E0B,#92400E)' },
  { name:'Rosa',     md:'#DB2777', dk:'#9D174D', xdk:'#500724', lt:'#F9A8D4', pale:'#FCE7F3', sbFrom:'#FDF2F8', sbTo:'#FCE7F3', dot:'linear-gradient(140deg,#EC4899,#9D174D)' },
  { name:'Ardósia',  md:'#475569', dk:'#1E293B', xdk:'#0F172A', lt:'#94A3B8', pale:'#E2E8F0', sbFrom:'#F1F5F9', sbTo:'#E2E8F0', dot:'linear-gradient(140deg,#475569,#0F172A)' },
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
export default function AppLayout({ children, sidebarChildren }: Props) {
  const pathname = usePathname()
  const router   = useRouter()

  // Theme state
  const [temaOpen,    setTemaOpen]    = useState(false)
  const [palIdx,      setPalIdx]      = useState(0)
  const [sepia,       setSepia]       = useState(0)
  const [brightness,  setBrightness]  = useState(100)
  const [contrast,    setContrast]    = useState(100)
  const [darkMode,    setDarkMode]    = useState(false)

  // Ref for filter/palette target (sidebar + main, NOT the TEMA panel)
  const appRef = useRef<HTMLDivElement>(null)

  // Apply theme changes via CSS variables + filter on app wrapper
  useEffect(() => {
    const el = appRef.current
    if (!el) return
    const p = PALETTES[palIdx]
    // CSS variables — sidebar and nav read these via inline style var()
    el.style.setProperty('--g-md',    p.md)
    el.style.setProperty('--g-dk',    p.dk)
    el.style.setProperty('--g-xdk',   p.xdk)
    el.style.setProperty('--g-lt',    p.lt)
    el.style.setProperty('--g-pale',  p.pale)
    el.style.setProperty('--sb-from', p.sbFrom)
    el.style.setProperty('--sb-to',   p.sbTo)
    // CSS filter for brightness/sepia/contrast
    el.style.filter = `sepia(${sepia}%) brightness(${brightness}%) contrast(${contrast}%)`
    // Dark mode data attribute — CSS rules in globals.css pick it up
    el.dataset.mode = darkMode ? 'dark' : ''
  }, [palIdx, sepia, brightness, contrast, darkMode])

  async function handleLogout() {
    await createClient().auth.signOut()
    router.push('/auth/login')
  }

  function isActive(href: string) {
    return pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
  }

  // NavItem — uses CSS vars so palette changes apply immediately
  function NavItem({ href, label, icon: Icon, badge }: {
    href: string; label: string; icon: React.ElementType; badge?: number
  }) {
    const active = isActive(href)
    return (
      <Link href={href}
        className={`flex items-center gap-3 px-3 py-[11px] rounded-[13px] text-[15px] font-medium transition-all duration-150 relative mb-[3px] ${active ? 'nav-active' : 'hover:bg-black/[0.04]'}`}
        style={active ? { color:'var(--g-dk,#2C4A2E)', fontWeight:700 } : { color:'rgba(26,43,28,0.55)' }}>

        {/* Organic active left marker — uses CSS vars */}
        {active && (
          <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-1 h-6 rounded-r pointer-events-none"
            style={{ background:`linear-gradient(180deg,var(--g-lt,#5A8C5E),var(--g-dk,#2C4A2E))` }} />
        )}

        {/* Icon box */}
        <div className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-none"
          style={active
            ? { background:`${(PALETTES[palIdx].md)}22`, color:`var(--g-dk,#2C4A2E)`, boxShadow:'0 1px 4px rgba(0,0,0,0.08),0 -1px 0 rgba(255,255,255,0.60) inset' }
            : { background:'rgba(61,102,65,0.07)', color:'rgba(26,43,28,0.30)' }
          }>
          <Icon size={16} strokeWidth={active ? 2.5 : 1.8} />
        </div>

        <span className="flex-1 leading-none">{label}</span>

        {badge !== undefined && badge > 0 && (
          <div className="text-[10.5px] font-extrabold min-w-[20px] h-5 rounded-[7px] flex items-center justify-center px-[5px]"
            style={{ background:`var(--g-dk,#2C4A2E)`, color:`var(--g-pale,#D4E8D5)`, boxShadow:'0 2px 6px rgba(44,74,46,0.18)' }}>
            {badge}
          </div>
        )}
      </Link>
    )
  }

  return (
    // Outer wrapper — TEMA panel is a sibling here, not inside app-wrap
    // app-wrap gets filter + CSS vars; TEMA panel is unaffected
    <div className="min-h-screen relative overflow-x-hidden">

      {/* ══ APP CONTENT WRAPPER (filter + palette target) ══ */}
      <div ref={appRef} data-mode="" className="app-wrap flex min-h-screen overflow-x-hidden">

        {/* ══ SIDEBAR — Desktop only ══ */}
        <aside className="hidden md:flex flex-col w-[256px] flex-shrink-0 fixed h-full z-40"
          style={{
            background: `
              repeating-linear-gradient(180deg,transparent 0px,transparent 56px,rgba(61,102,65,0.025) 56px,rgba(61,102,65,0.025) 57px),
              linear-gradient(175deg,var(--sb-from,#F2EAD8) 0%,var(--sb-to,#E8DEC8) 100%)
            `,
            borderRight: '1px solid rgba(61,102,65,0.22)',
            boxShadow: '4px 0 24px rgba(44,74,46,0.07)',
          }}>

          {/* Organic left accent */}
          <div className="absolute pointer-events-none"
            style={{ top:60, left:0, bottom:60, width:3, borderRadius:'0 3px 3px 0',
              background:`linear-gradient(180deg,transparent 0%,var(--g-lt,#5A8C5E) 15%,var(--g-md,#3D6641) 45%,#C49A6C 75%,transparent 100%)`,
              opacity:0.55 }} />

          {/* ── Logo — flex-shrink-0 ── */}
          <div className="flex-shrink-0 px-5 pt-7 pb-6" style={{ borderBottom:'1px solid rgba(61,102,65,0.14)' }}>
            <div className="flex items-center gap-[14px]">
              <div className="w-[46px] h-[46px] rounded-[15px] flex items-center justify-center flex-none relative"
                style={{
                  background:`linear-gradient(140deg,var(--g-dk,#2C4A2E),var(--g-xdk,#1E3320))`,
                  boxShadow:'0 6px 20px rgba(44,74,46,0.18),0 -1px 0 rgba(255,255,255,0.12) inset',
                }}>
                <Leaf size={22} color="var(--g-pale,#D4E8D5)" />
                <div className="absolute" style={{ top:-3, right:-3, width:12, height:12, borderRadius:'50% 0 50% 0', background:'#C49A6C', opacity:0.85 }} />
              </div>
              <div>
                <div className="font-bold leading-tight" style={{ fontFamily:'var(--font-lora)', fontSize:17, color:'var(--app-text,#1A2B1C)', letterSpacing:'-0.01em' }}>
                  Família em Foco
                </div>
                <div className="text-[11.5px] mt-0.5 italic" style={{ color:'rgba(26,43,28,0.40)' }}>
                  sua rotina, com leveza
                </div>
              </div>
            </div>
          </div>

          {/* ── Nav — flex-1 + min-h-0 → scrollable, won't overflow ── */}
          <nav className="flex-1 min-h-0 px-3 py-5 overflow-y-auto">
            {/* PRINCIPAL */}
            <div className="mb-[26px]">
              <div className="text-[10px] font-extrabold tracking-[0.16em] uppercase flex items-center gap-2 px-2.5 pb-[10px]"
                style={{ color:'rgba(26,43,28,0.36)' }}>
                Principal
                <div className="flex-1 h-px" style={{ background:'rgba(61,102,65,0.14)' }} />
              </div>
              <NavItem href="/dashboard"  label="Dashboard"     icon={LayoutDashboard} />
              <NavItem href="/calendario" label="Calendário"    icon={CalendarDays}    badge={5} />
              <NavItem href="/ia"         label="Assistente IA" icon={Sparkles} />
            </div>
            {/* MÓDULOS */}
            <div>
              <div className="text-[10px] font-extrabold tracking-[0.16em] uppercase flex items-center gap-2 px-2.5 pb-[10px]"
                style={{ color:'rgba(26,43,28,0.36)' }}>
                Módulos
                <div className="flex-1 h-px" style={{ background:'rgba(61,102,65,0.14)' }} />
              </div>
              <NavItem href="/escola"     label="Escola"     icon={BookOpen}   badge={3} />
              <NavItem href="/saude"      label="Saúde"      icon={HeartPulse} />
              <NavItem href="/atividades" label="Atividades" icon={Trophy} />
              <NavItem href="/vault"      label="Documentos" icon={FolderLock} />
            </div>
          </nav>

          {/* ── Children — flex-shrink-0 → ALWAYS visible, never pushed out ── */}
          {sidebarChildren.length > 0 && (
            <div className="flex-shrink-0 px-3 pb-5 pt-[14px]"
              style={{ borderTop:'1px solid rgba(61,102,65,0.14)' }}>
              <div className="text-[10px] font-extrabold tracking-[0.15em] uppercase px-2 pb-[10px]"
                style={{ color:'rgba(26,43,28,0.36)' }}>
                Filhos
              </div>
              {sidebarChildren.map(child => {
                const age = calcAge(child.birth_date)
                return (
                  <Link key={child.id} href="/children">
                    <div className="flex items-center gap-3 px-3 py-[9px] rounded-[13px] mb-[6px] transition-all duration-150 hover:translate-x-1 cursor-pointer"
                      style={{
                        background:
                          `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E"),
                          rgba(255,255,255,0.65)`,
                        backgroundSize:'200px 200px, 100% 100%',
                        border:'1px solid rgba(61,102,65,0.16)',
                        boxShadow:'0 2px 10px rgba(44,74,46,0.10),0 -1px 0 rgba(255,255,255,0.85) inset,inset 1px 0 rgba(255,255,255,0.60)',
                      }}>
                      <div className="w-[34px] h-[34px] rounded-[11px] flex items-center justify-center flex-none"
                        style={{
                          background: child.avatar_color || `linear-gradient(140deg,var(--g-lt,#5A8C5E),var(--g-dk,#2C4A2E))`,
                          fontFamily:'var(--font-lora)', fontWeight:700, fontSize:15, color:'white',
                          boxShadow:'0 2px 8px rgba(0,0,0,0.15)',
                        }}>
                        {child.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-bold truncate" style={{ color:'#1A2B1C' }}>{child.name}</div>
                        {(age !== null || child.school_name) && (
                          <div className="text-[11px] italic truncate" style={{ color:'rgba(26,43,28,0.40)' }}>
                            {age !== null ? `${age} anos` : ''}{age !== null && child.school_name ? ' · ' : ''}{child.school_name ?? ''}
                          </div>
                        )}
                      </div>
                      <ChevronRight size={13} color="rgba(26,43,28,0.30)" />
                    </div>
                  </Link>
                )
              })}

              {/* Subtle logout link */}
              <button onClick={handleLogout}
                className="w-full text-[11px] font-medium mt-1 py-1.5 rounded-[8px] transition-all hover:bg-black/[0.04]"
                style={{ color:'rgba(26,43,28,0.30)' }}>
                Sair da conta
              </button>
            </div>
          )}

          {sidebarChildren.length === 0 && (
            <div className="flex-shrink-0 px-3 pb-5 pt-3" style={{ borderTop:'1px solid rgba(61,102,65,0.14)' }}>
              <button onClick={handleLogout}
                className="w-full text-[11px] font-medium py-1.5 rounded-[8px] transition-all hover:bg-black/[0.04]"
                style={{ color:'rgba(26,43,28,0.30)' }}>
                Sair da conta
              </button>
            </div>
          )}
        </aside>

        {/* ══ MAIN CONTENT ══ */}
        <main className="flex-1 md:ml-[256px] min-h-screen musgo-bg relative z-[1]"
          style={{ paddingBottom:'env(safe-area-inset-bottom, 80px)' }}>
          {/* Mobile top bar */}
          <div className="md:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-30"
            style={{
              background:'rgba(248,243,234,0.92)', backdropFilter:'blur(16px)',
              borderBottom:'1px solid rgba(61,102,65,0.12)',
            }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[10px] flex items-center justify-center"
                style={{ background:`linear-gradient(140deg,var(--g-dk,#2C4A2E),var(--g-xdk,#1E3320))` }}>
                <Leaf size={16} color="#D4E8D5" />
              </div>
              <div style={{ fontFamily:'var(--font-lora)', fontSize:16, fontWeight:700, color:'#1A2B1C' }}>
                Família em Foco
              </div>
            </div>
            <Link href="/ia">
              <div className="w-9 h-9 rounded-[11px] flex items-center justify-center"
                style={{ background:`linear-gradient(140deg,var(--g-md,#3D6641),var(--g-dk,#2C4A2E))`, boxShadow:'0 4px 12px rgba(44,74,46,0.28)' }}>
                <Sparkles size={17} color="#D4E8D5" />
              </div>
            </Link>
          </div>

          {children}
        </main>

        {/* ══ BOTTOM NAV — Mobile ══ */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40"
          style={{ paddingBottom:'env(safe-area-inset-bottom, 0px)' }}>
          <div style={{
            background:'rgba(242,234,216,0.96)', backdropFilter:'blur(20px)',
            borderTop:'1px solid rgba(61,102,65,0.18)',
            boxShadow:'0 -4px 16px rgba(44,74,46,0.10)',
          }}>
            <div className="flex items-center h-[60px] px-1">
              {[
                { href:'/dashboard',  label:'Início',   icon:LayoutDashboard },
                { href:'/escola',     label:'Escola',   icon:BookOpen        },
                { href:'/calendario', label:'Agenda',   icon:CalendarDays    },
                { href:'/saude',      label:'Saúde',    icon:HeartPulse      },
                { href:'/vault',      label:'Docs',     icon:FolderLock      },
              ].map(({ href, label, icon: Icon }) => {
                const active = isActive(href)
                return (
                  <Link key={href} href={href} className="flex-1 flex flex-col items-center justify-center gap-0.5 h-full relative py-2">
                    <span style={{ color: active ? `var(--g-md,#3D6641)` : 'rgba(26,43,28,0.35)', transition:'color .15s' }}>
                      <Icon size={21} strokeWidth={active ? 2.5 : 1.8} />
                    </span>
                    <span className="text-[10px] font-semibold leading-none"
                      style={{ color: active ? `var(--g-md,#3D6641)` : 'rgba(26,43,28,0.35)' }}>
                      {label}
                    </span>
                    {active && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[3px] rounded-t"
                        style={{ background:`linear-gradient(90deg,var(--g-lt,#5A8C5E),#C49A6C)` }} />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        </nav>

      </div>{/* end app-wrap */}

      {/* ══ TEMA PANEL — OUTSIDE app-wrap so filter doesn't affect it ══ */}
      <div className="hidden md:flex fixed z-[200]"
        style={{ right:0, top:'50%', transform:'translateY(-50%)', alignItems:'stretch' }}>

        {/* Sliding panel */}
        <div className="overflow-hidden transition-all duration-[350ms]"
          style={{
            width: temaOpen ? 268 : 0,
            borderLeft: temaOpen ? '1px solid rgba(61,102,65,0.22)' : 'none',
            background: `
              url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E"),
              linear-gradient(175deg, #F2EAD8 0%, #E8DEC8 100%)
            `,
            backgroundSize:'200px 200px, 100% 100%',
            boxShadow:'-6px 0 28px rgba(0,0,0,0.12)',
          }}>
          <div className="p-6" style={{ width:268, minWidth:268 }}>
            <div className="flex items-center gap-2 mb-6" style={{ fontFamily:'var(--font-lora)', fontSize:18, fontWeight:600, color:'#1A2B1C' }}>
              <Palette size={18} color="#3D6641" /> Personalizar Tema
            </div>

            {/* Palette */}
            <div className="mb-5">
              <div className="text-xs font-bold mb-3" style={{ color:'rgba(26,43,28,0.58)' }}>Paleta de cor</div>
              <div className="flex gap-2 flex-wrap">
                {PALETTES.map((p, i) => (
                  <button key={p.name} title={p.name} onClick={() => setPalIdx(i)}
                    className="w-7 h-7 rounded-[9px] transition-all"
                    style={{
                      background: p.dot,
                      boxShadow: palIdx===i ? '0 4px 14px rgba(0,0,0,0.25)' : '0 2px 8px rgba(44,74,46,0.10)',
                      border: palIdx===i ? '2.5px solid rgba(0,0,0,0.25)' : '2px solid transparent',
                      transform: palIdx===i ? 'scale(1.18)' : undefined,
                    }} />
                ))}
              </div>
            </div>

            {/* Sepia */}
            <div className="mb-4">
              <div className="flex justify-between text-xs font-bold mb-2" style={{ color:'rgba(26,43,28,0.58)' }}>
                Calor <span className="italic" style={{ color:'rgba(26,43,28,0.36)' }}>{sepia}%</span>
              </div>
              <input type="range" min={0} max={40} value={sepia} onChange={e => setSepia(+e.target.value)} />
            </div>

            {/* Brightness */}
            <div className="mb-4">
              <div className="flex justify-between text-xs font-bold mb-2" style={{ color:'rgba(26,43,28,0.58)' }}>
                Brilho <span className="italic" style={{ color:'rgba(26,43,28,0.36)' }}>{brightness}%</span>
              </div>
              <input type="range" min={60} max={130} value={brightness} onChange={e => setBrightness(+e.target.value)} />
            </div>

            {/* Contrast */}
            <div className="mb-4">
              <div className="flex justify-between text-xs font-bold mb-2" style={{ color:'rgba(26,43,28,0.58)' }}>
                Contraste <span className="italic" style={{ color:'rgba(26,43,28,0.36)' }}>{contrast}%</span>
              </div>
              <input type="range" min={80} max={130} value={contrast} onChange={e => setContrast(+e.target.value)} />
            </div>

            <div className="h-px my-4" style={{ background:'rgba(61,102,65,0.14)' }} />

            {/* Dark mode */}
            <div className="flex items-center justify-between">
              <div className="text-[13px] font-bold flex items-center gap-2" style={{ color:'rgba(26,43,28,0.58)' }}>
                {darkMode ? <Moon size={14}/> : <Sun size={14}/>} Modo noturno
              </div>
              <button onClick={() => setDarkMode(d => !d)}
                className="relative"
                style={{
                  width:42, height:22, borderRadius:11,
                  background: darkMode ? `linear-gradient(135deg,var(--g-lt,#5A8C5E),var(--g-md,#3D6641))` : 'rgba(61,102,65,0.22)',
                  boxShadow:'0 1px 4px rgba(0,0,0,0.12)',
                  flexShrink:0,
                }}>
                <span className="absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white transition-all duration-300"
                  style={{ left: darkMode ? 22 : 2, boxShadow:'0 2px 5px rgba(0,0,0,0.22)' }} />
              </button>
            </div>
          </div>
        </div>

        {/* TEMA vertical tab */}
        <button onClick={() => setTemaOpen(o => !o)}
          style={{
            width:34, borderRadius:'12px 0 0 12px', cursor:'pointer',
            background:`linear-gradient(180deg,var(--g-dk,#2C4A2E),var(--g-xdk,#1E3320))`,
            writingMode:'vertical-rl', textOrientation:'mixed',
            fontSize:'10.5px', fontWeight:800, letterSpacing:'0.14em',
            textTransform:'uppercase', color:'var(--g-pale,#D4E8D5)',
            padding:'20px 0',
            boxShadow:'-4px 0 16px rgba(44,74,46,0.25)',
            display:'flex', alignItems:'center', justifyContent:'center',
            userSelect:'none', border:'none',
          }}>
          Tema
        </button>
      </div>

    </div>
  )
}
