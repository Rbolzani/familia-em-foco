'use client'
import { useEffect, useState, useCallback } from 'react'
import { X } from 'lucide-react'
import { useTour, TourStep } from './TourContext'

interface StepConfig {
  tourId: string
  title: string
  message: string
  points?: string[]
  hint: string
}

const STEPS: Record<Exclude<TourStep, 'done'>, StepConfig> = {
  children: {
    tourId: 'nav-children',
    title: 'Passo 1 de 4 — Seus filhos',
    message: 'Tudo começa cadastrando os perfis dos seus filhos. O app organiza a agenda, saúde, atividades e documentos de cada um separadamente.',
    hint: '☝️ Clique em "Cadastrar primeiro filho" para começar — ou clique em qualquer lugar para continuar o tour.',
  },
  invite: {
    tourId: 'nav-invite',
    title: 'Passo 2 de 4 — Compartilhar acesso',
    message: 'Convide seu parceiro(a) para acompanhar a rotina dos filhos em tempo real, com o nível de acesso que você escolher.',
    points: ['Agenda sincronizada ao vivo', 'Quem leva e quem busca, combinados'],
    hint: '☝️ Em "Compartilhar Acesso" você gera o convite — ou clique em qualquer lugar para continuar.',
  },
  alertas: {
    tourId: 'nav-alertas',
    title: 'Passo 3 de 4 — Alertas no WhatsApp',
    message: 'Cadastre seu número de WhatsApp e receba um resumo diário com os compromissos dos filhos, no horário que você definir.',
    points: ['Resumo matinal automático', 'Nunca mais esqueça uma prova ou consulta'],
    hint: '☝️ Em "Alertas" você configura o WhatsApp — ou clique em qualquer lugar para continuar.',
  },
  ia: {
    tourId: 'nav-ia',
    title: 'Passo 4 de 4 — Captura com IA',
    message: 'Foto da agenda escolar, texto livre ou áudio — a IA extrai e organiza tudo automaticamente em atividades, lembretes e documentos.',
    points: ['Foto, texto ou voz', 'Tudo classificado pra você'],
    hint: '☝️ Use "Captura com IA" para adicionar o primeiro dado — ou clique em qualquer lugar para finalizar.',
  },
}

interface Rect { left: number; top: number; width: number; height: number }

const DIM = 'rgba(10,18,11,0.72)'
const PAD = 12

