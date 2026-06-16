'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Check, Crown, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export interface FamilyOption {
  family_id: string
  family_name: string
  is_owner: boolean
  is_active: boolean
  member_count: number
}

interface Props {
  families: FamilyOption[]
}

export default function FamilySwitcher({ families }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [switching, setSwitching] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Só renderiza se o usuário pertence a mais de 1 família
  if (families.length <= 1) return null

  const active = families.find(f => f.is_active) ?? families[0]

  async function handleSwitch(familyId: string) {
    if (familyId === active.family_id || switching) return
    setOpen(false)
    setSwitching(true)
    try {
      const { data, error } = await supabase.rpc('switch_active_family', { p_family_id: familyId })
      if (error || data === false) {
        console.error('Erro ao trocar família:', error)
        return
      }
      // Recarrega todas as Server Components da página
      router.refresh()
    } finally {
      setSwitching(false)
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={switching}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 10px 5px 8px', borderRadius: 10, border: 'none', cursor: 'pointer',
          background: 'rgba(61,102,65,0.10)', transition: 'background .15s',
          opacity: switching ? 0.6 : 1,
        }}>
        <Users size={13} color="rgba(44,74,46,0.65)" />
        <span style={{ fontSize: 12, fontWeight: 700, color: '#1A2B1C', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {switching ? 'Trocando...' : active.family_name}
        </span>
        <ChevronDown size={11} color="rgba(44,74,46,0.55)"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s', flexShrink: 0 }} />
      </button>

      {open && (
        <div style={{
          position: 'fixed', top: 60, left: 8, right: 8, maxWidth: 320, margin: '0 auto',
          zIndex: 9999, borderRadius: 16, overflow: 'hidden',
          background: 'linear-gradient(160deg,#FFFFFF,#F8F3EA)',
          border: '1px solid rgba(61,102,65,0.18)',
          boxShadow: '0 8px 32px rgba(44,74,46,0.18)',
        }}>
          <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid rgba(61,102,65,0.10)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(26,43,28,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Suas famílias
            </span>
          </div>
          {families.map(f => (
            <button
              key={f.family_id}
              onClick={() => handleSwitch(f.family_id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '11px 14px', border: 'none', cursor: 'pointer', textAlign: 'left',
                background: f.is_active ? 'rgba(61,102,65,0.06)' : 'transparent',
                transition: 'background .12s',
              }}
              onMouseEnter={e => { if (!f.is_active) (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.03)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = f.is_active ? 'rgba(61,102,65,0.06)' : 'transparent' }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: f.is_owner ? 'linear-gradient(140deg,#3D6641,#2C4A2E)' : 'linear-gradient(140deg,#6366f1,#4338CA)',
              }}>
                {f.is_owner
                  ? <Crown size={14} color="#D4E8D5" />
                  : <Users size={14} color="#E0E7FF" />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: f.is_active ? 700 : 500, color: '#1A2B1C',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.family_name}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(26,43,28,0.45)', marginTop: 1 }}>
                  {f.is_owner ? 'Você é o dono' : 'Acesso compartilhado'} · {f.member_count} membro{f.member_count !== 1 ? 's' : ''}
                </div>
              </div>
              {f.is_active && <Check size={14} color="#2D6A35" style={{ flexShrink: 0 }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
