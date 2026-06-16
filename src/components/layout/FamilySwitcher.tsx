'use client'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { ChevronDown, Check, Crown, Users, Plus, Loader2 } from 'lucide-react'
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

export default function FamilySwitcher({ families: initial }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [families, setFamilies] = useState(initial)
  const [open, setOpen] = useState(false)
  const [switching, setSwitching] = useState(false)
  const [creating, setCreating] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setFamilies(initial) }, [initial])

  useEffect(() => {
    if (!open) { setShowCreate(false); setNewName('') }
  }, [open])

  useEffect(() => {
    if (showCreate) setTimeout(() => inputRef.current?.focus(), 50)
  }, [showCreate])

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      const t = e.target as Node
      const insideTrigger = ref.current?.contains(t)
      const insideDropdown = dropdownRef.current?.contains(t)
      if (!insideTrigger && !insideDropdown) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const active = families.find(f => f.is_active) ?? families[0]

  async function handleSwitch(familyId: string) {
    if (familyId === active?.family_id || switching) return
    setOpen(false)
    setSwitching(true)
    try {
      await supabase.rpc('switch_active_family', { p_family_id: familyId })
      router.refresh()
    } finally {
      setSwitching(false)
    }
  }

  async function handleCreate() {
    if (creating) return
    setCreating(true)
    try {
      const { data: newFamilyId, error } = await supabase.rpc('create_my_family', {
        p_name: newName.trim() || 'Minha Família',
      })
      if (error || !newFamilyId) { console.error(error); return }
      setOpen(false)
      router.refresh()
    } finally {
      setCreating(false)
    }
  }

  // Mostra o botão trigger mesmo com 0 famílias (parceiro puro sem família própria)
  const showTrigger = families.length > 1 || families.length === 0 || !families.some(f => f.is_owner)

  if (!showTrigger && families.length <= 1 && families.some(f => f.is_owner)) return null

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
        <span style={{ fontSize: 12, fontWeight: 700, color: '#1A2B1C', maxWidth: 100,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {switching ? 'Trocando...' : (active?.family_name ?? 'Família')}
        </span>
        <ChevronDown size={11} color="rgba(44,74,46,0.55)"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s', flexShrink: 0 }} />
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <div ref={dropdownRef} style={{
          position: 'fixed', top: 60, left: 8, right: 8, maxWidth: 320, margin: '0 auto',
          zIndex: 99999, borderRadius: 16, overflow: 'hidden',
          background: 'linear-gradient(160deg,#FFFFFF,#F8F3EA)',
          border: '1px solid rgba(61,102,65,0.18)',
          boxShadow: '0 8px 32px rgba(44,74,46,0.18)',
        }}>
          {families.length > 0 && (
            <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid rgba(61,102,65,0.10)' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(26,43,28,0.45)',
                textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Suas famílias
              </span>
            </div>
          )}

          {families.map(f => (
            <button
              key={f.family_id}
              onClick={() => handleSwitch(f.family_id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '11px 14px', border: 'none', cursor: 'pointer', textAlign: 'left',
                background: f.is_active ? 'rgba(61,102,65,0.06)' : 'transparent',
              }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: f.is_owner
                  ? 'linear-gradient(140deg,#3D6641,#2C4A2E)'
                  : 'linear-gradient(140deg,#6366f1,#4338CA)',
              }}>
                {f.is_owner ? <Crown size={14} color="#D4E8D5" /> : <Users size={14} color="#E0E7FF" />}
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

          {/* Criar nova família */}
          <div style={{ borderTop: families.length > 0 ? '1px solid rgba(61,102,65,0.10)' : 'none' }}>
            {!showCreate ? (
              <button
                onClick={() => setShowCreate(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  width: '100%', padding: '11px 14px', border: 'none', cursor: 'pointer',
                  background: 'transparent', color: '#2D6A35',
                }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(61,102,65,0.10)', border: '1.5px dashed rgba(61,102,65,0.30)',
                }}>
                  <Plus size={14} color="#2D6A35" />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Criar minha família</span>
              </button>
            ) : (
              <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ fontSize: 12, color: 'rgba(26,43,28,0.55)', margin: 0 }}>
                  Dê um nome para a sua família:
                </p>
                <input
                  ref={inputRef}
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  placeholder="Ex.: Família Silva"
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 8, fontSize: 13,
                    border: '1.5px solid rgba(61,102,65,0.30)', outline: 'none',
                    background: '#FAFAF8', color: '#1A2B1C', boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => { setShowCreate(false); setNewName('') }}
                    style={{
                      flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 12, fontWeight: 600,
                      border: '1px solid rgba(61,102,65,0.20)', background: 'transparent',
                      color: 'rgba(26,43,28,0.55)', cursor: 'pointer',
                    }}>
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={creating}
                    style={{
                      flex: 2, padding: '7px 0', borderRadius: 8, fontSize: 12, fontWeight: 700,
                      border: 'none', background: 'linear-gradient(140deg,#3D6641,#2C4A2E)',
                      color: '#fff', cursor: creating ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                      opacity: creating ? 0.7 : 1,
                    }}>
                    {creating
                      ? <><Loader2 size={11} className="animate-spin" /> Criando...</>
                      : 'Criar família'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
