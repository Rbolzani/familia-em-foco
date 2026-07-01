'use client'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'

interface Props {
  title: string
  subtitle?: string
  /** Botão primário (ação local, ex.: abrir modal "Nova") */
  actionLabel?: string
  onAction?: () => void
  /** Mostra atalho secundário para a captura por IA */
  showIaShortcut?: boolean
}

/** Ilustração da marca: broto de folhas crescendo de uma linha de chão */
function SproutIllustration() {
  return (
    <svg width="150" height="104" viewBox="0 0 150 104" fill="none" aria-hidden="true">
      {/* chão */}
      <path d="M22 92 Q75 86 128 92" stroke="rgba(61,102,65,0.25)" strokeWidth="2.5" strokeLinecap="round" />
      {/* caule */}
      <path d="M75 90 C75 72 73 58 75 42" stroke="#3D6641" strokeWidth="3" strokeLinecap="round" />
      {/* folha esquerda */}
      <path d="M74 62 C58 60 48 48 50 34 C64 36 74 46 74 62 Z" fill="#5A8C5E" opacity="0.85" />
      <path d="M73 60 C64 54 57 46 53 38" stroke="rgba(248,243,234,0.75)" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      {/* folha direita */}
      <path d="M76 50 C92 48 102 36 100 22 C86 24 76 34 76 50 Z" fill="#2C4A2E" />
      <path d="M77 48 C86 42 93 34 97 26" stroke="rgba(212,232,213,0.55)" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      {/* broto topo */}
      <circle cx="75" cy="38" r="4.5" fill="#C49A6C" />
      {/* sementinhas no chão */}
      <circle cx="44" cy="90" r="2.2" fill="rgba(196,154,108,0.55)" />
      <circle cx="106" cy="89" r="2.2" fill="rgba(90,140,94,0.45)" />
      <circle cx="94" cy="93" r="1.6" fill="rgba(61,102,65,0.35)" />
    </svg>
  )
}

export default function EmptyState({ title, subtitle, actionLabel, onAction, showIaShortcut = true }: Props) {
  return (
    <div className="card p-10 text-center animate-fade-up flex flex-col items-center"
      style={{ border: '2px dashed rgba(61,102,65,0.25)' }}>
      <div className="animate-float" style={{ marginBottom: 6 }}>
        <SproutIllustration />
      </div>
      <h3 style={{ fontFamily: 'var(--font-lora)', fontSize: 19, fontWeight: 700, color: '#1A2B1C', marginBottom: 4 }}>
        {title}
      </h3>
      {subtitle && (
        <p style={{ fontSize: 13.5, color: 'rgba(26,43,28,0.50)', maxWidth: 340, lineHeight: 1.5, marginBottom: 18 }}>
          {subtitle}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[13px] text-sm font-bold transition-all hover:brightness-105 active:scale-95"
            style={{ background: 'linear-gradient(140deg,#FF8A6E,#FF6B5C)', color: '#fff',
              boxShadow: '0 4px 16px rgba(255,107,92,0.30)' }}>
            {actionLabel}
          </button>
        )}
        {showIaShortcut && (
          <Link href="/ia"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[13px] text-sm font-bold transition-all hover:bg-black/[0.04] active:scale-95"
            style={{ color: '#3D6641', border: '1.5px solid rgba(61,102,65,0.30)' }}>
            <Sparkles size={14} /> Fotografe a agenda
          </Link>
        )}
      </div>
    </div>
  )
}
