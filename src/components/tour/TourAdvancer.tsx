'use client'
import { useEffect } from 'react'
import { useTour, TourStep } from './TourContext'

export function TourAdvancer({ step }: { step: TourStep }) {
  const { advance } = useTour()
  useEffect(() => {
    advance(step as Exclude<TourStep, 'done'>)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}
