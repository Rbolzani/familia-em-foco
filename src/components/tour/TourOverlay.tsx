'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, X } from 'lucide-react'
import { useTour, TourStep } from './TourContext'

interface StepConfig {
  tourId: string
  title: string
  message: string
  points?: string[]
  cta: string
  href: string
  advanceOnCta?: boolean  // false = o passo avança por outra ação (ex: salvar filho)
}

const STEPS: Record<Exclude<TourStep, 'done'>, StepConfig> = {
  children: {
    tourId: 'nav-children',
    title: 'Comece aqui — seus filhos',
    message: 'Cadastre seus filhos para que o app organize a rotina de cada um com agenda, saúde, atividades e documentos.',
    cta: 'Cadastrar filhos',
    href: '/children',
    advanceOnCta: false,
  },
  invite: {
    tourId: 'nav-invite',
    title: 'Convide seu parceiro(a)',
    message: 'Com o acesso compartilhado, vocês dois veem e gerenciam a rotina juntos — em tempo real.',
    points: [
      'Agenda sincronizada ao vivo',
      'Sugestões de quem leva ou busca',
      '3 níveis de acesso configuráveis',
    ],
    cta: 'Compartilhar acesso',
    href: '/configuracoes',
  },
  ia: {
    tourId: 'nav-ia',
    title: 'IA para organizar tudo',
    message: 'Foto da agenda escolar, texto ou voz — a IA extrai e organiza automaticamente em atividades, lembretes e documentos.',
    cta: 'Experimentar a IA',
    href: '/ia',
  },
}

const LABELS: Record<Exclude<TourStep, 'done'>, string> = {
  children: '1 de 3',
  invite: '2 de 3',
  ia: '3 de 3',
}

interface Rect { left: number; top: number; width: number; height: number }

export default function TourOverlay() {
  const { step, isActive, advance, skip } = useTour()
  const router = useRouter()
  const [rect, setRect] = useState<Rect | null>(null)
  const PAD = 10

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
    const t = setTimeout(findTarget, 120)
    window.addEventListener('resize', findTarget)
    window.addEventListener('scroll', findTarget, true)
    return () => {
      clearTimeout(t)
      window.removeEventListener('resize', findTarget)
      window.removeEventListener('scroll', findTarget, true)
    }
  }, [findTarget])

  if (!isActive || step === 'done') return null

  const config = STEPS[step as Exclude<TourStep, 'done'>]
  const label = LABELS[step as Exclude<TourStep, 'done'>]

  function handleCta() {
    if (config.advanceOnCta !== false) {
      advance(step as Exclude<TourStep, 'done'>)
    }
    router.push(config.href)
  }

  // Sem elemento encontrado → modal centrado
  if (!rect) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(10,18,11,0.72)',
        padding: '24px 20px',
      }}>
        <TourCard config={config} label={label} onCta={handleCta} onSkip={skip} />
      </div>
    )
  }

  const vw = window.innerWidth
  const vh = window.innerHeight
  const sx = rect.left - PAD
  const sy = rect.top - PAD
  const sw = rect.width + PAD * 2
  const sh = rect.height + PAD * 2

  // Posicionar tooltip: abaixo se couber, senão acima
  const CARD_H = 260
  const CARD_W = Math.min(300, vw - 32)
  const belowY = sy + sh + 14
  const aboveY = sy - CARD_H - 14
  const tooltipTop = belowY + CARD_H < vh ? belowY : Math.max(8, aboveY)
  let tooltipLeft = rect.left + rect.width / 2 - CARD_W / 2
  tooltipLeft = Math.max(16, Math.min(vw - CARD_W - 16, tooltipLeft))

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000, pointerEvents: 'none' }}>
      {/* Dim overlay com buraco SVG */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'all' }}
      >
        <defs>
          <mask id="tour-hole">
            <rect width="100%" height="100%" fill="white" />
            <rect x={sx} y={sy} width={sw} height={sh} rx={12} fill="black" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(10,18,11,0.72)" mask="url(#tour-hole)" />
      </svg>

      {/* Anel pulsante ao redor do elemento */}
      <div style={{
        position: 'absolute',
        left: sx, top: sy, width: sw, height: sh,
        borderRadius: 12,
        border: '2px solid #5A8C5E',
        boxShadow: '0 0 0 4px rgba(90,140,94,0.25)',
        pointerEvents: 'none',
        animation: 'tour-pulse 2s ease-in-out infinite',
      }} />

      {/* Tooltip */}
      <div style={{
        position: 'absolute',
        top: tooltipTop,
        left: tooltipLeft,
        width: CARD_W,
        pointerEvents: 'all',
        zIndex: 9001,
      }}>
        <TourCard config={config} label={label} onCta={handleCta} onSkip={skip} />
      </div>
    </div>
  )
}

function TourCard({ config, label, onCta, onSkip }: {
  config: StepConfig
  label: string
  onCta: () => void
  onSkip: () => void
}) {
  return (
    <div style={{
      background: 'linear-gradient(160deg,#FFFFFF,#F8F3EA)',
      borderRadius: 16,
      padding: '18px 18px 16px',
      boxShadow: '0 12px 48px rgba(10,20,12,0.45)',
      border: '1px solid rgba(61,102,65,0.18)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(26,43,28,0.40)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          {label}
        </span>
        <button onClick={onSkip} title="Pular tour" style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 2,
          color: 'rgba(26,43,28,0.30)', display: 'flex', alignItems: 'center',
        }}>
          <X size={14} />
        </button>
      </div>

      <h3 style={{ fontFamily: 'var(--font-lora)', fontSize: 15, fontWeight: 700, color: '#1A2B1C', margin: '0 0 7px' }}>
        {config.title}
      </h3>
      <p style={{ fontSize: 12.5, color: 'rgba(26,43,28,0.60)', lineHeight: 1.6, margin: '0 0 10px' }}>
        {config.message}
      </p>

      {config.points && (
        <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {config.points.map(pt => (
            <div key={pt} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: '#2C4A2E', fontWeight: 600 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#5A8C5E', flexShrink: 0 }} />
              {pt}
            </div>
          ))}
        </div>
      )}

      <button onClick={onCta} style={{
        width: '100%', padding: '9px 14px', borderRadius: 10, border: 'none',
        background: 'linear-gradient(140deg,#3D6641,#2C4A2E)',
        color: '#D4E8D5', fontWeight: 700, fontSize: 13, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        boxShadow: '0 4px 14px rgba(44,74,46,0.30)',
      }}>
        {config.cta} <ArrowRight size={13} />
      </button>
    </div>
  )
}
