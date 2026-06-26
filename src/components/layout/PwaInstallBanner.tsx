'use client'
import { useEffect, useState } from 'react'
import { X, Download, Share } from 'lucide-react'

const DISMISS_KEY = 'fef-pwa-install-dismissed'

declare global {
  interface Window {
    _pwaInstallPrompt?: BeforeInstallPromptEvent
  }
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isIos() {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isInStandaloneMode() {
  if (typeof window === 'undefined') return false
  return (
    ('standalone' in window.navigator &&
      (window.navigator as { standalone?: boolean }).standalone === true) ||
    window.matchMedia('(display-mode: standalone)').matches
  )
}

export default function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [showIos, setShowIos] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isInStandaloneMode()) return
    if (sessionStorage.getItem(DISMISS_KEY)) return

    if (isIos()) {
      setShowIos(true)
      setVisible(true)
      return
    }

    // Evento pode ter disparado antes da hydration — capturado no script inline do layout
    if (window._pwaInstallPrompt) {
      setDeferredPrompt(window._pwaInstallPrompt)
      setVisible(true)
      return
    }

    // Senão, escuta para quando ainda não disparou
    const handler = (e: Event) => {
      e.preventDefault()
      const prompt = e as BeforeInstallPromptEvent
      window._pwaInstallPrompt = prompt
      setDeferredPrompt(prompt)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function install() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      window._pwaInstallPrompt = undefined
      setVisible(false)
    }
    setDeferredPrompt(null)
  }

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: `calc(env(safe-area-inset-bottom, 0px) + 12px)`,
        left: 12,
        right: 12,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        background: 'linear-gradient(135deg, #2C4A2E, #3D6641)',
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
        color: 'white',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          flexShrink: 0,
          background: 'rgba(255,255,255,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {showIos ? <Share size={16} color="white" /> : <Download size={16} color="white" />}
      </div>

      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>
          {showIos ? 'Adicione à tela inicial' : 'Instale o Família em Foco'}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 11, opacity: 0.8, lineHeight: 1.4 }}>
          {showIos
            ? 'Toque em Compartilhar ⬆ na barra inferior do Safari e escolha "Adicionar à Tela de Início"'
            : 'Acesse mais rápido, com ícone próprio e sem barra do navegador'}
        </p>
      </div>

      {!showIos && (
        <button
          onClick={install}
          style={{
            flexShrink: 0,
            padding: '7px 14px',
            borderRadius: 10,
            background: 'rgba(255,255,255,0.20)',
            border: '1px solid rgba(255,255,255,0.35)',
            color: 'white',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Instalar
        </button>
      )}

      <button
        onClick={dismiss}
        style={{
          flexShrink: 0,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 4,
          color: 'white',
          opacity: 0.65,
        }}
      >
        <X size={14} />
      </button>
    </div>
  )
}
