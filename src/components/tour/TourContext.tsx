'use client'
import { createContext, useContext, useState, useEffect, useCallback } from 'react'

export type TourStep = 'children' | 'invite' | 'ia' | 'done'

const ORDER: TourStep[] = ['children', 'invite', 'ia', 'done']
const storageKey = (userId: string) => `fef-tour-v1-${userId}`

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
  userId,
}: {
  children: React.ReactNode
  hasChildren: boolean
  userId: string
}) {
  const [step, setStep] = useState<TourStep>('done')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (!userId) return
    const key = storageKey(userId)
    const saved = localStorage.getItem(key) as TourStep | null
    if (saved) {
      setStep(saved)
    } else if (hasChildren) {
      setStep('done')
      localStorage.setItem(key, 'done')
    } else {
      setStep('children')
      localStorage.setItem(key, 'children')
    }
    setMounted(true)
  }, [hasChildren, userId])

  const advance = useCallback((from: TourStep) => {
    setStep(prev => {
      if (prev !== from) return prev
      const idx = ORDER.indexOf(prev)
      const next = ORDER[Math.min(idx + 1, ORDER.length - 1)]
      if (userId) localStorage.setItem(storageKey(userId), next)
      return next
    })
  }, [userId])

  const skip = useCallback(() => {
    setStep('done')
    if (userId) localStorage.setItem(storageKey(userId), 'done')
  }, [userId])

  return (
    <Ctx.Provider value={{ step, isActive: mounted && step !== 'done', advance, skip }}>
      {children}
    </Ctx.Provider>
  )
}

export function useTour() {
  return useContext(Ctx)
}
