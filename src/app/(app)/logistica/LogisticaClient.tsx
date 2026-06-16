'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Car, Home, Users, LayoutList, AlertTriangle, ChevronRight, ChevronDown, Clock, Check, X, Bell } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { toast } from '@/components/ui/Toast'
import EmptyState from '@/components/ui/EmptyState'
import { useAccess } from '@/components/access/AccessContext'

interface Child { id: string; name: string; avatar_color: string }

interface Activity {
  id: string
  user_id: string
  child_id: string
  category: 'escola' | 'saude' | 'extracurricular'
  title: string
  date: string
  time: string | null
  location: string | null
  takes_user_id: string | null
  picks_user_id: string | null
  child?: { name: string; avatar_color: string }
}

interface FamilyMember {
  user_id: string
  display_name: string | null
  role: string
}

export interface LogisticsSuggestion {
  id: string
  activity_id: string
  field: 'takes_user_id' | 'picks_user_id'
  proposed_by: string
  proposed_to: string
  family_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}

interface Props {
  activities: Activity[]
  children: Child[]
  familyMembers: FamilyMember[]
  currentUserId: string
  familyId: string | null
  pendingSuggestions: LogisticsSuggestion[]
}

const catEmoji: Record<string, string> = { escola: '📘', saude: '🩺', extracurricular: '⭐' }
const catLabel: Record<string, string> = { escola: 'Escola', saude: 'Saúde', extracurricular: 'Extracurricular' }

