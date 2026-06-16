'use client'
import { useRouter } from 'next/navigation'
import { useRef } from 'react'
import { useRealtime } from '@/lib/useRealtime'

/**
 * Montado uma vez no layout. Ao receber qualquer mudança em activities
 * ou family_members, faz um router.refresh() (debounced) para re-renderizar
 * os Server Components com dados frescos — propagando ao vivo:
 *  - marcadores de leva/busca entre owner e partner
 *  - mudança de tipo de acesso / partner entrando na família
 */
export default function RealtimeSync() {
  const router = useRouter()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useRealtime(['activities', 'family_members', 'children'], () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => router.refresh(), 300)
  })

  return null
}
