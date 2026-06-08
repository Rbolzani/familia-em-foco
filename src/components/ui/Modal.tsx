'use client'
import { useEffect, ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }

export default function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) {
      document.addEventListener('keydown', handler)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 overflow-auto animate-fade-in"
      style={{ background: 'rgba(14,22,15,0.50)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={`w-full ${sizes[size]} my-auto animate-scale-in`}
        style={{
          backgroundImage: 'linear-gradient(160deg,#FFFFFF 0%,#F8F3EA 100%)',
          borderRadius: '20px 13px 18px 15px',
          border: '1px solid rgba(61,102,65,0.18)',
          boxShadow: '0 24px 72px rgba(44,74,46,0.20),0 2px 8px rgba(44,74,46,0.10),0 -1px 0 rgba(255,255,255,0.85) inset,0 1px 0 rgba(0,0,0,0.035) inset',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid rgba(61,102,65,0.12)' }}>
          <h3 className="text-lg font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-lora)', color: '#1A2B1C' }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-[11px] flex items-center justify-center transition-all hover:bg-black/[0.05]"
            style={{
              color: 'rgba(26,43,28,0.45)',
              background: 'rgba(61,102,65,0.07)',
              border: '1px solid rgba(61,102,65,0.12)',
              boxShadow: '0 1px 3px rgba(44,74,46,0.07),0 -1px 0 rgba(255,255,255,0.55) inset',
            }}
          >
            <X size={14} />
          </button>
        </div>
        {/* Body */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}
