'use client'
import { createContext, useContext, useState, useEffect, useCallback } from 'react'

export type TourStep = 'children' | 'invite' | 'ia' | 'done'

const STORAGE_KEY = 'fef-tour-v1'
const ORDER: TourStep[] = ['children', 'invite', 'ia', 'done']

interface TourCtx {
  step: TourStep
  isActive: boolean
  advance: (from: TourStep) => void
  skip: () => void
}

const Ctx = createContext<TourCtx>({
  step: 'done',
  isActive: false,
  advance: () => {},
  skip: () => {},
})

export function TourProvider({
  children,
  hasChildren,
}: {
  children: React.ReactNode
  hasChildren: boolean
}) {
  const [step, setStep] = useState<TourStep>('done')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as TourStep | null
    if (saved) {
      setStep(saved)
    } else if (hasChildren) {
      // Usuário existente que já tem filhos — pular tour
      setStep('done')
      localStorage.setItem(STORAGE_KEY, 'done')
    } else {
      // Novo usuário — iniciar tour
      setStep('children')
      localStorage.setItem(STORAGE_KEY, 'children')
    }
    setMounted(true)
  }, [hasChildren])

  const advance = useCallback((from: TourStep) => {
    setStep(prev => {
      if (prev !== from) return prev // só avança se estiver no passo correto
      const idx = ORDER.indexOf(prev)
      const next = ORDER[Math.min(idx + 1, ORDER.length - 1)]
      localStorage.setItem(STORAGE_KEY, next)
      return next
    })
  }, [])

  const skip = useCallback(() => {
    setStep('done')
    localStorage.setItem(STORAGE_KEY, 'done')
  }, [])

  return (
    <Ctx.Provider value={{ step, isActive: mounted && step !== 'done', advance, skip }}>
      {children}
    </Ctx.Provider>
  )
}

export function useTour() {
  return useContext(Ctx)
}
