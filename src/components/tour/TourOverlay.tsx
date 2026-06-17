'use client'
import { useEffect, useState, useCallback } from 'react'
import { X, Users, UserPlus, Bell, Sparkles } from 'lucide-react'
import { useTour, TourStep } from './TourContext'

interface StepConfig {
  tourId: string
  icon: React.ElementType
  title: string
  desc: string
}

const STEPS: Record<Exclude<TourStep, 'done'>, StepConfig> = {
  children: {
    tourId: 'nav-children',
    icon: Users,
    title: 'Seus filhos',
    desc: 'Cadastre os perfis dos seus filhos.',
  },
  invite: {
    tourId: 'nav-invite',
    icon: UserPlus,
    title: 'Compartilhar acesso',
    desc: 'Convide seu parceiro(a) para a rotina.',
  },
  alertas: {
    tourId: 'nav-alertas',
    icon: Bell,
    title: 'Alertas no WhatsApp',
    desc: 'Resumo diário dos compromissos.',
  },
  ia: {
    tourId: 'nav-ia',
    icon: Sparkles,
    title: 'Captura com IA',
    desc: 'Foto, texto ou áudio — a IA organiza.',
  },
}

const ORDER: Exclude<TourStep, 'done'>[] = ['children', 'invite', 'alertas', 'ia']

interface Rect { left: number; top: number; width: number; height: number }

const DIM = 'rgba(10,18,11,0.58)'
const CARD_W = 264

export default function TourOverlay() {
  const { step, isActive, next, skip } = useTour()
  const [rect, setRect] = useState<Rect | null>(null)

  const findTarget = useCallback(() => {
    if (!isActive || step === 'done') { setRect(null); return }
    const config = STEPS[step as Exclude<TourStep, 'done'>]
    const els = Array.from(document.querySelectorAll(`[data-tour="${config.tourId}"]`))
    const visible = els.find(el => {
      const r = el.getBoundingClientRect()
      return r.width > 0 && r.height > 0 && r.left > -40 && r.left < window.innerWidth
    })
    setRect(visible ? visible.getBoundingClientRect() : null)
  }, [isActive, step])

  // Re-mede a posição do alvo — com timeouts que cobrem a animação de
  // abertura da sidebar mobile (~250ms).
  useEffect(() => {
    findTarget()
    const t1 = setTimeout(findTarget, 150)
    const t2 = setTimeout(findTarget, 400)
    const t3 = setTimeout(findTarget, 800)
    window.addEventListener('resize', findTarget)
    window.addEventListener('scroll', findTarget, true)
    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3)
      window.removeEventListener('resize', findTarget)
      window.removeEventListener('scroll', findTarget, true)
    }
  }, [findTarget])

  // Qualquer clique avança o tour. O X (pular) usa stopPropagation.
  useEffect(() => {
    if (!isActive) return
    function onClick() { next() }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [isActive, next])

  if (!isActive || step === 'done') return null

  const config = STEPS[step as Exclude<TourStep, 'done'>]
  const stepIdx = ORDER.indexOf(step as Exclude<TourStep, 'done'>)

  function handleSkip(e: React.MouseEvent) {
    e.stopPropagation()
    skip()
  }

  // Sem alvo visível → balão centrado
  if (!rect) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: DIM, padding: '24px 20px',
      }}>
        <Balloon config={config} stepIdx={stepIdx} onSkip={handleSkip} />
      </div>
    )
  }

  const vw = window.innerWidth
  const vh = window.innerHeight

  // Beacon: ponto pulsante no canto direito do item destacado
  const beaconCx = rect.left + rect.width - 16
  const beaconCy = rect.top + rect.height / 2

  // Posição do balão: prefere à direita do item (sidebar); senão abaixo; senão acima
  const GAP = 16
  let bLeft: number
  let bTop: number
  const fitsRight = rect.left + rect.width + GAP + CARD_W <= vw - 8
  if (fitsRight) {
    bLeft = rect.left + rect.width + GAP
    bTop = Math.max(12, Math.min(rect.top, vh - 160))
  } else {
    bLeft = Math.max(12, Math.min(vw - CARD_W - 12, rect.left + rect.width / 2 - CARD_W / 2))
    const below = rect.top + rect.height + GAP
    bTop = below + 150 < vh ? below : Math.max(12, rect.top - 150 - GAP)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000, pointerEvents: 'none' }}>

      {/* 4 painéis de escurecimento — o item fica livre para clique */}
      <div style={{ position: 'absolute', left: 0, top: 0, right: 0, height: Math.max(0, rect.top), background: DIM, pointerEvents: 'all' }} />
      <div style={{ position: 'absolute', left: 0, top: rect.top + rect.height, right: 0, bottom: 0, background: DIM, pointerEvents: 'all' }} />
      <div style={{ position: 'absolute', left: 0, top: rect.top, width: Math.max(0, rect.left), height: rect.height, background: DIM, pointerEvents: 'all' }} />
      <div style={{ position: 'absolute', left: rect.left + rect.width, top: rect.top, right: 0, height: rect.height, background: DIM, pointerEvents: 'all' }} />

      {/* Beacon pulsante */}
      <div style={{ position: 'absolute', left: beaconCx, top: beaconCy, width: 0, height: 0, pointerEvents: 'none' }}>
        <span style={{
          position: 'absolute', left: -7, top: -7, width: 14, height: 14, borderRadius: '50%',
          background: '#6BA86F', animation: 'tour-beacon 1.6s ease-out infinite',
        }} />
        <span style={{
          position: 'absolute', left: -5, top: -5, width: 10, height: 10, borderRadius: '50%',
          background: '#5A8C5E', boxShadow: '0 0 0 2px rgba(255,255,255,0.85)',
        }} />
      </div>

      {/* Balão informativo */}
      <div style={{
        position: 'absolute', top: bTop, left: bLeft, width: CARD_W,
        pointerEvents: 'all', zIndex: 9001,
      }}>
        <Balloon config={config} stepIdx={stepIdx} onSkip={handleSkip} />
      </div>
    </div>
  )
}

