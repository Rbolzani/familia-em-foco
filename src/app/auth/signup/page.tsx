'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return }
    setLoading(true); setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name } },
    })
    if (error) { setError(error.message); setLoading(false); return }
    setSuccess(true)
    setTimeout(() => router.push('/dashboard'), 2500)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#FDF8F2' }}>
        <div className="text-center animate-scale-in">
          <div className="text-6xl mb-5 animate-float">🎉</div>
          <h2 className="font-fraunces text-3xl font-bold mb-2" style={{ color: '#0F1F3D' }}>
            Conta criada!
          </h2>
          <p className="text-sm" style={{ color: '#8B7A68' }}>
            Redirecionando para o seu painel...
          </p>
          <div className="mt-5 flex items-center justify-center gap-2" style={{ color: '#F4522D' }}>
            <span className="w-4 h-4 border-2 border-coral/30 border-t-coral rounded-full animate-spin"
              style={{ borderColor: 'rgba(244,82,45,.3)', borderTopColor: '#F4522D' }} />
            <span className="text-xs font-semibold">Aguarde...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#FDF8F2' }}>

      {/* ── Left hero (desktop) ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[460px] shrink-0 p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0F1F3D 0%, #1D3461 60%, #16294F 100%)' }}
      >
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #F4522D, transparent)' }} />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #00C48C, transparent)' }} />

        <div className="relative flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl font-bold font-fraunces flex-none"
            style={{ background: 'linear-gradient(135deg,#F4522D,#F5A623)', boxShadow: '0 8px 24px rgba(244,82,45,.4)' }}>
            F
          </div>
          <div>
            <div className="text-white font-fraunces text-xl font-bold leading-tight">Família em Foco</div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,.4)' }}>Organize. Cuide. Celebre.</div>
          </div>
        </div>

        <div className="relative flex-1 flex flex-col justify-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#00C48C' }}>
            Comece hoje, é grátis
          </p>
          <h1 className="font-fraunces text-4xl font-bold text-white leading-tight mb-5">
            Sua família<br/>merece o melhor<br/>da organização. 💚
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,.5)' }}>
            Crie sua conta em segundos e comece a organizar a rotina dos seus filhos com inteligência artificial.
          </p>

          {/* Steps */}
          <div className="mt-8 space-y-4">
            {[
              { n: '1', text: 'Crie sua conta gratuita' },
              { n: '2', text: 'Cadastre seus filhos' },
              { n: '3', text: 'Adicione atividades com IA' },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center flex-none"
                  style={{ background: 'rgba(244,82,45,.2)', color: '#F4522D' }}>
                  {s.n}
                </span>
                <span className="text-sm" style={{ color: 'rgba(255,255,255,.65)' }}>{s.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <span className="text-xs" style={{ color: 'rgba(255,255,255,.3)' }}>
            ✓ Sem cartão de crédito · ✓ Cancele quando quiser
          </span>
        </div>
      </div>

      {/* ── Right form ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-bold font-fraunces mx-auto mb-2"
            style={{ background: 'linear-gradient(135deg,#F4522D,#F5A623)', boxShadow: '0 6px 20px rgba(244,82,45,.3)' }}>
            F
          </div>
          <div className="font-fraunces text-xl font-bold" style={{ color: '#0F1F3D' }}>Família em Foco</div>
        </div>

        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-8">
            <h2 className="font-fraunces text-3xl font-bold leading-tight mb-1.5" style={{ color: '#0F1F3D' }}>
              Criar sua conta 🚀
            </h2>
            <p className="text-sm" style={{ color: '#8B7A68' }}>
              Grátis para sempre. Sem cartão de crédito.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: '#0F1F3D' }}>
                Seu nome
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-0" style={{ color: '#8B7A68' }} />
                <input
                  type="text" required value={name} onChange={e => setName(e.target.value)}
                  placeholder="João Silva"
                  className="input-field pl-10 w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: '#0F1F3D' }}>
                E-mail
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-0" style={{ color: '#8B7A68' }} />
                <input
                  type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="input-field pl-10 w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: '#0F1F3D' }}>
                Senha
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-0" style={{ color: '#8B7A68' }} />
                <input
                  type={showPw ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="input-field pl-10 pr-11 w-full"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-60 z-10 p-1" style={{ color: '#8B7A68' }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="mt-2 flex gap-1">
                  {[1,2,3,4].map(n => (
                    <div key={n} className="flex-1 h-1 rounded-full transition-all"
                      style={{ background: password.length >= n * 2 ? (password.length >= 8 ? '#00C48C' : '#F5A623') : '#EDE4D6' }} />
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="text-xs font-semibold px-3.5 py-2.5 rounded-xl"
                style={{ background: '#FFF0EB', color: '#F4522D', border: '1px solid #FDD5C9' }}>
                ⚠ {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white transition-all hover:brightness-105 active:scale-95 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#F4522D,#D93D1A)', boxShadow: '0 6px 20px rgba(244,82,45,.35)' }}
            >
              {loading
                ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <><span>Criar conta grátis</span><ArrowRight size={15} /></>
              }
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: '#8B7A68' }}>
            Já tem conta?{' '}
            <Link href="/auth/login" className="font-bold transition-opacity hover:opacity-70" style={{ color: '#F4522D' }}>
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
