'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react'

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
      if (error) {
        setError(`Erro: ${error.message}`)
        setLoading(false)
        return
      }
      if (!data.session) {
        setError('Sessão não criada. Tente novamente.')
        setLoading(false)
        return
      }
      // Hard redirect — garante que o browser envia os cookies frescos ao servidor
      window.location.href = '/dashboard'
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(`Falha na conexão: ${msg}`)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#FDF8F2' }}>

      {/* ── Left hero panel (desktop only) ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[460px] shrink-0 p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0F1F3D 0%, #1D3461 60%, #16294F 100%)' }}
      >
        {/* Blobs */}
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #F4522D, transparent)' }} />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #F5A623, transparent)' }} />

        {/* Logo */}
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

        {/* Copy */}
        <div className="relative flex-1 flex flex-col justify-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#F4522D' }}>
            Para mães e pais
          </p>
          <h1 className="font-fraunces text-4xl font-bold text-white leading-tight mb-5">
            Tudo sobre seus<br/>filhos, em um<br/>só lugar.
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,.5)' }}>
            Escola, saúde, atividades, documentos e logística familiar — organizados de forma inteligente.
          </p>
          <div className="mt-8 space-y-3.5">
            {[
              { icon: '📚', text: 'Escola, provas e atividades' },
              { icon: '🩺', text: 'Consultas e histórico médico' },
              { icon: '✨', text: 'Entrada com IA: foto ou texto' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-base w-9 h-9 rounded-xl flex items-center justify-center flex-none"
                  style={{ background: 'rgba(255,255,255,.08)' }}>{f.icon}</span>
                <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,.65)' }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-2">
          <Sparkles size={13} color="#F5A623" />
          <span className="text-xs" style={{ color: 'rgba(255,255,255,.3)' }}>
            Powered by IA • 100% gratuito para começar
          </span>
        </div>
      </div>

      {/* ── Right form panel ── */}
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
              Bem-vindo de volta 👋
            </h2>
            <p className="text-sm" style={{ color: '#8B7A68' }}>
              Entre para organizar o dia dos seus filhos.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="Sua senha"
                  className="input-field pl-10 pr-11 w-full"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-60 z-10 p-1" style={{ color: '#8B7A68' }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
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
                : <><span>Entrar</span><ArrowRight size={15} /></>
              }
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: '#8B7A68' }}>
            Não tem conta?{' '}
            <Link href="/auth/signup" className="font-bold transition-opacity hover:opacity-70" style={{ color: '#F4522D' }}>
              Criar conta gratuita
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
