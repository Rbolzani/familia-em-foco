'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, BookOpen, HeartPulse, Star,
  Calendar, FileText, Baby, Sparkles, LogOut, Settings,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/dashboard',  label: 'Início',       icon: LayoutDashboard, color: '#7B6FE8', bg: '#E8E4FF' },
  { href: '/children',   label: 'Filhos',        icon: Baby,            color: '#F4A7B9', bg: '#FFF0F4' },
  { href: '/escola',     label: 'Escola',         icon: BookOpen,        color: '#93C5FD', bg: '#EFF6FF' },
  { href: '/saude',      label: 'Saúde',          icon: HeartPulse,      color: '#A8DDB5', bg: '#F0FAF2' },
  { href: '/atividades', label: 'Atividades',     icon: Star,            color: '#FFE4A0', bg: '#FFF8EC' },
  { href: '/calendario', label: 'Calendário',     icon: Calendar,        color: '#C084FC', bg: '#F5F0FF' },
  { href: '/ia',         label: 'IA',             icon: Sparkles,        color: '#7B6FE8', bg: '#E8E4FF' },
  { href: '/vault',      label: 'Documentos',     icon: FileText,        color: '#8585A8', bg: '#F0F0F8' },
]

const mobileItems = [
  { href: '/dashboard',  label: 'Início',    icon: LayoutDashboard },
  { href: '/escola',     label: 'Escola',     icon: BookOpen        },
  { href: '/ia',         label: 'IA',         icon: Sparkles        },
  { href: '/saude',      label: 'Saúde',      icon: HeartPulse      },
  { href: '/calendario', label: 'Agenda',     icon: Calendar        },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <div className="flex min-h-screen">

      {/* ══ SIDEBAR — Desktop ══ */}
      <aside className="hidden md:flex flex-col w-[240px] fixed h-full z-40"
        style={{ background: '#FEFEFE', borderRight: '1px solid rgba(123,111,232,0.10)', boxShadow: '4px 0 24px rgba(123,111,232,0.06)' }}>

        {/* Logo */}
        <div className="px-5 pt-6 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-none"
              style={{ background: 'linear-gradient(135deg,#7B6FE8,#C084FC)', boxShadow: '0 4px 14px rgba(123,111,232,0.35)' }}>
              🧒
            </div>
            <div>
              <div className="font-bold text-sm leading-tight" style={{ fontFamily: 'var(--font-gilda)', color: '#1A1535' }}>
                Família em Foco
              </div>
              <div className="text-xs mt-0.5" style={{ color: '#8585A8' }}>
                Seu lar organizado
              </div>
            </div>
          </div>
        </div>

        <div className="mx-4 mb-4 h-px" style={{ background: 'rgba(123,111,232,0.08)' }} />

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon, color, bg }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link key={href} href={href}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all duration-150`}
                style={active
                  ? { background: bg, color: color }
                  : { color: '#8585A8' }
                }
              >
                <span className="w-8 h-8 rounded-xl flex items-center justify-center flex-none transition-all"
                  style={active
                    ? { background: `${color}22`, color: color }
                    : { background: 'rgba(123,111,232,0.06)', color: '#B0AFCC' }
                  }>
                  <Icon size={16} strokeWidth={active ? 2.5 : 1.8} />
                </span>
                <span className={active ? 'font-semibold' : ''}>{label}</span>
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-6 pt-3 space-y-0.5" style={{ borderTop: '1px solid rgba(123,111,232,0.08)' }}>
          <Link href="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all"
            style={{ color: '#8585A8' }}
          >
            <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(123,111,232,0.06)', color: '#B0AFCC' }}>
              <Settings size={15} />
            </span>
            Configurações
          </Link>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all"
            style={{ color: '#8585A8' }}
          >
            <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(123,111,232,0.06)', color: '#B0AFCC' }}>
              <LogOut size={15} />
            </span>
            Sair
          </button>
        </div>
      </aside>

      {/* ══ MAIN CONTENT ══ */}
      <main className="flex-1 md:ml-[240px] pb-24 md:pb-0 min-h-screen mesh-bg">
        {children}
      </main>

      {/* ══ BOTTOM NAV — Mobile ══ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 safe-bottom"
        style={{ background: 'rgba(254,254,254,0.92)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(123,111,232,0.10)' }}>
        <div className="flex items-end h-16">
          {mobileItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            const isAI = href === '/ia'
            return (
              <Link key={href} href={href}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 h-full relative">
                {isAI ? (
                  <span className="w-12 h-12 rounded-2xl flex items-center justify-center text-white -mt-5"
                    style={{ background: 'linear-gradient(135deg,#7B6FE8,#C084FC)', boxShadow: '0 4px 20px rgba(123,111,232,0.40)' }}>
                    <Sparkles size={20} strokeWidth={2} />
                  </span>
                ) : (
                  <>
                    <span className={`transition-all duration-200 ${active ? 'scale-110' : 'scale-100'}`}
                      style={{ color: active ? '#7B6FE8' : '#C0BFD5' }}>
                      <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                    </span>
                    <span className="text-[10px] font-semibold leading-none"
                      style={{ color: active ? '#7B6FE8' : '#C0BFD5' }}>
                      {label}
                    </span>
                    {active && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                        style={{ background: '#7B6FE8' }} />
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
