'use client'
import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Assina mudanças (INSERT/UPDATE/DELETE) das tabelas informadas via
 * Supabase Realtime e dispara `onChange` a cada evento. A RLS é
 * respeitada: cada usuário só recebe eventos das linhas que pode ler
 * (escopo de família). `onChange` é mantido em ref para não recriar a
 * assinatura a cada render.
 */
export function useRealtime(tables: string[], onChange: () => void) {
  const cb = useRef(onChange)
  cb.current = onChange

  // chave estável para os deps sem recriar canal a cada render
  const key = tables.join(',')

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel(`rt-${key}-${Math.random().toString(36).slice(2)}`)

    for (const table of tables) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => cb.current(),
      )
    }

    channel.subscribe()
    return () => { supabase.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
}
