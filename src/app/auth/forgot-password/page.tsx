'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight, ArrowLeft, MailCheck } from 'lucide-react'

const CARD = {
  background: 'linear-gradient(160deg,#FFFFFF 0%,#F8F3EA 100%)',
  border: '1px solid rgba(61,102,65,0.18)',
  boxShadow: '0 4px 16px rgba(44,74,46,0.10),0 1px 4px rgba(44,74,46,0.07),0 -1px 0 rgba(255,255,255,0.85) inset',
}

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [sent, setSent]       = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // O link do e-mail é montado pelo TEMPLATE do Supabase apontando para
        // /auth/confirm?token_hash=...&type=recovery&next=/auth/reset-password
        // (verificação server-side, robusta no mobile). Este redirectTo fica só
        // como fallback do {{ .RedirectTo }} caso o template use a variável.
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      // Por segurança, não revelamos se o e-mail existe — sucesso genérico.
      if (error) { setError(`Erro: ${error.message}`); setLoading(false); return }
      setSent(true); setLoading(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(`Falha na conexão: ${msg}`)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#F8F3EA' }}>
      <div className="w-full max-w-sm">

        {/* Logo mobile/desktop */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3">
            <img src="/brand/icone-coral.svg" alt="" style={{ width: 52, height: 52, display: 'block' }} />
            <img src="/brand/logotipo-claro.svg" alt="Família em Dia" style={{ height: 34, width: 'auto', display: 'block' }} />
          </div>
        </div>

        <div className="rounded-[20px] p-8 animate-fade-up" style={CARD}>

          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-5 w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(61,102,65,0.10)' }}>
                <MailCheck size={26} color="#3D6641" />
              </div>
              <h2 style={{ fontFamily: 'var(--font-lora)', fontSize: 26, color: '#1A2B1C', lineHeight: 1.2 }}>
                Verifique seu e-mail
              </h2>
              <p className="text-sm mt-3" style={{ color: 'rgba(26,43,28,0.55)', lineHeight: 1.55 }}>
                Se houver uma conta associada a <strong>{email}</strong>, enviamos um link
                para você criar uma nova senha. Confira também a caixa de spam.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-7">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] mb-3" style={{ color: '#5A8C5E' }}>
                  Recuperar acesso
                </p>
                <h2 style={{ fontFamily: 'var(--font-lora)', fontSize: 28, color: '#1A2B1C', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
                  Esqueceu a senha?
                </h2>
                <p className="text-sm mt-2 italic" style={{ color: 'rgba(26,43,28,0.50)' }}>
                  Informe seu e-mail e enviaremos um link para redefinir.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-2 uppercase tracking-[0.08em]"
                    style={{ color: 'rgba(26,43,28,0.50)' }}>E-mail</label>
                  <input
                    type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="input-field"
                  />
                </div>

                {error && (
                  <div className="text-xs font-semibold px-4 py-3 rounded-[12px]"
                    style={{ background: 'linear-gradient(140deg,#FEE2E2,#FECACA)', color: '#991B1B', border: '1px solid rgba(220,38,38,0.20)' }}>
                    ⚠ {error}
                  </div>
                )}

                <button
                  type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[13px] text-sm font-bold transition-all active:scale-95 disabled:opacity-60"
                  style={{
                    background: 'linear-gradient(140deg,#FF8A6E,#FF6B5C)',
                    color: '#fff',
                    boxShadow: '0 6px 20px rgba(255,107,92,0.30)',
                  }}
                >
                  {loading
                    ? <span className="w-4 h-4 border-2 border-green-200/40 border-t-green-200 rounded-full animate-spin" />
                    : <><span>Enviar link</span><ArrowRight size={15} /></>
                  }
                </button>
              </form>
            </>
          )}
        </div>

        <p className="mt-5 text-center text-sm">
          <Link href="/auth/login" className="inline-flex items-center gap-1.5 font-bold transition-opacity hover:opacity-70"
            style={{ color: '#3D6641' }}>
            <ArrowLeft size={14} /> Voltar para o login
          </Link>
        </p>
      </div>
    </div>
  )
}
