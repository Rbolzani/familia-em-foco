'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, BookOpen, HeartPulse, Trophy,
  CalendarDays, FolderLock, Baby, Sparkles, LogOut, Settings, Leaf,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/dashboard',  label: 'Dashboard',    icon: LayoutDashboard, color: '#3D6641', bg: 'rgba(61,102,65,0.10)'  },
  { href: '/children',   label: 'Filhos',        icon: Baby,            color: '#C49A6C', bg: 'rgba(196,154,108,0.12)' },
  { href: '/escola',     label: 'Escola',        icon: BookOpen,        color: '#2563EB', bg: 'rgba(37,99,235,0.09)'  },
  { href: '/saude',      label: 'Saúde',         icon: HeartPulse,      color: '#065F46', bg: 'rgba(6,95,70,0.09)'   },
  { href: '/atividades', label: 'Atividades',    icon: Trophy,          color: '#92400E', bg: 'rgba(146,64,14,0.09)' },
  { href: '/calendario', label: 'Calendário',    icon: CalendarDays,    color: '#3D6641', bg: 'rgba(61,102,65,0.10)'  },
  { href: '/ia',         label: 'Assistente IA', icon: Sparkles,        color: '#3D6641', bg: 'rgba(61,102,65,0.10)'  },
  { href: '/vault',      label: 'Documentos',    icon: FolderLock,      color: '#6D28D9', bg: 'rgba(109,40,217,0.09)' },
]

const mobileItems = [
  { href: '/dashboard',  label: 'Início',  icon: LayoutDashboard },
  { href: '/escola',     label: 'Escola',  icon: BookOpen        },
  { href: '/ia',         label: 'IA',      icon: Sparkles        },
  { href: '/saude',      label: 'Saúde',   icon: HeartPulse      },
  { href: '/calendario', label: 'Agenda',  icon: CalendarDays    },
]

