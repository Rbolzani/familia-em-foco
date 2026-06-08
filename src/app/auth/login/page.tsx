'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(`Erro: ${error.message}`); setLoading(false); return }
      if (!data.session) { setError('Sessão não criada. Tente novamente.'); setLoading(false); return }
      window.location.href = '/dashboard'
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(`Falha na conexão: ${msg}`)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#F7F5FF' }}>

      {/* Orbs decorativos */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute rounded-full" style={{ width: 500, height: 500, background: 'rgba(196,195,255,0.45)', filter: 'blur(70px)', top: -150, right: -100, animation: 'float2 10s ease-in-out infinite' }} />
        <div className="absolute rounded-full" style={{ width: 350, height: 350, background: 'rgba(244,167,185,0.35)', filter: 'blur(60px)', bottom: '10%', left: -80, animation: 'float1 8s ease-in-out infinite' }} />
        <div className="absolute rounded-full" style={{ width: 280, height: 280, background: 'rgba(168,221,181,0.30)', filter: 'blur(55px)', bottom: '30%', right: '5%', animation: 'float2 12s ease-in-out infinite reverse' }} />
      </div>

      {/* ── Painel esquerdo — hero (desktop) ── */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #EEF0FF 0%, #F0EBFF 50%, #FFE8F0 100%)' }}>

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl flex-none"
            style={{ background: 'linear-gradient(135deg,#7B6FE8,#C084FC)', boxShadow: '0 8px 24px rgba(123,111,232,0.35)' }}>
            🧒
          </div>
          <div>
            <div className="font-bold text-base leading-tight" style={{ color: '#1A1535', fontFamily: 'var(--font-gilda)' }}>
              Família em Foco
            </div>
            <div className="text-xs" style={{ color: '#8585A8' }}>Organize · Cuide · Celebre</div>
          </div>
        </div>

        {/* Hero copy */}
        <div className="relative flex-1 flex flex-col justify-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#7B6FE8' }}>
            Para mães e pais
          </p>
          <h1 style={{ fontFamily: 'var(--font-gilda)', fontSize: 48, lineHeight: 1.2, color: '#1A1535' }}>
            Organize a vida<br/>dos seus <span style={{ color: '#7B6FE8' }}>filhos</span><br/>com carinho.
          </h1>
          <p className="text-sm leading-relaxed mt-5" style={{ color: '#8585A8' }}>
            Um lugar só para eles — escola, saúde, atividades e documentos em um app bonito e fácil.
          </p>

          {/* Preview cards */}
          <div className="mt-8 space-y-2.5">
            {[
              { dot: '#7B6FE8', text: 'Prova de Matemática — Pedro', badge: 'Hoje', badgeBg: '#EEF0FF', badgeColor: '#7B6FE8' },
              { dot: '#F4A7B9', text: 'Ballet da Sofia — 15h30', badge: '5ª feira', badgeBg: '#FFF0F4', badgeColor: '#E07A9A' },
              { dot: '#A8DDB5', text: 'Consulta pediatra — 17h', badge: 'Amanhã', badgeBg: '#F0FAF2', badgeColor: '#4A9E5C' },
            ].map((c, i) => (
              <div key={i} className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3"
                style={{ boxShadow: '0 4px 16px rgba(123,111,232,0.08)', animationDelay: `${i * 0.1}s` }}>
                <div className="w-2.5 h-2.5 rounded-full flex-none" style={{ background: c.dot }} />
                <span className="flex-1 text-sm font-medium" style={{ color: '#1A1535' }}>{c.text}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: c.badgeBg, color: c.badgeColor }}>{c.badge}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs" style={{ color: '#C0BFD5' }}>Powered by IA · 100% seguro</p>
      </div>

      {/* ── Painel direito — form ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 relative z-10">

        {/* Mobile logo */}
        <div className="lg:hidden mb-8 text-center">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-2xl mx-auto mb-3"
            style={{ background: 'linear-gradient(135deg,#7B6FE8,#C084FC)', boxShadow: '0 8px 24px rgba(123,111,232,0.3)' }}>
            🧒
          </div>
          <div className="font-bold text-xl" style={{ fontFamily: 'var(--font-gilda)', color: '#1A1535' }}>Família em Foco</div>
        </div>

        <div className="w-full max-w-sm">
          {/* Card de form */}
          <div className="bg-white rounded-3xl p-8 animate-fade-up"
            style={{ boxShadow: '0 24px 80px rgba(123,111,232,0.12), 0 0 0 1px rgba(123,111,232,0.08)' }}>

            <div className="mb-7">
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#7B6FE8' }}>
                Bem-vindo de volta 👋
              </p>
              <h2 style={{ fontFamily: 'var(--font-gilda)', fontSize: 32, color: '#1A1535', lineHeight: 1.2 }}>
                Entre na sua<br/>conta
              </h2>
              <p className="text-sm mt-2" style={{ color: '#8585A8' }}>
                Seu dia começa aqui — organizado e tranquilo.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: '#8585A8' }}>E-mail</label>
                <input
                  type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: '#8585A8' }}>Senha</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'} required value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-field pr-11"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} tabIndex={-1}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 z-10 p-1 transition-opacity hover:opacity-60"
                    style={{ color: '#8585A8' }}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-xs font-semibold px-4 py-3 rounded-2xl"
                  style={{ background: '#FFF0F4', color: '#C0405A', border: '1px solid rgba(240,100,130,0.2)' }}>
                  ⚠ {error}
                </div>
              )}

              <button
                type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#7B6FE8,#C084FC)', boxShadow: '0 8px 28px rgba(123,111,232,0.30)' }}
              >
                {loading
                  ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <><span>Entrar</span><ArrowRight size={15} /></>
                }
              </button>
            </form>
          </div>

          <p className="mt-5 text-center text-sm" style={{ color: '#8585A8' }}>
            Não tem conta?{' '}
            <Link href="/auth/signup" className="font-bold transition-opacity hover:opacity-70" style={{ color: '#7B6FE8' }}>
              Criar conta gratuita
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
