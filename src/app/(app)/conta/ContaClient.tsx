'use client'
import { useState } from 'react'
import { Save, Lock } from 'lucide-react'
import { toast } from '@/components/ui/Toast'
import { formatCPF, formatPhoneBR, isValidPhoneBR } from '@/lib/cpf'

interface Props {
  email: string
  fullName: string
  phone: string
  birthDate: string
  cpf: string
  marketingConsent: boolean
}

export default function ContaClient({ email, fullName, phone, birthDate, cpf, marketingConsent }: Props) {
  const [name, setName]       = useState(fullName)
  const [phoneV, setPhoneV]   = useState(phone ? formatPhoneBR(phone) : '')
  const [birth, setBirth]     = useState(birthDate)
  const [consent, setConsent] = useState(marketingConsent)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  const phoneOk = phoneV.length === 0 || isValidPhoneBR(phoneV)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (name.trim().length < 3) { setError('Informe seu nome completo.'); return }
    if (!isValidPhoneBR(phoneV)) { setError('Celular inválido. Use DDD + número.'); return }
    if (!birth) { setError('Informe sua data de nascimento.'); return }

    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: name, phone: phoneV, birth_date: birth, marketing_consent: consent }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro ao salvar.')
      toast('Dados atualizados ✓')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido.')
    } finally {
      setSaving(false)
    }
  }

  const labelStyle = { color: 'rgba(26,43,28,0.55)' } as const

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="animate-fade-up">
        <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: '#3D6641' }}>Configurações</p>
        <h1 style={{ fontFamily: 'var(--font-lora)', fontSize: 30, fontWeight: 700, color: '#1A2B1C', lineHeight: 1.1 }}>
          Minha Conta
        </h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(26,43,28,0.45)' }}>
          Gerencie seus dados pessoais
        </p>
      </div>

      <form onSubmit={handleSave} className="animate-fade-up rounded-2xl p-6 space-y-4"
        style={{ background: 'linear-gradient(160deg,#FFFFFF,#FAFAF7)', border: '1px solid rgba(61,102,65,0.18)', boxShadow: '0 2px 12px rgba(44,74,46,0.07)' }}>

        <div>
          <label className="block text-xs font-semibold mb-2" style={labelStyle}>Nome completo</label>
          <input type="text" required value={name} onChange={e => setName(e.target.value)} className="input-field" />
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold mb-2" style={labelStyle}>
            E-mail <Lock size={11} />
          </label>
          <input type="email" value={email} disabled className="input-field" style={{ opacity: 0.6 }} />
          <p className="text-xs mt-1" style={{ color: 'rgba(26,43,28,0.40)' }}>Para alterar o e-mail, fale com o suporte.</p>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-2" style={labelStyle}>Celular</label>
          <input type="tel" inputMode="numeric" required value={phoneV}
            onChange={e => setPhoneV(formatPhoneBR(e.target.value))}
            placeholder="(11) 90000-0000" className="input-field"
            style={!phoneOk ? { borderColor: '#E0607A' } : undefined} />
          {!phoneOk && <p className="text-xs mt-1" style={{ color: '#C0405A' }}>Celular incompleto.</p>}
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold mb-2" style={labelStyle}>
            CPF <Lock size={11} />
          </label>
          <input type="text" value={cpf ? formatCPF(cpf) : '—'} disabled className="input-field" style={{ opacity: 0.6 }} />
          <p className="text-xs mt-1" style={{ color: 'rgba(26,43,28,0.40)' }}>O CPF não pode ser alterado. Em caso de erro, fale com o suporte.</p>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-2" style={labelStyle}>Data de nascimento</label>
          <input type="date" required value={birth} onChange={e => setBirth(e.target.value)}
            max={new Date().toISOString().slice(0, 10)} className="input-field" />
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer select-none pt-1">
          <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}
            className="mt-0.5" style={{ accentColor: '#3D6641', width: 16, height: 16 }} />
          <span className="text-xs leading-relaxed" style={{ color: 'rgba(26,43,28,0.60)' }}>
            Quero receber dicas, novidades e ofertas da Família em Foco por e-mail e WhatsApp.
          </span>
        </label>

        {error && (
          <div className="text-xs font-semibold px-4 py-3 rounded-2xl"
            style={{ background: '#FFF0F4', color: '#C0405A', border: '1px solid rgba(240,100,130,0.2)' }}>
            ⚠ {error}
          </div>
        )}

        <button type="submit" disabled={saving}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-60"
          style={{ background: 'linear-gradient(140deg,#3D6641,#2C4A2E)', boxShadow: '0 4px 16px rgba(44,74,46,0.28)' }}>
          {saving
            ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            : <><Save size={15} /> Salvar alterações</>
          }
        </button>
      </form>
    </div>
  )
}
