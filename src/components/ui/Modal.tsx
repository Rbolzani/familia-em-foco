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
      style={{ background: 'rgba(26,21,53,0.45)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={`w-full ${sizes[size]} my-auto animate-scale-in`}
        style={{
          background: '#FEFEFE',
          borderRadius: '28px',
          boxShadow: '0 24px 80px rgba(123,111,232,0.20), 0 0 0 1px rgba(123,111,232,0.08)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid rgba(123,111,232,0.08)' }}>
          <h3 className="text-lg font-bold tracking-tight" style={{ fontFamily: 'var(--font-gilda)', color: '#1A1535' }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-2xl flex items-center justify-center transition-all hover:bg-lavender"
            style={{ color: '#8585A8', background: 'rgba(123,111,232,0.06)' }}
          >
            <X size={16} />
          </button>
        </div>
        {/* Body */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}
