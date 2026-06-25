'use client'
import { useState, useEffect } from 'react'
import { MessageCircle, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { PlanId } from '@/lib/billing'

const APP_VERSION = '1.0.0'

const SLA: Record<PlanId, { label: string; sla: string | null; priority: boolean }> = {
  free:    { label: 'Fale com o suporte',  sla: null,                  priority: false },
  familia: { label: 'Fale com o suporte',  sla: 'Resposta em até 48h', priority: false },
  plus:    { label: 'Suporte prioritário', sla: 'Resposta em até 4h',  priority: true  },
}

const PLAN_LABELS: Record<PlanId, string> = {
  free: 'Gratuito', familia: 'Família', plus: 'Família Plus',
}

export default function SupportButton() {
  const [plan,     setPlan]     = useState<PlanId>('free')
  const [userName, setUserName] = useState('')
  const [ready,    setReady]    = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserName(user.user_metadata?.full_name ?? user.email ?? 'Usuário')

      const { data } = await supabase.rpc('get_family_plan')
      const p = (data as PlanId) ?? 'free'
      setPlan(p === 'plus' ? 'plus' : p === 'familia' ? 'familia' : 'free')
      setReady(true)
    }
    load()
  }, [])

  function openWhatsApp() {
    const number = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? ''
    if (!number) return
    const msg = encodeURIComponent(
      `Olá! Preciso de ajuda com o Família em Foco.\n` +
      `Usuário: ${userName}\n` +
      `Plano: ${PLAN_LABELS[plan]}\n` +
      `Versão: ${APP_VERSION}`
    )
    window.open(`https://wa.me/${number}?text=${msg}`, '_blank')
  }

  const cfg = SLA[plan]
  const hasNumber = !!process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
      <button
        onClick={openWhatsApp}
        disabled={!ready || !hasNumber}
        style={{
          display:'flex', alignItems:'center', gap:10,
          padding:'14px 28px', borderRadius:14, border:'none', cursor: ready && hasNumber ? 'pointer' : 'default',
          background: cfg.priority
            ? 'linear-gradient(135deg,#2C4A2E,#1E3320)'
            : 'linear-gradient(135deg,#3D6641,#2C4A2E)',
          boxShadow:'0 4px 18px rgba(44,74,46,0.28)',
          opacity: !ready ? 0.6 : 1,
          transition:'opacity 0.2s',
        }}>
        {cfg.priority
          ? <Zap size={18} color="#D4E8D5" />
          : <MessageCircle size={18} color="#D4E8D5" />}
        <span style={{ fontSize:15, fontWeight:700, color:'#D4E8D5' }}>
          {cfg.label}{cfg.priority ? ' ⚡' : ''}
        </span>
      </button>

      {cfg.sla && (
        <span style={{ fontSize:12.5, color:'rgba(26,43,28,0.50)', fontStyle:'italic' }}>
          {cfg.sla}
        </span>
      )}

      {!hasNumber && (
        <span style={{ fontSize:11.5, color:'rgba(26,43,28,0.35)', fontStyle:'italic' }}>
          Suporte via WhatsApp em breve
        </span>
      )}
    </div>
  )
}