// Shared card styles (paper texture via inline gradient)
const CARD_BG   = 'linear-gradient(160deg,#FFFFFF 0%,#F8F3EA 100%)'
const CARD_SHD  = '0 4px 16px rgba(44,74,46,0.09),0 1px 4px rgba(44,74,46,0.06),0 -1px 0 rgba(255,255,255,0.85) inset'
const BORDER    = '1px solid rgba(61,102,65,0.18)'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#F8F3EA' }}>

      {/* ══ SIDEBAR — Desktop ══ */}
      <aside className="hidden md:flex flex-col w-[256px] fixed h-full z-40"
        style={{
          background: 'linear-gradient(175deg,#F2EAD8 0%,#E8DEC8 100%)',
          borderRight: BORDER,
          boxShadow: '4px 0 24px rgba(44,74,46,0.07)',
        }}>

        {/* Organic left accent stripe */}
        <div className="absolute top-16 bottom-16 left-0 w-[3px] rounded-r pointer-events-none"
          style={{ background: 'linear-gradient(180deg,transparent 0%,#5A8C5E 20%,#3D6641 50%,#C49A6C 80%,transparent 100%)', opacity: 0.55 }} />

        {/* Logo */}
        <div className="px-5 pt-7 pb-6" style={{ borderBottom: BORDER }}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-[15px] flex items-center justify-center flex-none relative"
              style={{
                background: 'linear-gradient(140deg,#2C4A2E,#1E3320)',
                boxShadow: '0 4px 14px rgba(44,74,46,0.30),0 -1px 0 rgba(255,255,255,0.12) inset',
              }}>
              <Leaf size={20} color="#D4E8D5" />
              {/* corner gem */}
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-tl-none rounded-tr-full rounded-bl-full rounded-br-none"
                style={{ background: '#C49A6C', opacity: 0.85, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </div>
            <div>
              <div className="font-bold text-[15px] leading-tight"
                style={{ fontFamily: 'var(--font-lora)', color: '#1A2B1C' }}>
                Família em Foco
              </div>
              <div className="text-[11.5px] mt-0.5 italic" style={{ color: 'rgba(26,43,28,0.40)' }}>
                sua rotina, com leveza
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">

          <div className="px-2.5 pb-2">
            <div className="text-[9px] font-extrabold tracking-[0.16em] uppercase flex items-center gap-2"
              style={{ color: 'rgba(26,43,28,0.33)' }}>
              Principal
              <div className="flex-1 h-px" style={{ background: 'rgba(61,102,65,0.14)' }} />
            </div>
          </div>

          {navItems.slice(0, 3).map(({ href, label, icon: Icon, color, bg }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link key={href} href={href}
                className="group flex items-center gap-3 px-3 py-[10px] rounded-[13px] text-[15px] font-medium transition-all duration-150 relative"
                style={active
                  ? { background: bg, color, fontWeight: 700, border: `1px solid rgba(61,102,65,0.18)`,
                      boxShadow: '0 2px 8px rgba(44,74,46,0.09),0 -1px 0 rgba(255,255,255,0.55) inset' }
                  : { color: 'rgba(26,43,28,0.55)' }
                }
              >
                {/* Active marker */}
                {active && <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-1 h-6 rounded-r"
                  style={{ background: 'linear-gradient(180deg,#5A8C5E,#C49A6C)' }} />}
                <span className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-none transition-all"
                  style={active
                    ? { background: `${color}18`, color, boxShadow: '0 1px 3px rgba(0,0,0,0.09),0 -1px 0 rgba(255,255,255,0.55) inset' }
                    : { background: 'rgba(61,102,65,0.06)', color: 'rgba(26,43,28,0.30)' }
                  }>
                  <Icon size={16} strokeWidth={active ? 2.5 : 1.8} />
                </span>
                <span>{label}</span>
              </Link>
            )
          })}

          <div className="px-2.5 pt-3 pb-2">
            <div className="text-[9px] font-extrabold tracking-[0.16em] uppercase flex items-center gap-2"
              style={{ color: 'rgba(26,43,28,0.33)' }}>
              Módulos
              <div className="flex-1 h-px" style={{ background: 'rgba(61,102,65,0.14)' }} />
            </div>
          </div>

          {navItems.slice(3).map(({ href, label, icon: Icon, color, bg }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link key={href} href={href}
                className="group flex items-center gap-3 px-3 py-[10px] rounded-[13px] text-[15px] font-medium transition-all duration-150 relative"
                style={active
                  ? { background: bg, color, fontWeight: 700, border: `1px solid rgba(61,102,65,0.18)`,
                      boxShadow: '0 2px 8px rgba(44,74,46,0.09),0 -1px 0 rgba(255,255,255,0.55) inset' }
                  : { color: 'rgba(26,43,28,0.55)' }
                }
              >
                {active && <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-1 h-6 rounded-r"
                  style={{ background: 'linear-gradient(180deg,#5A8C5E,#C49A6C)' }} />}
                <span className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-none transition-all"
                  style={active
                    ? { background: `${color}18`, color, boxShadow: '0 1px 3px rgba(0,0,0,0.09),0 -1px 0 rgba(255,255,255,0.55) inset' }
                    : { background: 'rgba(61,102,65,0.06)', color: 'rgba(26,43,28,0.30)' }
                  }>
                  <Icon size={16} strokeWidth={active ? 2.5 : 1.8} />
                </span>
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-6 pt-4 space-y-0.5" style={{ borderTop: BORDER }}>
          <Link href="/settings"
            className="flex items-center gap-3 px-3 py-[10px] rounded-[13px] text-[15px] font-medium transition-all hover:bg-black/[0.04]"
            style={{ color: 'rgba(26,43,28,0.50)' }}>
            <span className="w-8 h-8 rounded-[10px] flex items-center justify-center" style={{ background: 'rgba(61,102,65,0.06)', color: 'rgba(26,43,28,0.30)' }}>
              <Settings size={15} />
            </span>
            Configurações
          </Link>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-[10px] rounded-[13px] text-[15px] font-medium transition-all hover:bg-black/[0.04]"
            style={{ color: 'rgba(26,43,28,0.50)' }}>
            <span className="w-8 h-8 rounded-[10px] flex items-center justify-center" style={{ background: 'rgba(61,102,65,0.06)', color: 'rgba(26,43,28,0.30)' }}>
              <LogOut size={15} />
            </span>
            Sair
          </button>
        </div>
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
          borderTop: BORDER,
          boxShadow: '0 -2px 12px rgba(44,74,46,0.08)',
        }}>
        <div className="flex items-end h-16">
          {mobileItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            const isAI = href === '/ia'
            return (
              <Link key={href} href={href}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 h-full relative">
                {isAI ? (
                  <span className="w-12 h-12 rounded-2xl flex items-center justify-center -mt-5"
                    style={{
                      background: 'linear-gradient(140deg,#3D6641,#1E3320)',
                      boxShadow: '0 4px 18px rgba(44,74,46,0.35),0 -1px 0 rgba(255,255,255,0.14) inset',
                      color: '#D4E8D5',
                    }}>
                    <Sparkles size={20} strokeWidth={2} />
                  </span>
                ) : (
                  <>
                    <span className={`transition-all duration-200 ${active ? 'scale-110' : 'scale-100'}`}
                      style={{ color: active ? '#3D6641' : 'rgba(26,43,28,0.35)' }}>
                      <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                    </span>
                    <span className="text-[10px] font-semibold leading-none"
                      style={{ color: active ? '#3D6641' : 'rgba(26,43,28,0.35)' }}>
                      {label}
                    </span>
                    {active && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-t"
                        style={{ background: 'linear-gradient(90deg,#5A8C5E,#C49A6C)' }} />
                    )}
                  </>
                )}
              </Link>
            )
          })}
        </div>
      </nav>

    </div>
  )
}
