'use client'
import { useEffect, useState } from 'react'
import { CheckCircle2, AlertCircle, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'
interface ToastItem { id: number; message: string; type: ToastType }

// API global: importe { toast } e chame toast('Salvo!') de qualquer client component
export function toast(message: string, type: ToastType = 'success') {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('app-toast', { detail: { message, type } }))
}

let nextId = 1

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([])

  useEffect(() => {
    function onToast(e: Event) {
      const { message, type } = (e as CustomEvent<{ message: string; type: ToastType }>).detail
      const id = nextId++
      setItems(prev => [...prev.slice(-2), { id, message, type }])
      setTimeout(() => setItems(prev => prev.filter(t => t.id !== id)), 3200)
    }
    window.addEventListener('app-toast', onToast)
    return () => window.removeEventListener('app-toast', onToast)
  }, [])

  if (items.length === 0) return null

  const palette: Record<ToastType, { bg: string; fg: string; Icon: typeof CheckCircle2 }> = {
    success: { bg: 'linear-gradient(140deg,#3D6641,#2C4A2E)', fg: '#D4E8D5', Icon: CheckCircle2 },
    error:   { bg: 'linear-gradient(140deg,#9B3535,#7A2424)', fg: '#FBDCDC', Icon: AlertCircle },
    info:    { bg: 'linear-gradient(140deg,#8B6B4A,#6E5238)', fg: '#F4E8D8', Icon: Info },
  }

  return (
    <div className="fixed left-1/2 z-[120] flex flex-col items-center gap-2 pointer-events-none"
      style={{ bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))', transform: 'translateX(-50%)', width: 'min(92vw, 380px)' }}>
      {items.map(t => {
        const { bg, fg, Icon } = palette[t.type]
        return (
          <div key={t.id} className="flex items-center gap-2.5 px-4 py-3 rounded-[14px] w-full animate-slide-up"
            style={{ background: bg, color: fg, boxShadow: '0 8px 28px rgba(10,20,12,0.35), 0 -1px 0 rgba(255,255,255,0.12) inset' }}>
            <Icon size={16} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.35 }}>{t.message}</span>
          </div>
        )
      })}
    </div>
  )
}