function Balloon({ config, stepIdx, onSkip }: {
  config: StepConfig
  stepIdx: number
  onSkip: (e: React.MouseEvent) => void
}) {
  const Icon = config.icon
  return (
    <div className="animate-scale-in" style={{
      background: '#FFFFFF',
      borderRadius: 14,
      padding: '13px 14px',
      boxShadow: '0 10px 40px rgba(10,20,12,0.45)',
      border: '1px solid rgba(61,102,65,0.16)',
      position: 'relative',
    }}>
      {/* Skip */}
      <button onClick={onSkip} title="Pular tour" style={{
        position: 'absolute', top: 8, right: 8,
        background: 'none', border: 'none', cursor: 'pointer', padding: 2,
        color: 'rgba(26,43,28,0.30)', display: 'flex', alignItems: 'center',
      }}>
        <X size={14} />
      </button>

      {/* Título com ícone */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4, paddingRight: 18 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 9, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(61,102,65,0.10)',
        }}>
          <Icon size={15} color="#2D6A35" strokeWidth={2} />
        </div>
        <span style={{ fontFamily: 'var(--font-lora)', fontSize: 14.5, fontWeight: 700, color: '#1A2B1C' }}>
          {config.title}
        </span>
      </div>

      {/* Descrição */}
      <p style={{ fontSize: 12.5, color: 'rgba(26,43,28,0.58)', lineHeight: 1.5, margin: '0 0 10px', paddingLeft: 1 }}>
        {config.desc}
      </p>

      {/* Rodapé: dots + dica */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {ORDER.map((_, i) => (
            <span key={i} style={{
              width: i === stepIdx ? 16 : 5, height: 5, borderRadius: 3,
              background: i === stepIdx ? '#5A8C5E' : 'rgba(61,102,65,0.22)',
              transition: 'width .2s',
            }} />
          ))}
        </div>
        <span style={{ fontSize: 11, color: 'rgba(26,43,28,0.42)', fontWeight: 500 }}>
          clique para continuar
        </span>
      </div>
    </div>
  )
}
