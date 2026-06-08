'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, BookOpen, HeartPulse, Star,
  Calendar, FileText, Baby, Sparkles, LogOut, Settings,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/dashboard',  label: 'Início',        icon: LayoutDashboard, color: '#F4522D' },
  { href: '/children',   label: 'Filhos',         icon: Baby,            color: '#F5A623' },
  { href: '/escola',     label: 'Escola',          icon: BookOpen,        color: '#2563EB' },
  { href: '/saude',      label: 'Saúde',           icon: HeartPulse,      color: '#00C48C' },
  { href: '/atividades', label: 'Atividades',      icon: Star,            color: '#7C3AED' },
  { href: '/calendario', label: 'Calendário',      icon: Calendar,        color: '#F5A623' },
  { href: '/ia',         label: 'IA',              icon: Sparkles,        color: '#F4522D' },
  { href: '/vault',      label: 'Documentos',      icon: FileText,        color: '#8B7A68' },
]

const mobileItems = [
  { href: '/dashboard',  label: 'Início',     icon: LayoutDashboard },
  { href: '/escola',     label: 'Escola',      icon: BookOpen        },
  { href: '/ia',         label: 'IA',          icon: Sparkles        },
  { href: '/saude',      label: 'Saúde',       icon: HeartPulse      },
  { href: '/calendario', label: 'Agenda',      icon: Calendar        },
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

      {/* ══════════════════════════════════════════
          SIDEBAR — Desktop
      ══════════════════════════════════════════ */}
      <aside className="hidden md:flex flex-col w-[240px] fixed h-full z-40"
        style={{ background: '#0F1F3D' }}>

        {/* Logo */}
        <div className="px-6 pt-7 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-none"
              style={{ background: '#F4522D', boxShadow: '0 4px 14px rgba(244,82,45,.4)' }}>
              🧒
            </div>
            <div>
              <div className="font-fraunces text-white font-bold text-base leading-tight tracking-tight">
                Família em Foco
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,.4)' }}>
                Seu lar organizado
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-5 mb-4 h-px" style={{ background: 'rgba(255,255,255,.07)' }} />

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon, color }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={`
                  group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-150 relative
                  ${active
                    ? 'text-white'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                  }
                `}
                style={active ? {
                  background: `${color}1A`,
                  color: color,
                } : {}}
              >
                {active && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                    style={{ background: color }}
                  />
                )}
                <span
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-none transition-all"
                  style={active
                    ? { background: `${color}22`, color: color }
                    : { background: 'rgba(255,255,255,.05)', color: 'rgba(255,255,255,.4)' }
                  }
                >
                  <Icon size={16} strokeWidth={active ? 2.5 : 1.8} />
                </span>
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-6 pt-3 space-y-0.5"
          style={{ borderTop: '1px solid rgba(255,255,255,.07)' }}>
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
          >
            <span className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/5">
              <Settings size={15} />
            </span>
            Configurações
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <span className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/5">
              <LogOut size={15} />
            </span>
            Sair
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════ */}
      <main className="flex-1 md:ml-[240px] pb-24 md:pb-0 min-h-screen mesh-bg">
        {children}
      </main>

      {/* ══════════════════════════════════════════
          BOTTOM NAV — Mobile
      ══════════════════════════════════════════ */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 safe-bottom"
        style={{
          background: 'rgba(253,248,242,.92)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(237,228,214,.8)',
        }}
      >
        <div className="flex items-end h-16">
          {mobileItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            const isAI = href === '/ia'
            return (
              <Link
                key={href}
                href={href}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 h-full relative"
              >
                {isAI ? (
                  <span
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg -mt-5"
                    style={{
                      background: 'linear-gradient(135deg, #F4522D, #F5A623)',
                      boxShadow: '0 4px 20px rgba(244,82,45,.35)',
                    }}
                  >
                    <Sparkles size={20} strokeWidth={2} />
                  </span>
                ) : (
                  <>
                    <span className={`transition-all duration-200 ${active ? 'scale-110' : 'scale-100'}`}
                      style={{ color: active ? '#F4522D' : '#B8A898' }}>
                      <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                    </span>
                    <span className="text-[10px] font-semibold leading-none"
                      style={{ color: active ? '#F4522D' : '#B8A898' }}>
                      {label}
                    </span>
                    {active && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-coral" />
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