// ─── LogChip — dropdown para selecionar quem leva/busca ──────────────────────
function LogChip({
  actId, field, value, activity,
  suggestions, familyMembers, currentUserId, familyId, isOwner,
  canLogistics, onUpdate,
}: {
  actId: string
  field: 'takes_user_id' | 'picks_user_id'
  value: string | null
  activity: Activity
  suggestions: LogisticsSuggestion[]
  familyMembers: FamilyMember[]
  currentUserId: string
  familyId: string | null
  isOwner: boolean
  canLogistics: boolean
  onUpdate: (actId: string, field: 'takes_user_id' | 'picks_user_id', newVal: string | null, removeSuggestion?: string) => void
}) {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const pendingSug = suggestions.find(s => s.activity_id === actId && s.field === field && s.status === 'pending')

  function memberName(userId: string | null | undefined): string {
    if (!userId) return ''
    if (userId === currentUserId) return 'Você'
    const m = familyMembers.find(fm => fm.user_id === userId)
    return m?.display_name ?? 'Parceiro(a)'
  }

  // Quem o usuário atual pode sugerir:
  // Owner → qualquer membro; Partner → só a si mesmo
  const canSuggestTo = (targetId: string) => {
    if (targetId === currentUserId) return true
    if (isOwner) return true
    return false
  }

  // Verificar se slot está bloqueado: alguém já confirmou E não sou eu, e não é pending
  const confirmedByOther = value && value !== currentUserId && !pendingSug
  const blockedForPartner = !isOwner && confirmedByOther

  async function handleSelect(targetUserId: string | null) {
    setOpen(false)
    if (loading) return
    setLoading(true)

    try {
      // Limpar slot
      if (targetUserId === null) {
        // Se há pendência, cancela a sugestão
        if (pendingSug && pendingSug.proposed_by === currentUserId) {
          await supabase.from('logistics_suggestions').delete().eq('id', pendingSug.id)
          onUpdate(actId, field, null, pendingSug.id)
          toast('Sugestão cancelada')
        } else if (!pendingSug && value === currentUserId) {
          // Auto-atribuído por mim, limpo diretamente
          await supabase.from('activities').update({ [field]: null }).eq('id', actId)
          onUpdate(actId, field, null)
          toast(field === 'takes_user_id' ? 'Você liberou quem leva' : 'Você liberou quem busca')
        }
        return
      }

      // Se selecionar a si mesmo → atribuição direta
      if (targetUserId === currentUserId) {
        // Se há pendência que NÃO é minha, não posso auto-atribuir (deve aceitar)
        if (pendingSug && pendingSug.proposed_to === currentUserId) {
          toast('Você tem uma sugestão pendente para este slot. Aceite ou recuse primeiro.', 'error')
          return
        }
        await supabase.from('activities').update({ [field]: currentUserId }).eq('id', actId)
        // Se havia pendência proposta por mim para outro, cancela
        if (pendingSug && pendingSug.proposed_by === currentUserId) {
          await supabase.from('logistics_suggestions').delete().eq('id', pendingSug.id)
          onUpdate(actId, field, currentUserId, pendingSug.id)
        } else {
          onUpdate(actId, field, currentUserId)
        }
        const what = field === 'takes_user_id' ? 'leva' : 'busca'
        toast(`Você assumiu quem ${what} ✓`)
        return
      }

      // Selecionar outro membro → criar sugestão (se não há pendência para este slot)
      if (pendingSug) {
        toast('Já há uma sugestão pendente para este slot.', 'error')
        return
      }

      if (!familyId) { toast('Família não encontrada', 'error'); return }

      const { data: sug, error } = await supabase
        .from('logistics_suggestions')
        .insert({
          activity_id: actId,
          field,
          proposed_by: currentUserId,
          proposed_to: targetUserId,
          family_id: familyId,
          status: 'pending',
        })
        .select()
        .single()

      if (error) { toast('Erro ao criar sugestão', 'error'); return }

      // Side effects: WhatsApp + in-app notification via API
      fetch('/api/logistics-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'suggest',
          suggestionId: sug.id,
          proposedTo: targetUserId,
          familyId,
          activityTitle: activity.title,
        }),
      }).catch(() => {/* non-fatal */})

      onUpdate(actId, field, null, undefined) // activity field stays null until accepted
      toast(`Sugestão enviada para ${memberName(targetUserId)} ✓`)
    } finally {
      setLoading(false)
    }
  }

  async function handleAccept() {
    if (!pendingSug || loading) return
    setLoading(true)
    try {
      await fetch('/api/logistics-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'accept',
          suggestionId: pendingSug.id,
          activityId: actId,
          field,
          proposedBy: pendingSug.proposed_by,
          familyId,
          activityTitle: activity.title,
        }),
      })
      onUpdate(actId, field, currentUserId, pendingSug.id)
      toast('Logística confirmada ✓')
    } finally {
      setLoading(false)
    }
  }

  async function handleReject() {
    if (!pendingSug || loading) return
    setLoading(true)
    try {
      await fetch('/api/logistics-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          suggestionId: pendingSug.id,
          proposedBy: pendingSug.proposed_by,
          familyId,
          activityTitle: activity.title,
          activityDate: activity.date,
        }),
      })
      await supabase.from('logistics_suggestions').update({ status: 'rejected' }).eq('id', pendingSug.id)
      onUpdate(actId, field, null, pendingSug.id)
      toast('Sugestão recusada')
    } finally {
      setLoading(false)
    }
  }

  const icon = field === 'takes_user_id' ? <Car size={11} /> : <Home size={11} />

  // ── Estado: PENDENTE ────────────────────────────────────────────────────
  if (pendingSug) {
    const isProposedToMe = pendingSug.proposed_to === currentUserId
    const isProposedByMe = pendingSug.proposed_by === currentUserId

    if (isProposedToMe) {
      // Posso aceitar ou recusar diretamente no chip
      return (
        <div className="flex items-center gap-1" style={{ minWidth: 90 }}>
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg"
            style={{ fontSize: 11, fontWeight: 600, background: 'rgba(245,158,11,0.10)', border: '1.5px solid rgba(245,158,11,0.40)', color: '#92400E', gap: 4 }}>
            {icon}
            <Clock size={10} />
            <span>{memberName(pendingSug.proposed_to)}</span>
          </div>
          <button onClick={handleAccept} disabled={loading} title="Aceitar"
            className="w-6 h-6 rounded-md flex items-center justify-center transition-all hover:brightness-105 active:scale-95"
            style={{ background: 'rgba(61,102,65,0.15)', border: '1px solid rgba(61,102,65,0.30)', cursor: 'pointer', flexShrink: 0 }}>
            <Check size={11} color="#2D6A35" />
          </button>
          <button onClick={handleReject} disabled={loading} title="Recusar"
            className="w-6 h-6 rounded-md flex items-center justify-center transition-all hover:brightness-105 active:scale-95"
            style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)', cursor: 'pointer', flexShrink: 0 }}>
            <X size={11} color="#DC2626" />
          </button>
        </div>
      )
    }

    if (isProposedByMe) {
      // Posso cancelar a sugestão
      return (
        <button onClick={() => handleSelect(null)} disabled={loading}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all hover:brightness-95 active:scale-95"
          style={{ fontSize: 11, fontWeight: 600, cursor: 'pointer', minWidth: 90,
            background: 'rgba(245,158,11,0.08)', border: '1.5px dashed rgba(245,158,11,0.50)', color: '#92400E' }}>
          {icon}<Clock size={10} />{memberName(pendingSug.proposed_to)}
        </button>
      )
    }

    // Outra pessoa tem sugestão — mostrar apenas
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
        style={{ fontSize: 11, fontWeight: 600, minWidth: 90,
          background: 'rgba(245,158,11,0.06)', border: '1.5px solid rgba(245,158,11,0.28)', color: '#92400E', cursor: 'default' }}>
        {icon}<Clock size={10} />{memberName(pendingSug.proposed_to)}
      </div>
    )
  }

  // ── Leitura apenas (sem permissão de edição) ───────────────────────────
  if (!canLogistics) {
    let style: React.CSSProperties
    if (!value) style = { background: 'rgba(61,102,65,0.05)', border: '1.5px dashed rgba(61,102,65,0.25)', color: 'rgba(26,43,28,0.40)' }
    else if (value === currentUserId) style = { background: 'rgba(61,102,65,0.10)', border: '1.5px solid rgba(61,102,65,0.30)', color: '#2D6A35' }
    else style = { background: 'rgba(99,102,241,0.08)', border: '1.5px solid rgba(99,102,241,0.25)', color: '#4338CA' }
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
        style={{ fontSize: 11, fontWeight: 600, minWidth: 90, cursor: 'default', ...style }}>
        {icon}{value ? memberName(value) : '—'}
      </div>
    )
  }

  // ── Slot confirmado por outro — bloqueado para partners ────────────────
  if (blockedForPartner) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
        style={{ fontSize: 11, fontWeight: 600, minWidth: 90, cursor: 'not-allowed',
          background: 'rgba(99,102,241,0.08)', border: '1.5px solid rgba(99,102,241,0.25)', color: '#4338CA' }}>
        {icon}{memberName(value)}
      </div>
    )
  }

  // ── Owner: bloqueado se outro partner já confirmou ─────────────────────
  if (isOwner && confirmedByOther) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
        title="Aguardando o parceiro liberar este slot"
        style={{ fontSize: 11, fontWeight: 600, minWidth: 90, cursor: 'not-allowed',
          background: 'rgba(99,102,241,0.08)', border: '1.5px solid rgba(99,102,241,0.25)', color: '#4338CA' }}>
        {icon}{memberName(value)}
      </div>
    )
  }

  // ── Estilo do chip no estado normal ───────────────────────────────────
  let chipStyle: React.CSSProperties
  if (!value) chipStyle = { background: 'rgba(61,102,65,0.05)', border: '1.5px dashed rgba(61,102,65,0.25)', color: 'rgba(26,43,28,0.40)' }
  else if (value === currentUserId) chipStyle = { background: 'rgba(61,102,65,0.10)', border: '1.5px solid rgba(61,102,65,0.30)', color: '#2D6A35' }
  else chipStyle = { background: 'rgba(99,102,241,0.08)', border: '1.5px solid rgba(99,102,241,0.25)', color: '#4338CA' }

  // ── Dropdown ────────────────────────────────────────────────────────────
  const members = familyMembers.filter(m => canSuggestTo(m.user_id))

  return (
    <div ref={ref} className="relative" style={{ minWidth: 90 }}>
      <button
        onClick={() => setOpen(o => !o)}
        disabled={loading}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg w-full transition-all hover:brightness-95 active:scale-95"
        style={{ fontSize: 11, fontWeight: 600, cursor: 'pointer', ...chipStyle }}>
        {icon}
        <span className="flex-1 text-left truncate">{value ? memberName(value) : 'Definir'}</span>
        <ChevronDown size={10} style={{ flexShrink: 0, opacity: 0.6, transform: open ? 'rotate(180deg)' : undefined, transition: 'transform .15s' }} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 py-1 rounded-xl shadow-xl"
          style={{ minWidth: 150, top: '100%', left: 0,
            background: 'linear-gradient(160deg,#FFFFFF,#F8F3EA)',
            border: '1px solid rgba(61,102,65,0.18)',
            boxShadow: '0 8px 24px rgba(44,74,46,0.18)' }}>

          {/* Nenhum */}
          {value && (
            <button onClick={() => handleSelect(null)}
              className="flex items-center gap-2 w-full px-3 py-2 text-left transition-colors hover:bg-black/[0.04]"
              style={{ fontSize: 12, color: 'rgba(26,43,28,0.45)', border: 'none', background: 'none', cursor: 'pointer' }}>
              <span className="w-4 h-4 rounded-full border border-dashed" style={{ borderColor: 'rgba(61,102,65,0.35)', flexShrink: 0 }} />
              Nenhum
            </button>
          )}

          {/* Você */}
          <button onClick={() => handleSelect(currentUserId)}
            className="flex items-center gap-2 w-full px-3 py-2 text-left transition-colors hover:bg-black/[0.04]"
            style={{ fontSize: 12, fontWeight: value === currentUserId ? 700 : 500,
              color: value === currentUserId ? '#2D6A35' : '#1A2B1C',
              border: 'none', background: 'none', cursor: 'pointer' }}>
            <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(140deg,#3D6641,#2C4A2E)' }}>V</span>
            Você {value === currentUserId && '✓'}
          </button>

          {/* Partners */}
          {members.filter(m => m.user_id !== currentUserId).map(m => (
            <button key={m.user_id} onClick={() => handleSelect(m.user_id)}
              className="flex items-center gap-2 w-full px-3 py-2 text-left transition-colors hover:bg-black/[0.04]"
              style={{ fontSize: 12, fontWeight: value === m.user_id ? 700 : 500,
                color: value === m.user_id ? '#4338CA' : '#1A2B1C',
                border: 'none', background: 'none', cursor: 'pointer' }}>
              <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                style={{ background: 'linear-gradient(140deg,#6366f1,#4338CA)' }}>
                {(m.display_name ?? '?').charAt(0).toUpperCase()}
              </span>
              {m.display_name ?? 'Parceiro(a)'}
              {value === m.user_id ? ' ✓' : ' (sugerir)'}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Painel de pendências para o usuário atual ────────────────────────────────
function PendingPanel({
  suggestions, activities, familyMembers, currentUserId, familyId, onSuggestionHandled,
}: {
  suggestions: LogisticsSuggestion[]
  activities: Activity[]
  familyMembers: FamilyMember[]
  currentUserId: string
  familyId: string | null
  onSuggestionHandled: (id: string, accepted: boolean, actId: string, field: 'takes_user_id' | 'picks_user_id') => void
}) {
  const [loading, setLoading] = useState<string | null>(null)

  const pendingForMe = suggestions.filter(s => s.proposed_to === currentUserId && s.status === 'pending')
  if (pendingForMe.length === 0) return null

  function memberName(userId: string): string {
    if (userId === currentUserId) return 'Você'
    const m = familyMembers.find(fm => fm.user_id === userId)
    return m?.display_name ?? 'Parceiro(a)'
  }

  function actTitle(actId: string) {
    return activities.find(a => a.id === actId)?.title ?? 'Atividade'
  }

  function actDate(actId: string) {
    return activities.find(a => a.id === actId)?.date ?? null
  }

  function fmtDate(dateStr: string) {
    return format(new Date(dateStr + 'T00:00:00'), "EEE, dd/MM", { locale: ptBR })
  }

  async function handleAccept(sug: LogisticsSuggestion) {
    if (loading) return
    setLoading(sug.id)
    try {
      const act = activities.find(a => a.id === sug.activity_id)
      await fetch('/api/logistics-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'accept',
          suggestionId: sug.id,
          activityId: sug.activity_id,
          field: sug.field,
          proposedBy: sug.proposed_by,
          familyId,
          activityTitle: act?.title ?? 'Atividade',
        }),
      })
      onSuggestionHandled(sug.id, true, sug.activity_id, sug.field)
      toast('Logística confirmada ✓')
    } finally {
      setLoading(null)
    }
  }

  async function handleReject(sug: LogisticsSuggestion) {
    if (loading) return
    setLoading(sug.id)
    try {
      const act = activities.find(a => a.id === sug.activity_id)
      await fetch('/api/logistics-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          suggestionId: sug.id,
          proposedBy: sug.proposed_by,
          familyId,
          activityTitle: act?.title ?? 'Atividade',
          activityDate: act?.date ?? null,
        }),
      })
      // Also update DB status from client (server action already does it via admin, but belt-and-suspenders)
      const supabase = createClient()
      await supabase.from('logistics_suggestions').update({ status: 'rejected' }).eq('id', sug.id)
      onSuggestionHandled(sug.id, false, sug.activity_id, sug.field)
      toast('Sugestão recusada')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="rounded-2xl overflow-hidden animate-fade-up"
      style={{ background: 'linear-gradient(160deg,#FFFBF2,#FFF7E6)',
        border: '1.5px solid rgba(245,158,11,0.35)',
        boxShadow: '0 4px 16px rgba(245,158,11,0.10)' }}>

      <div className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: '1px solid rgba(245,158,11,0.20)', background: 'rgba(245,158,11,0.06)' }}>
        <Bell size={14} color="#D97706" />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#92400E' }}>
          Pendências de logística ({pendingForMe.length})
        </span>
      </div>

      {pendingForMe.map((sug, i) => {
        const title = actTitle(sug.activity_id)
        const date = actDate(sug.activity_id)
        const icon = sug.field === 'takes_user_id' ? <Car size={12} /> : <Home size={12} />
        const slot = sug.field === 'takes_user_id' ? 'leva' : 'busca'

        return (
          <div key={sug.id} className="flex items-center gap-3 px-4 py-3"
            style={{ borderBottom: i < pendingForMe.length - 1 ? '1px solid rgba(245,158,11,0.12)' : 'none' }}>
            <div className="flex-1 min-w-0">
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1A2B1C', marginBottom: 2 }}>
                {memberName(sug.proposed_by)} sugeriu que você {slot}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(26,43,28,0.55)' }} className="flex items-center gap-1">
                {icon} {title}
                {date && <> · {fmtDate(date)}</>}
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button onClick={() => handleAccept(sug)} disabled={loading === sug.id}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all hover:brightness-105 active:scale-95"
                style={{ background: 'rgba(61,102,65,0.12)', color: '#2D6A35', border: '1px solid rgba(61,102,65,0.25)', cursor: 'pointer' }}>
                <Check size={12} /> Aceitar
              </button>
              <button onClick={() => handleReject(sug)} disabled={loading === sug.id}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all hover:brightness-105 active:scale-95"
                style={{ background: 'rgba(239,68,68,0.08)', color: '#DC2626', border: '1px solid rgba(239,68,68,0.20)', cursor: 'pointer' }}>
                <X size={12} /> Recusar
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LogisticaClient({
  activities: initial,
  children,
  familyMembers,
  currentUserId,
  familyId,
  pendingSuggestions: initialSuggestions,
}: Props) {
  const supabase = createClient()
  const { canLogistics, role } = useAccess()
  const isOwner = role === 'owner'

  const [activities, setActivities] = useState<Activity[]>(initial)
  const [suggestions, setSuggestions] = useState<LogisticsSuggestion[]>(initialSuggestions)

  useEffect(() => { setActivities(initial) }, [initial])
  useEffect(() => { setSuggestions(initialSuggestions) }, [initialSuggestions])

  // Realtime: escutar mudanças nas sugestões
  useEffect(() => {
    if (!familyId) return
    const channel = supabase
      .channel('logistics_suggestions_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'logistics_suggestions',
        filter: `family_id=eq.${familyId}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setSuggestions(prev => [...prev.filter(s => s.id !== (payload.new as LogisticsSuggestion).id), payload.new as LogisticsSuggestion])
        } else if (payload.eventType === 'UPDATE') {
          setSuggestions(prev => prev.map(s => s.id === (payload.new as LogisticsSuggestion).id ? payload.new as LogisticsSuggestion : s))
        } else if (payload.eventType === 'DELETE') {
          setSuggestions(prev => prev.filter(s => s.id !== (payload.old as { id: string }).id))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [familyId])

  const [view, setView] = useState<'atividade' | 'pessoa'>('atividade')
  const [filterChild, setFilterChild] = useState('')
  const [filterPeriod, setFilterPeriod] = useState<'semana' | 'mes' | 'tudo'>('tudo')
  const [filterMissing, setFilterMissing] = useState(false)

  const hasPartner = familyMembers.length > 1

  const onUpdate = useCallback((actId: string, field: 'takes_user_id' | 'picks_user_id', newVal: string | null, removeSuggestionId?: string) => {
    setActivities(prev => prev.map(a => a.id === actId ? { ...a, [field]: newVal } : a))
    if (removeSuggestionId) {
      setSuggestions(prev => prev.filter(s => s.id !== removeSuggestionId))
    }
  }, [])

  const onSuggestionHandled = useCallback((id: string, accepted: boolean, actId: string, field: 'takes_user_id' | 'picks_user_id') => {
    setSuggestions(prev => prev.filter(s => s.id !== id))
    if (accepted) {
      setActivities(prev => prev.map(a => a.id === actId ? { ...a, [field]: currentUserId } : a))
    }
  }, [currentUserId])

  function memberName(userId: string | null | undefined): string {
    if (!userId) return ''
    if (userId === currentUserId) return 'Você'
    const m = familyMembers.find(fm => fm.user_id === userId)
    return m?.display_name ?? 'Parceiro(a)'
  }

  const today = new Intl.DateTimeFormat('fr-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
  const endOfWeek = (() => { const d = new Date(); d.setDate(d.getDate() + 7); return new Intl.DateTimeFormat('fr-CA', { timeZone: 'America/Sao_Paulo' }).format(d) })()
  const endOfMonth = (() => { const d = new Date(); d.setDate(d.getDate() + 31); return new Intl.DateTimeFormat('fr-CA', { timeZone: 'America/Sao_Paulo' }).format(d) })()

  const filtered = activities.filter(a => {
    if (filterChild && a.child_id !== filterChild) return false
    if (filterPeriod === 'semana' && a.date > endOfWeek) return false
    if (filterPeriod === 'mes' && a.date > endOfMonth) return false
    if (filterMissing) {
      const hasTakes = a.takes_user_id || suggestions.some(s => s.activity_id === a.id && s.field === 'takes_user_id' && s.status === 'pending')
      const hasPicks = a.picks_user_id || suggestions.some(s => s.activity_id === a.id && s.field === 'picks_user_id' && s.status === 'pending')
      if (hasTakes && hasPicks) return false
    }
    return true
  })

  const missing = activities.filter(a => !a.takes_user_id || !a.picks_user_id)
  const pendingForMe = suggestions.filter(s => s.proposed_to === currentUserId && s.status === 'pending')

  function fmtDate(dateStr: string) {
    return format(new Date(dateStr + 'T00:00:00'), "EEE, dd/MM", { locale: ptBR })
  }

  const cardStyle: React.CSSProperties = {
    background: 'linear-gradient(160deg,#FFFFFF 0%,#F8F3EA 100%)',
    border: '1px solid rgba(61,102,65,0.18)',
    boxShadow: '0 4px 16px rgba(44,74,46,0.08),0 1px 4px rgba(44,74,46,0.05)',
    borderRadius: 16,
  }

  const chipProps = {
    suggestions,
    familyMembers,
    currentUserId,
    familyId,
    isOwner,
    canLogistics,
    onUpdate,
  }

  const myActivities = activities.filter(a => a.takes_user_id === currentUserId || a.picks_user_id === currentUserId)
  const partner = familyMembers.find(m => m.user_id !== currentUserId)
  const partnerActivities = activities.filter(a => partner && (a.takes_user_id === partner.user_id || a.picks_user_id === partner.user_id))

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-5 space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 animate-fade-up">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: '#2D6A35' }}>🚗 Módulo E</p>
          <h1 style={{ fontFamily: 'var(--font-lora)', fontSize: 24, fontWeight: 700, color: '#1A2B1C' }}>Logística</h1>
          <p style={{ fontSize: 13, color: 'rgba(26,43,28,0.45)', marginTop: 2 }}>
            Quem leva e busca — {filtered.length} atividade{filtered.length !== 1 ? 's' : ''}
            {pendingForMe.length > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
                style={{ background: 'rgba(245,158,11,0.15)', color: '#92400E' }}>
                <Clock size={10} /> {pendingForMe.length} pendente{pendingForMe.length !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>

        <div className="flex rounded-xl overflow-hidden flex-shrink-0" style={{ border: '1.5px solid rgba(61,102,65,0.20)', background: 'rgba(61,102,65,0.06)' }}>
          {(['atividade', 'pessoa'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className="flex items-center gap-1.5 px-3 py-2 transition-all"
              style={{ fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer',
                background: view === v ? '#2D6A35' : 'transparent',
                color: view === v ? '#fff' : 'rgba(26,43,28,0.50)' }}>
              {v === 'atividade' ? <LayoutList size={13} /> : <Users size={13} />}
              {v === 'atividade' ? 'Por atividade' : 'Por pessoa'}
            </button>
          ))}
        </div>
      </div>

      {/* Painel de pendências */}
      {pendingForMe.length > 0 && (
        <PendingPanel
          suggestions={suggestions}
          activities={activities}
          familyMembers={familyMembers}
          currentUserId={currentUserId}
          familyId={familyId}
          onSuggestionHandled={onSuggestionHandled}
        />
      )}

      {/* No partner warning */}
      {!hasPartner && (
        <div className="p-4 rounded-2xl animate-fade-up" style={{ background: 'rgba(245,158,11,0.08)', border: '1.5px solid rgba(245,158,11,0.30)' }}>
          <div className="flex items-center gap-3">
            <div className="text-xl">👫</div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#92400E' }}>Nenhum parceiro conectado</p>
              <p style={{ fontSize: 12, color: 'rgba(146,64,14,0.70)', marginTop: 2 }}>
                Os chips de logística aparecerão quando houver um parceiro com acesso.{' '}
                <Link href="/configuracoes" style={{ color: '#2D6A35', fontWeight: 700, textDecoration: 'underline' }}>
                  Convidar parceiro →
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 animate-fade-up">
        {children.length > 1 && (
          <select value={filterChild} onChange={e => setFilterChild(e.target.value)}
            className="text-xs font-semibold border rounded-xl px-3 py-2 focus:outline-none"
            style={{ borderColor: 'rgba(61,102,65,0.22)', color: '#1A2B1C', background: '#FDF8F2' }}>
            <option value="">Todos os filhos</option>
            {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}

        {(['semana', 'mes', 'tudo'] as const).map(p => (
          <button key={p} onClick={() => setFilterPeriod(p)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            style={{ border: '1.5px solid',
              borderColor: filterPeriod === p ? '#2D6A35' : 'rgba(61,102,65,0.20)',
              background: filterPeriod === p ? '#2D6A35' : 'transparent',
              color: filterPeriod === p ? '#fff' : 'rgba(26,43,28,0.55)',
              cursor: 'pointer' }}>
            {p === 'semana' ? 'Esta semana' : p === 'mes' ? 'Este mês' : 'Tudo'}
          </button>
        ))}

        {missing.length > 0 && (
          <button onClick={() => setFilterMissing(f => !f)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            style={{ border: '1.5px solid',
              borderColor: filterMissing ? '#D97706' : 'rgba(217,119,6,0.30)',
              background: filterMissing ? 'rgba(245,158,11,0.15)' : 'transparent',
              color: filterMissing ? '#92400E' : 'rgba(146,64,14,0.70)',
              cursor: 'pointer' }}>
            <AlertTriangle size={12} />
            Sem responsável ({missing.length})
          </button>
        )}
      </div>

      {/* ─── VIEW: Por atividade ─── */}
      {view === 'atividade' && (
        <div className="animate-fade-up">
          {filtered.length === 0 ? (
            <EmptyState title="Nenhuma atividade encontrada" subtitle="Ajuste os filtros ou adicione atividades nos módulos de Escola, Saúde e Atividades." />
          ) : (
            <div style={cardStyle}>
              <div className="hidden md:grid px-4 py-3 text-xs font-bold uppercase tracking-wide"
                style={{ gridTemplateColumns: '100px 52px 1fr 160px 160px', gap: 8, color: 'rgba(26,43,28,0.40)', borderBottom: '1.5px solid rgba(61,102,65,0.10)' }}>
                <span>Data</span><span>Filho</span><span>Atividade</span><span>🚗 Quem leva</span><span>🏠 Quem busca</span>
              </div>

              {filtered.map((act, i) => (
                <div key={act.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(61,102,65,0.08)' : 'none' }}>

                  {/* Desktop */}
                  <div className="hidden md:grid items-center px-4 hover:bg-black/[0.015] transition-colors"
                    style={{ gridTemplateColumns: '100px 52px 1fr 160px 160px', gap: 8, minHeight: 72 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#2D6A35' }}>{fmtDate(act.date)}</div>
                      {act.time && <div style={{ fontSize: 10, color: 'rgba(26,43,28,0.40)' }}>{act.time.slice(0,5)}</div>}
                    </div>
                    <div>
                      {act.child && (
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ background: act.child.avatar_color }}>{act.child.name.charAt(0)}</div>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1A2B1C' }}>{act.title}</div>
                      <div style={{ fontSize: 11, color: 'rgba(26,43,28,0.45)' }}>
                        {catEmoji[act.category]} {catLabel[act.category]}{act.location && ` · ${act.location}`}
                      </div>
                    </div>
                    <LogChip actId={act.id} field="takes_user_id" value={act.takes_user_id} activity={act} {...chipProps} />
                    <LogChip actId={act.id} field="picks_user_id" value={act.picks_user_id} activity={act} {...chipProps} />
                  </div>

                  {/* Mobile */}
                  <div className="md:hidden px-4 py-3">
                    <div className="flex items-start gap-3">
                      {act.child && (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5"
                          style={{ background: act.child.avatar_color }}>{act.child.name.charAt(0)}</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1A2B1C', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{act.title}</div>
                        <div style={{ fontSize: 11, color: 'rgba(26,43,28,0.50)', marginTop: 2 }}>
                          {fmtDate(act.date)}{act.time ? ` · ${act.time.slice(0,5)}` : ''} · {catEmoji[act.category]}
                        </div>
                        <div className="flex gap-2 mt-2.5 flex-wrap">
                          <LogChip actId={act.id} field="takes_user_id" value={act.takes_user_id} activity={act} {...chipProps} />
                          <LogChip actId={act.id} field="picks_user_id" value={act.picks_user_id} activity={act} {...chipProps} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── VIEW: Por pessoa ─── */}
      {view === 'pessoa' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-up">
          <PersonColumn name="Você" userId={currentUserId} color="#2D6A35"
            avatarBg="linear-gradient(140deg,#3D6641,#2C4A2E)"
            activities={myActivities} currentUserId={currentUserId} fmtDate={fmtDate} />

          {partner ? (
            <PersonColumn name={partner.display_name ?? 'Parceiro(a)'} userId={partner.user_id}
              color="#4338CA" avatarBg="linear-gradient(140deg,#6366f1,#4338CA)"
              activities={partnerActivities} currentUserId={currentUserId} fmtDate={fmtDate} />
          ) : (
            <div style={{ ...cardStyle, padding: '32px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>👫</div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1A2B1C', marginBottom: 6 }}>Nenhum parceiro conectado</p>
              <Link href="/configuracoes" className="inline-flex items-center gap-1.5 text-sm font-bold"
                style={{ color: '#2D6A35', textDecoration: 'underline' }}>
                Convidar parceiro <ChevronRight size={14} />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PersonColumn({ name, userId, color, avatarBg, activities, currentUserId, fmtDate }: {
  name: string; userId: string; color: string; avatarBg: string
  activities: Activity[]; currentUserId: string; fmtDate: (d: string) => string
}) {
  const catEmoji: Record<string, string> = { escola: '📘', saude: '🩺', extracurricular: '⭐' }
  const cardStyle: React.CSSProperties = {
    background: 'linear-gradient(160deg,#FFFFFF 0%,#F8F3EA 100%)',
    border: '1px solid rgba(61,102,65,0.18)', boxShadow: '0 4px 16px rgba(44,74,46,0.08)',
    borderRadius: 16, overflow: 'hidden',
  }

  return (
    <div style={cardStyle}>
      <div className="flex items-center gap-3 p-4"
        style={{ borderBottom: '1px solid rgba(61,102,65,0.10)', background: 'rgba(61,102,65,0.04)' }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-none"
          style={{ background: avatarBg }}>{name.charAt(0).toUpperCase()}</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1A2B1C' }}>{name}</div>
          <div style={{ fontSize: 11, color: 'rgba(26,43,28,0.45)' }}>{activities.length} atividade{activities.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {activities.length === 0 ? (
        <div style={{ padding: '28px 20px', textAlign: 'center', color: 'rgba(26,43,28,0.35)', fontSize: 12, fontStyle: 'italic' }}>
          Nenhuma atividade assumida ainda
        </div>
      ) : (
        activities.map((act, i) => {
          const takesMe = act.takes_user_id === userId
          const picksMe = act.picks_user_id === userId
          return (
            <div key={act.id} className="flex items-start gap-3 p-3"
              style={{ borderBottom: i < activities.length - 1 ? '1px solid rgba(61,102,65,0.07)' : 'none' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color, minWidth: 36, flexShrink: 0, marginTop: 2, lineHeight: 1.3 }}>
                {fmtDate(act.date).split(',')[0]}<br />
                <span style={{ fontWeight: 400, color: 'rgba(26,43,28,0.40)', fontSize: 10 }}>{fmtDate(act.date).split(',')[1]?.trim()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1A2B1C', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{act.title}</div>
                <div style={{ fontSize: 10, color: 'rgba(26,43,28,0.45)', marginTop: 1 }}>
                  {act.child && <span style={{ fontSize: 10, fontWeight: 700, color: act.child.avatar_color }}>{act.child.name} · </span>}
                  {catEmoji[act.category] ?? ''}{act.time ? ` · ${act.time.slice(0,5)}` : ''}
                </div>
              </div>
              <div className="flex flex-col gap-1 flex-shrink-0">
                {takesMe && <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(61,102,65,0.10)', color: '#2D6A35' }}><Car size={9} /> Leva</span>}
                {picksMe && <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(245,158,11,0.12)', color: '#92400E' }}><Home size={9} /> Busca</span>}
              </div>
            </div>
          )
        })
      )}

      {activities.length > 0 && (
        <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(61,102,65,0.08)', background: 'rgba(61,102,65,0.03)' }}>
          <p style={{ fontSize: 11, color: 'rgba(26,43,28,0.55)' }}>
            🚗 Leva: <strong>{activities.filter(a => a.takes_user_id === userId).length}</strong> · 🏠 Busca: <strong>{activities.filter(a => a.picks_user_id === userId).length}</strong>
          </p>
        </div>
      )}
    </div>
  )
}