export default function TourOverlay() {
  const { step, isActive, next, skip } = useTour()
  const [rect, setRect] = useState<Rect | null>(null)

  const findTarget = useCallback(() => {
    if (!isActive || step === 'done') { setRect(null); return }
    const config = STEPS[step as Exclude<TourStep, 'done'>]
    const els = Array.from(document.querySelectorAll(`[data-tour="${config.tourId}"]`))
    const visible = els.find(el => {
      const r = el.getBoundingClientRect()
      return r.width > 0 && r.height > 0 && r.left > -50 && r.left < window.innerWidth
    })
    setRect(visible ? visible.getBoundingClientRect() : null)
  }, [isActive, step])

  useEffect(() => {
    findTarget()
    const t = setTimeout(findTarget, 150)
    window.addEventListener('resize', findTarget)
    window.addEventListener('scroll', findTarget, true)
    return () => {
      clearTimeout(t)
      window.removeEventListener('resize', findTarget)
      window.removeEventListener('scroll', findTarget, true)
    }
  }, [findTarget])

  // Avanço por clique: qualquer clique na página avança o tour para o próximo
  // passo. O botão "pular" (X) chama skip() e usa stopPropagation, então não
  // dispara este listener. Bubble phase garante que a navegação do Link e o
  // avanço aconteçam juntos.
  useEffect(() => {
    if (!isActive) return
    function onClick() { next() }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [isActive, next])

  if (!isActive || step === 'done') return null

  const config = STEPS[step as Exclude<TourStep, 'done'>]

  function handleSkip(e: React.MouseEvent) {
    e.stopPropagation()
    skip()
  }

  // Sem elemento visível → modal centrado
  if (!rect) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: DIM, padding: '24px 20px',
      }}>
        <TourCard config={config} onSkip={handleSkip} />
      </div>
    )
  }

  const vw = window.innerWidth
  const vh = window.innerHeight
  const sx = Math.max(0, rect.left - PAD)
  const sy = Math.max(0, rect.top  - PAD)
  const sw = rect.width  + PAD * 2
  const sh = rect.height + PAD * 2

  // Tooltip: abaixo se couber, senão acima
  const CARD_W = Math.min(300, vw - 32)
  const CARD_H = 250
  const belowY = sy + sh + 12
  const aboveY = sy - CARD_H - 12
  const tooltipTop = belowY + CARD_H < vh ? belowY : Math.max(8, aboveY)
  const tooltipLeft = Math.max(16, Math.min(vw - CARD_W - 16, rect.left + rect.width / 2 - CARD_W / 2))

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000, pointerEvents: 'none' }}>

      {/* 4 painéis de escurecimento — a área do destaque fica LIVRE para receber cliques */}
      <div style={{ position: 'absolute', left: 0, top: 0, right: 0, height: sy, background: DIM, pointerEvents: 'all' }} />
      <div style={{ position: 'absolute', left: 0, top: sy + sh, right: 0, bottom: 0, background: DIM, pointerEvents: 'all' }} />
      <div style={{ position: 'absolute', left: 0, top: sy, width: Math.max(0, sx), height: sh, background: DIM, pointerEvents: 'all' }} />
      <div style={{ position: 'absolute', left: sx + sw, top: sy, right: 0, height: sh, background: DIM, pointerEvents: 'all' }} />

      {/* Anel pulsante ao redor do elemento destacado */}
      <div style={{
        position: 'absolute',
        left: sx, top: sy, width: sw, height: sh,
        borderRadius: 12,
        border: '2px solid #6BA86F',
        boxShadow: '0 0 0 4px rgba(90,140,94,0.30)',
        animation: 'tour-pulse 2s ease-in-out infinite',
        pointerEvents: 'none',
      }} />

      {/* Tooltip informativo */}
      <div style={{
        position: 'absolute',
        top: tooltipTop,
        left: tooltipLeft,
        width: CARD_W,
        pointerEvents: 'all',
        zIndex: 9001,
      }}>
        <TourCard config={config} onSkip={handleSkip} />
      </div>
    </div>
  )
}

function TourCard({ config, onSkip }: {
  config: StepConfig
  onSkip: (e: React.MouseEvent) => void
}) {
  return (
    <div style={{
      background: 'linear-gradient(160deg,#FFFFFF,#F8F3EA)',
      borderRadius: 16,
      padding: '14px 18px 14px',
      boxShadow: '0 12px 48px rgba(10,20,12,0.50)',
      border: '1px solid rgba(61,102,65,0.18)',
    }}>
      {/* Header — botão pular */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 2 }}>
        <button onClick={onSkip} title="Pular tour" style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 2,
          color: 'rgba(26,43,28,0.28)', display: 'flex', alignItems: 'center',
        }}>
          <X size={14} />
        </button>
      </div>

      {/* Title */}
      <h3 style={{ fontFamily: 'var(--font-lora)', fontSize: 15, fontWeight: 700, color: '#1A2B1C', margin: '0 0 6px' }}>
        {config.title}
      </h3>

      {/* Message */}
      <p style={{ fontSize: 12.5, color: 'rgba(26,43,28,0.58)', lineHeight: 1.65, margin: '0 0 10px' }}>
        {config.message}
      </p>

      {/* Bullet points */}
      {config.points && (
        <div style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {config.points.map(pt => (
            <div key={pt} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: '#2C4A2E', fontWeight: 600 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#5A8C5E', flexShrink: 0 }} />
              {pt}
            </div>
          ))}
        </div>
      )}

      {/* Hint — instrução de onde clicar */}
      <div style={{
        padding: '8px 12px',
        borderRadius: 10,
        background: 'rgba(61,102,65,0.07)',
        border: '1px solid rgba(61,102,65,0.14)',
        fontSize: 12,
        color: '#2C4A2E',
        fontWeight: 600,
        lineHeight: 1.5,
      }}>
        {config.hint}
      </div>
    </div>
  )
}
