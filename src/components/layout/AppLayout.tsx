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

// ── Palettes ───────────────────────────────────────────────────────────
// hue = degrees for hue-rotate CSS filter applied to the WHOLE app-wrap
// This shifts every colour in the app, including inline-styled elements
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
export default function AppLayout({ children, sidebarChildren }: Props) {
  const pathname = usePathname()
  const router   = useRouter()

  const [temaOpen,   setTemaOpen]   = useState(false)
  const [palIdx,     setPalIdx]     = useState(0)
  const [sepia,      setSepia]      = useState(0)
  const [brightness, setBrightness] = useState(100)
  const [contrast,   setContrast]   = useState(100)
  const [darkMode,   setDarkMode]   = useState(false)

  const appRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = appRef.current
    if (!el) return
    const { hue, sat } = PALETTES[palIdx]

    if (darkMode) {
      // The invert(1)+hue-rotate(180°) trick for dark mode:
      // — white cards → near-black warm  ✓
      // — cream bg → very dark warm      ✓
      // — dark green text → light green  ✓
      // — green accents → still green    ✓
      // Palette hue stacks on top of the 180° base
      const darkHue = (180 + hue) % 360
      el.style.filter = `invert(1) hue-rotate(${darkHue}deg) saturate(${(sat * 0.85).toFixed(2)}) brightness(0.88) contrast(1.12)`
    } else {
      el.style.filter = `hue-rotate(${hue}deg) saturate(${sat}) sepia(${sepia}%) brightness(${brightness}%) contrast(${contrast}%)`
    }
  }, [palIdx, sepia, brightness, contrast, darkMode])

  async function handleLogout() {
    await createClient().auth.signOut()
    router.push('/auth/login')
  }

  function isActive(href: string) {
    return pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
  }

  // ── NavItem ──────────────────────────────────────────────────────────
  function NavItem({ href, label, icon: Icon, badge }: {
    href: string; label: string; icon: React.ElementType; badge?: number
  }) {
    const active = isActive(href)
    return (
      <Link href={href}
        className={`flex items-center gap-3 px-3 py-[11px] rounded-[13px] text-[15px] font-medium transition-all duration-150 relative mb-[3px] ${active ? 'nav-active' : 'hover:bg-black/[0.04]'}`}
        style={active ? { color:'#2C4A2E', fontWeight:700 } : { color:'rgba(26,43,28,0.50)' }}>

        {/* Organic left accent */}
        {active && (
          <div className="absolute pointer-events-none"
            style={{ left:-12, top:'50%', transform:'translateY(-50%)', width:4, height:22,
              borderRadius:'0 4px 4px 0', background:'linear-gradient(180deg,#5A8C5E,#2C4A2E)' }} />
        )}

        {/* Icon box */}
        <div className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-none"
          style={active
            ? { background:'rgba(61,102,65,0.13)', color:'#2C4A2E',
                boxShadow:'0 1px 4px rgba(44,74,46,0.15),0 -1px 0 rgba(255,255,255,0.70) inset' }
            : { background:'rgba(61,102,65,0.07)', color:'rgba(26,43,28,0.30)' }
          }>
          <Icon size={16} strokeWidth={active ? 2.5 : 1.8} />
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

  // ── Sidebar noise + paper lines bg ───────────────────────────────────
  const sidebarBg = `
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E"),
    repeating-linear-gradient(180deg,transparent 0px,transparent 55px,rgba(61,102,65,0.025) 55px,rgba(61,102,65,0.025) 56px),
    linear-gradient(175deg,#F2EAD8 0%,#E8DEC8 100%)
  `

  // NOTE: NO overflow:hidden/overflow-x:hidden on root div — breaks position:fixed children
  return (
    <div className="min-h-screen relative">

      {/* ══ APP WRAP — receives filter; TEMA panel is a sibling outside ══ */}
      {/* overflow-x-hidden here would break position:fixed children on some browsers;
          use max-w + clip on inner elements instead                               */}
      <div ref={appRef} className="app-wrap flex min-h-screen">

        {/* ══ SIDEBAR ══
            Layout contract (prevents children from being pushed off-screen):
            • height: 100vh   — exact viewport height, not flex-content height
            • overflow: hidden — the aside itself never scrolls
            • nav: flex-1 + minHeight:0 + overflowY:auto — scrolls internally
            • children: flexShrink:0 — pinned to bottom, never compressed    ══ */}
        <aside className="hidden md:flex flex-col w-[256px] flex-shrink-0 fixed z-40"
          style={{
            height: '100vh',
            top: 0, left: 0,
            overflow: 'hidden',
            background: sidebarBg,
            backgroundSize: '200px 200px, 100% 100%, 100% 100%',
            borderRight: '1px solid rgba(61,102,65,0.22)',
            boxShadow: '4px 0 24px rgba(44,74,46,0.07)',
          }}>

          {/* Left-edge accent */}
          <div className="absolute pointer-events-none"
            style={{ top:60, left:0, bottom:60, width:3, borderRadius:'0 3px 3px 0',
              background:'linear-gradient(180deg,transparent 0%,#5A8C5E 15%,#3D6641 45%,#C49A6C 75%,transparent 100%)',
              opacity:0.50 }} />

          {/* Logo — flex-shrink:0 */}
          <div style={{ flexShrink:0, padding:'28px 20px 24px', borderBottom:'1px solid rgba(61,102,65,0.14)' }}>
            <div className="flex items-center gap-[14px]">
              <div className="w-[46px] h-[46px] rounded-[15px] flex items-center justify-center flex-none relative"
                style={{
                  background:'linear-gradient(140deg,#2C4A2E,#1E3320)',
                  boxShadow:'0 6px 20px rgba(44,74,46,0.18),0 -1px 0 rgba(255,255,255,0.12) inset',
                }}>
                <Leaf size={22} color="#D4E8D5" />
                <div className="absolute" style={{ top:-3, right:-3, width:12, height:12, borderRadius:'50% 0 50% 0', background:'#C49A6C', opacity:0.85 }} />
              </div>
              <div>
                <div style={{ fontFamily:'var(--font-lora)', fontSize:17, fontWeight:700, color:'#1A2B1C', letterSpacing:'-0.01em', lineHeight:1.2 }}>
                  Família em Foco
                </div>
                <div style={{ fontSize:'11.5px', marginTop:2, fontStyle:'italic', color:'rgba(26,43,28,0.40)' }}>
                  sua rotina, com leveza
                </div>
              </div>
            </div>
          </div>

          {/* Nav — flex:1 + minHeight:0 → scrolls, stops before children */}
          <nav style={{ flex:1, minHeight:0, padding:'20px 12px', overflowY:'auto' }}>
            {/* PRINCIPAL */}
            <div style={{ marginBottom:26 }}>
              <div style={{ fontSize:10, fontWeight:800, letterSpacing:'0.16em', textTransform:'uppercase',
                display:'flex', alignItems:'center', gap:8, padding:'0 10px 10px', color:'rgba(26,43,28,0.36)' }}>
                Principal
                <div style={{ flex:1, height:1, background:'rgba(61,102,65,0.14)' }} />
              </div>
              <NavItem href="/dashboard"  label="Dashboard"     icon={LayoutDashboard} />
              <NavItem href="/calendario" label="Calendário"    icon={CalendarDays}    badge={5} />
              <NavItem href="/ia"         label="Assistente IA" icon={Sparkles} />
            </div>
            {/* MÓDULOS */}
            <div>
              <div style={{ fontSize:10, fontWeight:800, letterSpacing:'0.16em', textTransform:'uppercase',
                display:'flex', alignItems:'center', gap:8, padding:'0 10px 10px', color:'rgba(26,43,28,0.36)' }}>
                Módulos
                <div style={{ flex:1, height:1, background:'rgba(61,102,65,0.14)' }} />
              </div>
              <NavItem href="/escola"     label="Escola"     icon={BookOpen}   badge={3} />
              <NavItem href="/saude"      label="Saúde"      icon={HeartPulse} />
              <NavItem href="/atividades" label="Atividades" icon={Trophy} />
              <NavItem href="/vault"      label="Documentos" icon={FolderLock} />
            </div>
          </nav>

          {/* Children — flexShrink:0 → ALWAYS pinned at bottom, never pushed off ── */}
          <div style={{
            flexShrink: 0,
            padding: '12px 12px 16px',
            borderTop: '1px solid rgba(61,102,65,0.14)',
          }}>
            {sidebarChildren.length > 0 && (
              <>
                <div style={{ fontSize:10, fontWeight:800, letterSpacing:'0.15em', textTransform:'uppercase',
                  padding:'0 8px 9px', color:'rgba(26,43,28,0.36)' }}>
                  Filhos
                </div>
                {sidebarChildren.map(child => {
                  const age = calcAge(child.birth_date)
                  return (
                    <Link key={child.id} href="/children">
                      <div className="flex items-center gap-3 transition-all duration-150 hover:translate-x-1 cursor-pointer"
                        style={{
                          padding:'8px 12px', borderRadius:13, marginBottom:5,
                          background:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.045'/%3E%3C/svg%3E"), rgba(255,255,255,0.62)`,
                          backgroundSize:'200px 200px, 100% 100%',
                          border:'1px solid rgba(61,102,65,0.18)',
                          boxShadow:'0 2px 10px rgba(44,74,46,0.09),0 -1px 0 rgba(255,255,255,0.85) inset,inset 1px 0 rgba(255,255,255,0.55)',
                        }}>
                        <div style={{
                          width:32, height:32, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                          background: child.avatar_color || 'linear-gradient(140deg,#5A8C5E,#2C4A2E)',
                          fontFamily:'var(--font-lora)', fontWeight:700, fontSize:14, color:'white',
                          boxShadow:'0 2px 8px rgba(0,0,0,0.15)',
                        }}>
                          {child.name.charAt(0).toUpperCase()}
                        </div>
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
                })}
              </>
            )}
            <button onClick={handleLogout}
              className="w-full transition-all hover:bg-black/[0.04] rounded-[8px]"
              style={{ fontSize:11, fontWeight:500, color:'rgba(26,43,28,0.28)', padding:'6px 0', marginTop:4 }}>
              Sair da conta
            </button>
          </div>

        </aside>

        {/* ══ MAIN ══
            pb-[58px] on mobile = height of bottom nav bar so last content
            is always reachable above the fixed bar                         ══ */}
        <main className="flex-1 md:ml-[256px] musgo-bg relative z-[1] flex flex-col"
          style={{
            minHeight: '100vh',
            paddingBottom: 'calc(58px + env(safe-area-inset-bottom, 0px))',
          }}>

          {/* Mobile topbar */}
          <div className="md:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-30"
            style={{ background:'rgba(248,243,234,0.94)', backdropFilter:'blur(18px)', borderBottom:'1px solid rgba(61,102,65,0.12)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[10px] flex items-center justify-center"
                style={{ background:'linear-gradient(140deg,#2C4A2E,#1E3320)' }}>
                <Leaf size={16} color="#D4E8D5" />
              </div>
              <span style={{ fontFamily:'var(--font-lora)', fontSize:16, fontWeight:700, color:'#1A2B1C' }}>
                Família em Foco
              </span>
            </div>
            <Link href="/ia">
              <div className="flex items-center gap-2 rounded-[14px] px-4"
                style={{ height:40, background:'linear-gradient(140deg,#3D6641,#2C4A2E)', boxShadow:'0 4px 14px rgba(44,74,46,0.32)' }}>
                <Sparkles size={16} color="#D4E8D5" />
                <span style={{ fontSize:13, fontWeight:700, color:'#D4E8D5', letterSpacing:'-0.01em' }}>Captura por IA</span>
              </div>
            </Link>
          </div>

          {children}
        </main>

      </div>{/* end app-wrap */}

      {/* ══ BOTTOM NAV — OUTSIDE app-wrap so CSS filter doesn't break position:fixed ══
          When a parent has filter≠none it becomes a containing block for fixed children,
          making them "fixed to the parent" not to the viewport. Moving nav here (sibling
          of app-wrap, same as TEMA panel) fixes this.
          Ordem: Início · Escola · Atividades · Saúde · Docs · Agenda                 ══ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40"
        style={{ paddingBottom:'env(safe-area-inset-bottom, 0px)' }}>
        <div style={{
          background:'rgba(242,234,216,0.97)',
          backdropFilter:'blur(20px)',
          borderTop:'1px solid rgba(61,102,65,0.18)',
          boxShadow:'0 -4px 16px rgba(44,74,46,0.10)',
        }}>
          <div style={{ display:'flex', alignItems:'center', height:58 }}>
            {([
              { href:'/dashboard',  label:'Início',     icon:LayoutDashboard },
              { href:'/escola',     label:'Escola',     icon:BookOpen        },
              { href:'/atividades', label:'Atividades', icon:Trophy          },
              { href:'/saude',      label:'Saúde',      icon:HeartPulse      },
              { href:'/vault',      label:'Docs',       icon:FolderLock      },
              { href:'/calendario', label:'Agenda',     icon:CalendarDays    },
            ] as const).map(({ href, label, icon: Icon }) => {
              const active = isActive(href)
              return (
                <Link key={href} href={href}
                  style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', position:'relative', padding:'8px 0' }}>
                  <span style={{ color: active ? '#3D6641' : 'rgba(26,43,28,0.32)', transition:'color .15s' }}>
                    <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
                  </span>
                  <span style={{
                    fontSize:'8.5px', fontWeight:600, lineHeight:1, marginTop:3, letterSpacing:'0.01em',
                    color: active ? '#3D6641' : 'rgba(26,43,28,0.32)',
                  }}>
                    {label}
                  </span>
                  {active && (
                    <span style={{
                      position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)',
                      width:20, height:2.5, borderRadius:'2px 2px 0 0',
                      background:'linear-gradient(90deg,#5A8C5E,#C49A6C)',
                    }} />
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* ══ TEMA PANEL — sibling of app-wrap, NOT affected by filter ══ */}
      <div className="hidden md:block fixed z-[200]"
        style={{ right:0, top:'50%', transform:'translateY(-50%)' }}>
        <div style={{ display:'flex', alignItems:'stretch' }}>

          {/* Panel body */}
          <div style={{
            overflow:'hidden',
            width: temaOpen ? 272 : 0,
            transition:'width 350ms cubic-bezier(.4,0,.2,1)',
            borderLeft: temaOpen ? '1px solid rgba(61,102,65,0.22)' : 'none',
            background:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E"),linear-gradient(175deg,#F2EAD8 0%,#E8DEC8 100%)`,
            backgroundSize:'200px 200px, 100% 100%',
            boxShadow:'-6px 0 28px rgba(0,0,0,0.12)',
            borderRadius:'14px 0 0 14px',
          }}>
            <div style={{ width:272, minWidth:272, padding:24 }}>

              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:24,
                fontFamily:'var(--font-lora)', fontSize:17, fontWeight:600, color:'#1A2B1C' }}>
                <Palette size={16} color="#3D6641" /> Personalizar Tema
              </div>

              {/* Palette */}
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, fontWeight:700, marginBottom:12, color:'rgba(26,43,28,0.55)' }}>Paleta de cor</div>
                <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                  {PALETTES.map((p, i) => (
                    <button key={p.name} title={p.name} onClick={() => setPalIdx(i)}
                      style={{
                        width:32, height:32, borderRadius:11, background:p.dot, cursor:'pointer',
                        boxShadow: palIdx===i ? '0 4px 14px rgba(0,0,0,0.28)' : '0 2px 8px rgba(44,74,46,0.12)',
                        border: palIdx===i ? '2.5px solid rgba(0,0,0,0.28)' : '2px solid transparent',
                        transform: palIdx===i ? 'scale(1.20)' : undefined,
                        transition:'all .2s',
                      }} />
                  ))}
                </div>
                <div style={{ fontSize:11, fontStyle:'italic', marginTop:8, color:'rgba(26,43,28,0.38)' }}>
                  {PALETTES[palIdx].name}
                </div>
              </div>

              {/* Sliders — light mode only */}
              {!darkMode && (
                <>
                  {[
                    { label:'Calor', val:sepia,      set:setSepia,      min:0,  max:40  },
                    { label:'Brilho',val:brightness, set:setBrightness, min:70, max:130 },
                    { label:'Contraste',val:contrast, set:setContrast,  min:80, max:130 },
                  ].map(({ label, val, set, min, max }) => (
                    <div key={label} style={{ marginBottom:16 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, fontWeight:700, marginBottom:8, color:'rgba(26,43,28,0.55)' }}>
                        {label} <span style={{ fontStyle:'italic', color:'rgba(26,43,28,0.35)' }}>{val}{label==='Calor'?'%':''}</span>
                      </div>
                      <input type="range" min={min} max={max} value={val} onChange={e => set(+e.target.value)} />
                    </div>
                  ))}
                </>
              )}

              <div style={{ height:1, background:'rgba(61,102,65,0.14)', margin:'16px 0' }} />

              {/* Dark mode toggle */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ fontSize:13, fontWeight:700, display:'flex', alignItems:'center', gap:8, color:'rgba(26,43,28,0.55)' }}>
                  {darkMode ? <Moon size={14}/> : <Sun size={14}/>}
                  {darkMode ? 'Modo noturno' : 'Modo claro'}
                </div>
                <button onClick={() => setDarkMode(d => !d)}
                  style={{
                    position:'relative', width:44, height:24, borderRadius:12, border:'none', cursor:'pointer',
                    background: darkMode ? 'linear-gradient(135deg,#3D6641,#2C4A2E)' : 'rgba(61,102,65,0.22)',
                    boxShadow:'0 1px 4px rgba(0,0,0,0.12)', flexShrink:0, transition:'background .25s',
                  }}>
                  <span style={{
                    position:'absolute', top:3, width:18, height:18, borderRadius:'50%', background:'white',
                    boxShadow:'0 2px 5px rgba(0,0,0,0.22)',
                    left: darkMode ? 23 : 3,
                    transition:'left .3s cubic-bezier(.4,0,.2,1)',
                  }} />
                </button>
              </div>

              {darkMode && (
                <p style={{ fontSize:10.5, fontStyle:'italic', marginTop:12, color:'rgba(26,43,28,0.40)', lineHeight:1.5 }}>
                  Os tons do app são invertidos elegantemente mantendo a identidade visual.
                </p>
              )}
            </div>
          </div>

          {/* Tab button */}
          <button onClick={() => setTemaOpen(o => !o)}
            style={{
              width:34, borderRadius: temaOpen ? '0' : '12px 0 0 12px',
              background:'linear-gradient(180deg,#2C4A2E,#1E3320)',
              writingMode:'vertical-rl', textOrientation:'mixed',
              fontSize:'10.5px', fontWeight:800, letterSpacing:'0.14em',
              textTransform:'uppercase', color:'#D4E8D5',
              padding:'20px 0', display:'flex', alignItems:'center', justifyContent:'center',
              border:'none', cursor:'pointer', userSelect:'none',
              boxShadow:'-4px 0 16px rgba(44,74,46,0.22)',
              transition:'border-radius .35s',
            }}>
            Tema
          </button>
        </div>
      </div>

    </div>
  )
}
