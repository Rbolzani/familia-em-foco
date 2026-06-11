'use client'
import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageCircle, Send } from 'lucide-react'
import { toast } from '@/components/ui/Toast'

interface Props {
  userId: string
  userEmail: string
  whatsapp: { number: string; enabled: boolean }
}

export default function AlertasClient({ userId, userEmail, whatsapp }: Props) {
  const supabase = createClient()

  const [waNumber, setWaNumber]   = useState(whatsapp.number)
  const [waEnabled, setWaEnabled] = useState(whatsapp.enabled)
  const [waSaving, setWaSaving]   = useState(false)
  const [waTesting, setWaTesting] = useState(false)

  function normalizePhone(raw: string): string {
    return raw.replace(/\D/g, '')
  }

  async function saveWhatsApp(enabledOverride?: boolean) {
    const digits = normalizePhone(waNumber)
    const enabled = enabledOverride ?? waEnabled
    if (enabled && (digits.length < 12 || digits.length > 14)) {
      toast('Número inválido. Use DDI+DDD+número, ex.: 5511999998888', 'error')
      return false
    }
    setWaSaving(true)
    const { error } = await supabase
      .from('notification_settings')
      .upsert({
        user_id: userId,
        whatsapp_number: digits || null,
        daily_summary_enabled: enabled,
        updated_at: new Date().toISOString(),
      })
    setWaSaving(false)
    if (error) { toast('Não foi possível salvar. Tente novamente.', 'error'); return false }
    toast('Preferências salvas ✓')
    return true
  }

  async function toggleWa() {
    const next = !waEnabled
    if (next) {
      const digits = normalizePhone(waNumber)
      if (digits.length < 12 || digits.length > 14) {
        toast('Informe seu número antes de ativar. Ex.: 5511999998888', 'error')
        return
      }
    }
    setWaEnabled(next)
    await saveWhatsApp(next)
  }

  async function sendTest() {
    const saved = await saveWhatsApp()
    if (!saved) return
    setWaTesting(true)
    try {
      const res = await fetch('/api/whatsapp-test', { method: 'POST' })
      const json = await res.json()
      if (res.ok) {
        // Mostra a resposta da Meta para diagnóstico
        const metaInfo = json.meta ? ` | Meta: ${json.meta}` : ''
        toast(`Enviado! Confira seu WhatsApp 📱${metaInfo}`)
      } else {
        // Mostra o erro exato retornado pela Meta
        toast(json.error ?? 'Falha no envio do teste.', 'error')
      }
    } catch {
      toast('Falha de conexão ao enviar o teste.', 'error')
    }
    setWaTesting(false)
  }

  const cardStyle: React.CSSProperties = {
    background: 'linear-gradient(160deg,#FFFFFF 0%,#F8F3EA 100%)',
    border: '1px solid rgba(61,102,65,0.18)',
    boxShadow: '0 4px 16px rgba(44,74,46,0.08),0 1px 4px rgba(44,74,46,0.05)',
    borderRadius: 16,
    padding: '20px 20px',
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-5 space-y-5">
      {/* Header */}
      <div className="animate-fade-up">
        <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: '#2D6A35' }}>
          🔔 Notificações
        </p>
        <h1 style={{ fontFamily: 'var(--font-lora)', fontSize: 24, fontWeight: 700, color: '#1A2B1C' }}>
          Alertas
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(26,43,28,0.45)', marginTop: 2 }}>
          {userEmail}
        </p>
      </div>

      {/* Resumo matinal no WhatsApp */}
      <div style={cardStyle} className="animate-fade-up">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(61,102,65,0.10)' }}>
            <MessageCircle size={14} color="#2D6A35" />
          </div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1A2B1C' }}>Resumo matinal no WhatsApp</h2>
        </div>

        <p style={{ fontSize: 13, color: 'rgba(26,43,28,0.55)', lineHeight: 1.5, marginBottom: 16 }}>
          Todo dia às <strong style={{ color: '#1A2B1C' }}>7h da manhã</strong>, receba no WhatsApp o resumo
          das atividades do dia e da semana — provas, consultas, quem leva e quem busca.
        </p>

        {/* Número */}
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(26,43,28,0.50)', marginBottom: 6 }}>
          Seu WhatsApp (DDI + DDD + número)
        </label>
        <div className="flex gap-2 mb-4">
          <input
            type="tel"
            inputMode="numeric"
            value={waNumber}
            onChange={e => setWaNumber(e.target.value)}
            placeholder="5511999998888"
            className="input-field"
            style={{ flex: 1 }}
          />
          <button
            onClick={() => saveWhatsApp()}
            disabled={waSaving}
            className="px-4 rounded-[13px] font-bold text-white transition-all hover:brightness-105 active:scale-95 disabled:opacity-60 flex-shrink-0"
            style={{ background: 'linear-gradient(140deg,#3D6641,#2C4A2E)', fontSize: 13 }}>
            {waSaving ? '...' : 'Salvar'}
          </button>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl mb-4"
          style={{ background: waEnabled ? 'rgba(61,102,65,0.07)' : 'rgba(26,43,28,0.03)', border: `1px solid ${waEnabled ? 'rgba(61,102,65,0.22)' : 'rgba(26,43,28,0.08)'}` }}>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1A2B1C' }}>Resumo diário ativo</div>
            <div style={{ fontSize: 11.5, color: 'rgba(26,43,28,0.45)' }}>
              {waEnabled ? 'Você receberá a mensagem todas as manhãs às 7h' : 'Ative para começar a receber'}
            </div>
          </div>
          <button onClick={toggleWa}
            aria-label="Ativar/desativar resumo diário"
            style={{ position: 'relative', width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', flexShrink: 0,
              background: waEnabled ? 'linear-gradient(135deg,#3D6641,#2C4A2E)' : 'rgba(61,102,65,0.22)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.15)', transition: 'background .25s' }}>
            <span style={{ position: 'absolute', top: 3, width: 20, height: 20, borderRadius: '50%', background: 'white',
              boxShadow: '0 2px 5px rgba(0,0,0,0.25)', left: waEnabled ? 25 : 3, transition: 'left .3s cubic-bezier(.4,0,.2,1)' }} />
          </button>
        </div>

        {/* Teste */}
        <button
          onClick={sendTest}
          disabled={waTesting}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold transition-all hover:bg-black/[0.04] active:scale-95 disabled:opacity-60"
          style={{ color: '#3D6641', border: '1.5px solid rgba(61,102,65,0.30)', background: 'none', fontSize: 13.5 }}>
          <Send size={14} />
          {waTesting ? 'Enviando teste...' : 'Enviar resumo de teste agora'}
        </button>
      </div>
    </div>
  )
}
