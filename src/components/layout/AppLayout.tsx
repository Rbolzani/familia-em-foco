'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, BookOpen, HeartPulse, Trophy,
  CalendarDays, FolderLock, Sparkles, Leaf,
  ChevronRight, Palette, Moon, Sun,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ── Types ──────────────────────────────────────────────────────────
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

// ── Nav structure (exact match approved design) ────────────────────
const PRINCIPAL = [
  { href: '/dashboard',  label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/calendario', label: 'Calendário',    icon: CalendarDays    },
  { href: '/ia',         label: 'Assistente IA', icon: Sparkles        },
]

const MODULOS = [
  { href: '/escola',     label: 'Escola',     icon: BookOpen  },
  { href: '/saude',      label: 'Saúde',      icon: HeartPulse},
  { href: '/atividades', label: 'Atividades', icon: Trophy    },
  { href: '/vault',      label: 'Documentos', icon: FolderLock},
]

// Colour palette options (exact from approved theme panel)
const PALETTES = [
  { name: 'Floresta', md:'#3D6641', dk:'#2C4A2E', xdk:'#1E3320', lt:'#5A8C5E', dot:'linear-gradient(140deg,#5A8C5E,#2C4A2E)' },
  { name: 'Índigo',   md:'#4F46E5', dk:'#3730A3', xdk:'#1E1B4B', lt:'#818CF8', dot:'linear-gradient(140deg,#6366F1,#3730A3)' },
  { name: 'Âmbar',    md:'#D97706', dk:'#92400E', xdk:'#451A03', lt:'#FCD34D', dot:'linear-gradient(140deg,#F59E0B,#92400E)' },
  { name: 'Rosa',     md:'#DB2777', dk:'#9D174D', xdk:'#500724', lt:'#F9A8D4', dot:'linear-gradient(140deg,#EC4899,#9D174D)' },
  { name: 'Ardósia',  md:'#475569', dk:'#1E293B', xdk:'#0F172A', lt:'#94A3B8', dot:'linear-gradient(140deg,#475569,#0F172A)' },
]

function calcAge(birthDate: string | null) {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  if (today.getMonth() < birth.getMonth() ||
     (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--
  return age
}

// ── Component ──────────────────────────────────────────────────────
export default function AppLayout({ children, sidebarChildren }: Props) {
  const pathname  = usePathname()
  const router    = useRouter()
  const [temaOpen, setTemaOpen]     = useState(false)
  const [palIdx, setPalIdx]         = useState(0)
  const [sepia, setSepia]           = useState(0)
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast]     = useState(100)
  const [darkMode, setDarkMode]     = useState(false)

  // Apply CSS variables / filter when theme controls change
  useEffect(() => {
    const root = document.documentElement
    const p = PALETTES[palIdx]
    root.style.setProperty('--green-md',  p.md)
    root.style.setProperty('--green-dk',  p.dk)
    root.style.setProperty('--green-xdk', p.xdk)
    root.style.setProperty('--green-lt',  p.lt)
    document.body.style.filter = `sepia(${sepia}%) brightness(${brightness}%) contrast(${contrast}%)`
    document.body.dataset.mode = darkMode ? 'dark' : ''
  }, [palIdx, sepia, brightness, contrast, darkMode])

  async function handleLogout() {
    await createClient().auth.signOut()
    router.push('/auth/login')
  }

  function isActive(href: string) {
    return pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
  }

  // Shared active style — white 70% bg, dark green text (exact match approved)
  function activeStyle(): React.CSSProperties {
    return {
      background: 'rgba(255,255,255,0.70)',
      color: '#2C4A2E',
      fontWeight: 700,
      border: '1px solid rgba(61,102,65,0.22)',
      boxShadow: '0 2px 8px rgba(44,74,46,0.10),0 -1px 0 rgba(255,255,255,0.80) inset',
    }
  }

  function inactiveStyle(): React.CSSProperties {
    return { color: 'rgba(26,43,28,0.55)' }
  }

  function NavItem({ href, label, icon: Icon, badge }: { href: string; label: string; icon: React.ElementType; badge?: number }) {
    const active = isActive(href)
    return (
      <Link href={href}
        className="group flex items-center gap-3 px-3 py-[11px] rounded-[13px] text-[15px] font-medium transition-all duration-150 relative mb-[3px]"
        style={active ? activeStyle() : inactiveStyle()}>

        {/* Organic active left marker */}
        {active && (
          <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-1 h-6 rounded-r pointer-events-none"
            style={{ background: 'linear-gradient(180deg,#5A8C5E,#C49A6C)' }} />
        )}

        {/* Nav icon box */}
        <div className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-none transition-all"
          style={active
            ? { background: 'rgba(61,102,65,0.14)', color: '#2C4A2E', boxShadow: '0 1px 3px rgba(44,74,46,0.15)' }
            : { background: 'rgba(61,102,65,0.07)', color: 'rgba(26,43,28,0.30)' }
          }>
          <Icon size={16} strokeWidth={active ? 2.5 : 1.8} />
        </div>

        <span className="flex-1">{label}</span>

        {badge !== undefined && badge > 0 && (
          <div className="text-[10.5px] font-extrabold min-w-[20px] h-5 rounded-[7px] flex items-center justify-center px-[5px]"
            style={{ background: '#2C4A2E', color: '#D4E8D5', boxShadow: '0 2px 8px rgba(44,74,46,0.10)' }}>
            {badge}
          </div>
        )}
      </Link>
    )
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#F8F3EA' }}>

      {/* ══ SIDEBAR — Desktop ══ */}
      <aside className="hidden md:flex flex-col w-[256px] fixed h-full z-40"
        style={{
          background: `
            repeating-linear-gradient(180deg, transparent 0px, transparent 56px, rgba(61,102,65,0.028) 56px, rgba(61,102,65,0.028) 57px),
            linear-gradient(175deg, #F2EAD8 0%, #E8DEC8 100%)
          `,
          borderRight: '1px solid rgba(61,102,65,0.22)',
          boxShadow: '4px 0 24px rgba(44,74,46,0.07)',
        }}>

        {/* Organic left accent stripe */}
        <div className="absolute pointer-events-none"
          style={{
            top: 60, left: 0, bottom: 60, width: 3, borderRadius: '0 3px 3px 0',
            background: 'linear-gradient(180deg,transparent 0%,#5A8C5E 15%,#3D6641 45%,#C49A6C 75%,transparent 100%)',
            opacity: 0.55,
          }} />

        {/* ── Logo ── */}
        <div className="px-5 pt-7 pb-6" style={{ borderBottom: '1px solid rgba(61,102,65,0.14)' }}>
          <div className="flex items-center gap-[14px]">
            <div className="w-[46px] h-[46px] rounded-[15px] flex items-center justify-center flex-none relative"
              style={{
                background: 'linear-gradient(140deg,#2C4A2E,#1E3320)',
                boxShadow: '0 6px 20px rgba(44,74,46,0.12),0 1px 4px rgba(44,74,46,0.08),0 -1px 0 rgba(255,255,255,0.70) inset,0 0 0 1px rgba(255,255,255,0.12) inset',
              }}>
              <Leaf size={22} color="#D4E8D5" />
              <div className="absolute" style={{ top:-3, right:-3, width:12, height:12, borderRadius:'50% 0 50% 0', background:'#C49A6C', opacity:0.8, boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
            </div>
            <div>
              <div className="font-bold leading-tight"
                style={{ fontFamily:'var(--font-lora)', fontSize:17, color:'#1A2B1C', letterSpacing:'-0.01em' }}>
                Família em Foco
              </div>
              <div className="text-[11.5px] mt-0.5 italic" style={{ color:'rgba(26,43,28,0.40)' }}>
                sua rotina, com leveza
              </div>
            </div>
          </div>
        </div>

        {/* ── Nav ── */}
        <nav className="flex-1 px-3 py-5 overflow-y-auto">

          {/* PRINCIPAL */}
          <div className="mb-[26px]">
            <div className="text-[10px] font-extrabold tracking-[0.16em] uppercase flex items-center gap-2 px-2.5 pb-[10px]"
              style={{ color:'rgba(26,43,28,0.36)' }}>
              Principal
              <div className="flex-1 h-px" style={{ background:'rgba(61,102,65,0.14)' }} />
            </div>
            <NavItem href="/dashboard"  label="Dashboard"    icon={LayoutDashboard} />
            <NavItem href="/calendario" label="Calendário"   icon={CalendarDays}    badge={5} />
            <NavItem href="/ia"         label="Assistente IA" icon={Sparkles}       />
          </div>

          {/* MÓDULOS */}
          <div className="mb-[26px]">
            <div className="text-[10px] font-extrabold tracking-[0.16em] uppercase flex items-center gap-2 px-2.5 pb-[10px]"
              style={{ color:'rgba(26,43,28,0.36)' }}>
              Módulos
              <div className="flex-1 h-px" style={{ background:'rgba(61,102,65,0.14)' }} />
            </div>
            <NavItem href="/escola"     label="Escola"     icon={BookOpen}   badge={3} />
            <NavItem href="/saude"      label="Saúde"      icon={HeartPulse} />
            <NavItem href="/atividades" label="Atividades" icon={Trophy}     />
            <NavItem href="/vault"      label="Documentos" icon={FolderLock} />
          </div>
        </nav>

        {/* ── Children at bottom ── */}
        {sidebarChildren.length > 0 && (
          <div className="px-3 pb-7 pt-[18px]" style={{ borderTop:'1px solid rgba(61,102,65,0.14)', marginTop:'auto' }}>
            <div className="text-[10px] font-extrabold tracking-[0.15em] uppercase px-2 pb-[10px]"
              style={{ color:'rgba(26,43,28,0.36)' }}>
              Filhos
            </div>
            {sidebarChildren.map(child => {
              const age = calcAge(child.birth_date)
              return (
                <Link key={child.id} href="/children">
                  <div className="flex items-center gap-3 px-3 py-[10px] rounded-[13px] mb-[7px] transition-all duration-200 hover:translate-x-1 cursor-pointer"
                    style={{
                      background:'rgba(255,255,255,0.60)',
                      border:'1px solid rgba(61,102,65,0.14)',
                      boxShadow:'0 2px 8px rgba(44,74,46,0.10),0 -1px 0 rgba(255,255,255,0.70) inset',
                    }}>
                    {/* Avatar */}
                    <div className="w-[34px] h-[34px] rounded-[11px] flex items-center justify-center flex-none"
                      style={{
                        background: child.avatar_color || 'linear-gradient(140deg,#5A8C5E,#2C4A2E)',
                        fontFamily:'var(--font-lora)', fontWeight:700, fontSize:15, color:'white',
                        boxShadow:'0 2px 8px rgba(44,74,46,0.10),0 -1px 0 rgba(255,255,255,0.20) inset',
                      }}>
                      {child.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-bold truncate" style={{ color:'#1A2B1C' }}>{child.name}</div>
                      {(age !== null || child.school_name) && (
                        <div className="text-[11.5px] italic" style={{ color:'rgba(26,43,28,0.36)' }}>
                          {age !== null ? `${age} anos` : ''}{age !== null && child.school_name ? ' · ' : ''}{child.school_name ?? ''}
                        </div>
                      )}
                    </div>
                    <ChevronRight size={14} color="rgba(26,43,28,0.30)" />
                  </div>
                </Link>
              )
            })}

            {/* Subtle logout */}
            <button onClick={handleLogout}
              className="w-full text-[11px] font-medium mt-2 py-1.5 rounded-[8px] transition-all hover:bg-black/[0.04]"
              style={{ color:'rgba(26,43,28,0.30)' }}>
              Sair da conta
            </button>
          </div>
        )}

        {/* Fallback bottom if no children */}
        {sidebarChildren.length === 0 && (
          <div className="px-3 pb-6 pt-4" style={{ borderTop:'1px solid rgba(61,102,65,0.14)', marginTop:'auto' }}>
            <button onClick={handleLogout}
              className="w-full text-[11px] font-medium py-1.5 rounded-[8px] transition-all hover:bg-black/[0.04]"
              style={{ color:'rgba(26,43,28,0.30)' }}>
              Sair da conta
            </button>
          </div>
        )}
      </aside>

      {/* ══ MAIN CONTENT ══ */}
      <main className="flex-1 md:ml-[256px] pb-24 md:pb-0 min-h-screen musgo-bg relative z-[1]">
        {children}
      </main>

      {/* ══ BOTTOM NAV — Mobile ══ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 safe-bottom"
        style={{
          background: 'rgba(242,234,216,0.94)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(61,102,65,0.18)',
          boxShadow: '0 -2px 12px rgba(44,74,46,0.08)',
        }}>
        <div className="flex items-end h-16">
          {[
            { href:'/dashboard',  label:'Início', icon:LayoutDashboard },
            { href:'/escola',     label:'Escola', icon:BookOpen        },
            { href:'/ia',         label:'IA',     icon:Sparkles        },
            { href:'/saude',      label:'Saúde',  icon:HeartPulse      },
            { href:'/calendario', label:'Agenda', icon:CalendarDays    },
          ].map(({ href, label, icon: Icon }) => {
            const active = isActive(href)
            const isAI   = href === '/ia'
            return (
              <Link key={href} href={href} className="flex-1 flex flex-col items-center justify-center gap-0.5 h-full relative">
                {isAI ? (
                  <span className="w-12 h-12 rounded-2xl flex items-center justify-center -mt-5"
                    style={{ background:'linear-gradient(140deg,#3D6641,#1E3320)', boxShadow:'0 4px 18px rgba(44,74,46,0.35)', color:'#D4E8D5' }}>
                    <Sparkles size={20} strokeWidth={2} />
                  </span>
                ) : (
                  <>
                    <span style={{ color: active ? '#3D6641' : 'rgba(26,43,28,0.35)' }}>
                      <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                    </span>
                    <span className="text-[10px] font-semibold" style={{ color: active ? '#3D6641' : 'rgba(26,43,28,0.35)' }}>
                      {label}
                    </span>
                    {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-t"
                      style={{ background:'linear-gradient(90deg,#5A8C5E,#C49A6C)' }} />}
                  </>
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* ══ TEMA PANEL (right side tab) ══ */}
      <div className="fixed z-[200]" style={{ right:0, top:'50%', transform:'translateY(-50%)', display:'flex', alignItems:'stretch' }}>

        {/* Sliding panel */}
        <div className="overflow-hidden transition-all duration-[350ms]"
          style={{
            width: temaOpen ? 258 : 0,
            borderLeft: temaOpen ? '1px solid rgba(61,102,65,0.22)' : 'none',
            background: `
              url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E"),
              linear-gradient(175deg, #F2EAD8 0%, #E8DEC8 100%)
            `,
            backgroundSize: '200px 200px, 100% 100%',
            boxShadow: '-6px 0 28px rgba(0,0,0,0.12)',
          }}>

          {/* Inner (258px wide, overflows when panel is 0) */}
          <div className="p-6" style={{ width:258, minWidth:258 }}>
            <div className="flex items-center gap-2 mb-6"
              style={{ fontFamily:'var(--font-lora)', fontSize:18, fontWeight:600, color:'#1A2B1C' }}>
              <Palette size={18} color="#3D6641" />
              Personalizar Tema
            </div>

            {/* Palette */}
            <div className="mb-4">
              <div className="text-xs font-bold mb-[9px]" style={{ color:'rgba(26,43,28,0.58)' }}>Paleta de cor</div>
              <div className="flex gap-2 flex-wrap">
                {PALETTES.map((p, i) => (
                  <button key={p.name} title={p.name} onClick={() => setPalIdx(i)}
                    className="w-7 h-7 rounded-[9px] transition-all hover:scale-110"
                    style={{
                      background: p.dot,
                      boxShadow: palIdx === i ? '0 6px 20px rgba(44,74,46,0.12),0 1px 4px rgba(44,74,46,0.08)' : '0 2px 8px rgba(44,74,46,0.10)',
                      border: palIdx === i ? '2px solid rgba(0,0,0,0.22)' : '2px solid transparent',
                      transform: palIdx === i ? 'scale(1.15)' : undefined,
                    }} />
                ))}
              </div>
            </div>

            {/* Sepia */}
            <div className="mb-4">
              <div className="text-xs font-bold mb-[9px] flex justify-between" style={{ color:'rgba(26,43,28,0.58)' }}>
                Calor <span className="italic" style={{ color:'rgba(26,43,28,0.36)' }}>{sepia}%</span>
              </div>
              <input type="range" min={0} max={40} value={sepia} onChange={e => setSepia(+e.target.value)}
                className="w-full h-[5px] rounded cursor-pointer appearance-none"
                style={{ background:'rgba(61,102,65,0.22)' }} />
            </div>

            {/* Brightness */}
            <div className="mb-4">
              <div className="text-xs font-bold mb-[9px] flex justify-between" style={{ color:'rgba(26,43,28,0.58)' }}>
                Brilho <span className="italic" style={{ color:'rgba(26,43,28,0.36)' }}>{brightness}%</span>
              </div>
              <input type="range" min={60} max={130} value={brightness} onChange={e => setBrightness(+e.target.value)}
                className="w-full h-[5px] rounded cursor-pointer appearance-none"
                style={{ background:'rgba(61,102,65,0.22)' }} />
            </div>

            {/* Contrast */}
            <div className="mb-4">
              <div className="text-xs font-bold mb-[9px] flex justify-between" style={{ color:'rgba(26,43,28,0.58)' }}>
                Contraste <span className="italic" style={{ color:'rgba(26,43,28,0.36)' }}>{contrast}%</span>
              </div>
              <input type="range" min={80} max={130} value={contrast} onChange={e => setContrast(+e.target.value)}
                className="w-full h-[5px] rounded cursor-pointer appearance-none"
                style={{ background:'rgba(61,102,65,0.22)' }} />
            </div>

            <div className="h-px my-4" style={{ background:'rgba(61,102,65,0.14)' }} />

            {/* Dark mode */}
            <div className="flex items-center justify-between">
              <div className="text-[13px] font-bold flex items-center gap-2" style={{ color:'rgba(26,43,28,0.58)' }}>
                {darkMode ? <Moon size={14} /> : <Sun size={14} />}
                Modo noturno
              </div>
              <button onClick={() => setDarkMode(d => !d)}
                className="relative transition-all"
                style={{
                  width:42, height:22, borderRadius:11,
                  background: darkMode ? 'linear-gradient(135deg,#5A8C5E,#3D6641)' : 'rgba(61,102,65,0.22)',
                  boxShadow:'0 1px 4px rgba(0,0,0,0.12)',
                }}>
                <span className="absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white transition-all duration-300"
                  style={{ left: darkMode ? 22 : 2, boxShadow:'0 2px 5px rgba(0,0,0,0.22)' }} />
              </button>
            </div>
          </div>
        </div>

        {/* TEMA vertical tab */}
        <button onClick={() => setTemaOpen(o => !o)}
          className="flex items-center justify-center select-none"
          style={{
            width:34,
            background:'linear-gradient(180deg,#2C4A2E,#1E3320)',
            borderRadius:'12px 0 0 12px',
            writingMode:'vertical-rl',
            textOrientation:'mixed',
            fontSize:'10.5px', fontWeight:800, letterSpacing:'0.14em',
            textTransform:'uppercase', color:'#D4E8D5',
            padding:'20px 0',
            boxShadow:'-4px 0 16px rgba(44,74,46,0.25)',
          }}>
          Tema
        </button>
      </div>

    </div>
  )
}
