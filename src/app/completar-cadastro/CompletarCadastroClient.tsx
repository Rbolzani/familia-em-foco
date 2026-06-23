'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { formatCPF, formatPhoneBR, isValidCPF, isValidPhoneBR } from '@/lib/cpf'

interface Props {
  email: string
  initialName: string
}

export default function CompletarCadastroClient({ email, initialName }: Props) {
  const router = useRouter()
  const [fullName, setFullName] = useState(initialName)
  const [phone, setPhone]       = useState('')
  const [cpf, setCpf]           = useState('')
  const [birthDate, setBirth]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const cpfOk   = cpf.length === 0 || isValidCPF(cpf)
  const phoneOk = phone.length === 0 || isValidPhoneBR(phone)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (fullName.trim().length < 3) { setError('Informe seu nome completo.'); return }
    if (!isValidPhoneBR(phone))     { setError('Celular inválido. Use DDD + número.'); return }
    if (!isValidCPF(cpf))           { setError('CPF inválido.'); return }
    if (!birthDate)                 { setError('Informe sua data de nascimento.'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, phone, cpf, birth_date: birthDate }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro ao salvar.')
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#F8F3EA' }}>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl p-8 animate-fade-up"
          style={{ boxShadow: '0 24px 80px rgba(44,74,46,0.10), 0 0 0 1px rgba(61,102,65,0.08)' }}>

          <div className="mb-7">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#3D6641' }}>
              Quase lá ✨
            </p>
            <h1 style={{ fontFamily: 'var(--font-lora)', fontSize: 28, color: '#1A2B1C', lineHeight: 1.2 }}>
              Complete seu cadastro
            </h1>
            <p className="text-sm mt-2" style={{ color: 'rgba(26,43,28,0.55)' }}>
              Precisamos de alguns dados para ativar sua conta com segurança.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'rgba(26,43,28,0.55)' }}>Nome completo</label>
              <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="Maria Aparecida da Silva" className="input-field" />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'rgba(26,43,28,0.55)' }}>E-mail</label>
              <input type="email" value={email} disabled className="input-field" style={{ opacity: 0.6 }} />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'rgba(26,43,28,0.55)' }}>Celular</label>
              <input type="tel" inputMode="numeric" required value={phone}
                onChange={e => setPhone(formatPhoneBR(e.target.value))}
                placeholder="(11) 90000-0000" className="input-field"
                style={!phoneOk ? { borderColor: '#E0607A' } : undefined} />
              {!phoneOk && <p className="text-xs mt-1" style={{ color: '#C0405A' }}>Celular incompleto.</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'rgba(26,43,28,0.55)' }}>CPF</label>
              <input type="text" inputMode="numeric" required value={cpf}
                onChange={e => setCpf(formatCPF(e.target.value))}
                placeholder="000.000.000-00" className="input-field"
                style={!cpfOk ? { borderColor: '#E0607A' } : undefined} />
              {!cpfOk && <p className="text-xs mt-1" style={{ color: '#C0405A' }}>CPF inválido.</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'rgba(26,43,28,0.55)' }}>Data de nascimento</label>
              <input type="date" required value={birthDate} onChange={e => setBirth(e.target.value)}
                max={new Date().toISOString().slice(0, 10)} className="input-field" />
            </div>

            {error && (
              <div className="text-xs font-semibold px-4 py-3 rounded-2xl"
                style={{ background: '#FFF0F4', color: '#C0405A', border: '1px solid rgba(240,100,130,0.2)' }}>
                ⚠ {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-60"
              style={{ background: 'linear-gradient(140deg,#3D6641,#2C4A2E)', boxShadow: '0 4px 16px rgba(44,74,46,0.30)' }}>
              {loading
                ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <><span>Continuar</span><ArrowRight size={15} /></>
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
