'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Car, Home, Users, LayoutList, AlertTriangle, ChevronRight, Clock, Bell, Check, X } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { toast } from '@/components/ui/Toast'
import EmptyState from '@/components/ui/EmptyState'
import { useAccess } from '@/components/access/AccessContext'
import LogChip from '@/components/activities/LogChip'
import type { LogisticsSuggestion, FamilyMemberInfo } from '@/components/activities/LogChip'

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

export { type LogisticsSuggestion }

interface Props {
  activities: Activity[]
  children: Child[]
  familyMembers: FamilyMemberInfo[]
  currentUserId: string
  familyId: string | null
  pendingSuggestions: LogisticsSuggestion[]
}

const catEmoji: Record<string, string> = { escola: '📘', saude: '🩺', extracurricular: '⭐' }
const catLabel: Record<string, string> = { escola: 'Escola', saude: 'Saúde', extracurricular: 'Extracurricular' }

// ─── Painel de pendências ─────────────────────────────────────────────────────
function PendingPanel({
  suggestions, activities, familyMembers, currentUserId, familyId, onSuggestionHandled,
}: {
  suggestions: LogisticsSuggestion[]
  activities: Activity[]
  familyMembers: FamilyMemberInfo[]
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
        body: JSON.stringify({ action: 'accept', suggestionId: sug.id, activityId: sug.activity_id, field: sug.field, proposedBy: sug.proposed_by, familyId, activityTitle: act?.title ?? 'Atividade' }),
      })
      onSuggestionHandled(sug.id, true, sug.activity_id, sug.field)
      toast('Logística confirmada ✓')
    } finally { setLoading(null) }
  }

  async function handleReject(sug: LogisticsSuggestion) {
    if (loading) return
    setLoading(sug.id)
    try {
      const act = activities.find(a => a.id === sug.activity_id)
      await fetch('/api/logistics-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', suggestionId: sug.id, proposedBy: sug.proposed_by, familyId, activityTitle: act?.title ?? 'Atividade', activityDate: act?.date ?? null }),
      })
      const supabase = createClient()
      await supabase.from('logistics_suggestions').update({ status: 'rejected' }).eq('id', sug.id)
      onSuggestionHandled(sug.id, false, sug.activity_id, sug.field)
      toast('Sugestão recusada')
    } finally { setLoading(null) }
  }

  return (
    <div className="rounded-2xl overflow-hidden animate-fade-up"
      style={{ background: 'linear-gradient(160deg,#FFFBF2,#FFF7E6)', border: '1.5px solid rgba(245,158,11,0.35)', boxShadow: '0 4px 16px rgba(245,158,11,0.10)' }}>
      <div className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: '1px solid rgba(245,158,11,0.20)', background: 'rgba(245,158,11,0.06)' }}>
        <Bell size={14} color="#D97706" />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#92400E' }}>
          Pendências de logística ({pendingForMe.length})
        </span>
      </div>
      {pendingForMe.map((sug, i) => {
        const act = activities.find(a => a.id === sug.activity_id)
        const slot = sug.field === 'takes_user_id' ? 'leva' : 'busca'
        const icon = sug.field === 'takes_user_id' ? <Car size={12} /> : <Home size={12} />
        return (
          <div key={sug.id} className="flex items-center gap-3 px-4 py-3"
            style={{ borderBottom: i < pendingForMe.length - 1 ? '1px solid rgba(245,158,11,0.12)' : 'none' }}>
            <div className="flex-1 min-w-0">
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1A2B1C', marginBottom: 2 }}>
                {memberName(sug.proposed_by)} sugeriu que você {slot}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(26,43,28,0.55)' }} className="flex items-center gap-1">
                {icon} {act?.title ?? ''}
                {act?.date && <> · {fmtDate(act.date)}</>}
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

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function LogisticaClient({ activities: initial, children, familyMembers, currentUserId, familyId, pendingSuggestions: initialSuggestions }: Props) {
  const supabase = createClient()
  const { role } = useAccess()
  const isOwner = role === 'owner'

  const [activities, setActivities] = useState<Activity[]>(initial)
  const [suggestions, setSuggestions] = useState<LogisticsSuggestion[]>(initialSuggestions)

  useEffect(() => { setActivities(initial) }, [initial])
  useEffect(() => { setSuggestions(initialSuggestions) }, [initialSuggestions])

  // Realtime
  useEffect(() => {
    if (!familyId) return
    const channel = supabase.channel('logistics_suggestions_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'logistics_suggestions', filter: `family_id=eq.${familyId}` }, (payload) => {
        if (payload.eventType === 'INSERT') setSuggestions(prev => [...prev.filter(s => s.id !== (payload.new as LogisticsSuggestion).id), payload.new as LogisticsSuggestion])
        else if (payload.eventType === 'UPDATE') setSuggestions(prev => prev.map(s => s.id === (payload.new as LogisticsSuggestion).id ? payload.new as LogisticsSuggestion : s))
        else if (payload.eventType === 'DELETE') setSuggestions(prev => prev.filter(s => s.id !== (payload.old as { id: string }).id))
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
    if (removeSuggestionId) setSuggestions(prev => prev.filter(s => s.id !== removeSuggestionId))
  }, [])

  const onSuggestionHandled = useCallback((id: string, accepted: boolean, actId: string, field: 'takes_user_id' | 'picks_user_id') => {
    setSuggestions(prev => prev.filter(s => s.id !== id))
    if (accepted) setActivities(prev => prev.map(a => a.id === actId ? { ...a, [field]: currentUserId } : a))
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

  const chipProps = { suggestions, familyMembers, currentUserId, familyId, isOwner, onUpdate }

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
                background: view === v ? '#14463A' : 'transparent',
                color: view === v ? '#fff' : 'rgba(26,43,28,0.50)' }}>
              {v === 'atividade' ? <LayoutList size={13} /> : <Users size={13} />}
              {v === 'atividade' ? 'Por atividade' : 'Por pessoa'}
            </button>
          ))}
        </div>
      </div>

      {/* Painel pendências */}
      {pendingForMe.length > 0 && (
        <PendingPanel suggestions={suggestions} activities={activities} familyMembers={familyMembers}
          currentUserId={currentUserId} familyId={familyId} onSuggestionHandled={onSuggestionHandled} />
      )}

      {/* Sem parceiro */}
      {!hasPartner && (
        <div className="p-4 rounded-2xl animate-fade-up" style={{ background: 'rgba(245,158,11,0.08)', border: '1.5px solid rgba(245,158,11,0.30)' }}>
          <div className="flex items-center gap-3">
            <div className="text-xl">👫</div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#92400E' }}>Nenhum parceiro conectado</p>
              <p style={{ fontSize: 12, color: 'rgba(146,64,14,0.70)', marginTop: 2 }}>
                <Link href="/configuracoes" style={{ color: '#2D6A35', fontWeight: 700, textDecoration: 'underline' }}>Convidar parceiro →</Link>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
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
          <button key={p} onClick={() => setFilterPeriod(p)} className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            style={{ border: '1.5px solid', borderColor: filterPeriod === p ? '#14463A' : 'rgba(61,102,65,0.20)',
              background: filterPeriod === p ? '#14463A' : 'transparent',
              color: filterPeriod === p ? '#fff' : 'rgba(26,43,28,0.55)', cursor: 'pointer' }}>
            {p === 'semana' ? 'Esta semana' : p === 'mes' ? 'Este mês' : 'Tudo'}
          </button>
        ))}
        {missing.length > 0 && (
          <button onClick={() => setFilterMissing(f => !f)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            style={{ border: '1.5px solid', borderColor: filterMissing ? '#D97706' : 'rgba(217,119,6,0.30)',
              background: filterMissing ? 'rgba(245,158,11,0.15)' : 'transparent',
              color: filterMissing ? '#92400E' : 'rgba(146,64,14,0.70)', cursor: 'pointer' }}>
            <AlertTriangle size={12} /> Sem responsável ({missing.length})
          </button>
        )}
      </div>

      {/* ─── VIEW: Por atividade ─── */}
      {view === 'atividade' && (
        <div className="animate-fade-up">
          {filtered.length === 0 ? (
            <EmptyState title="Nenhuma atividade encontrada" subtitle="Ajuste os filtros ou adicione atividades." />
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
                      {act.child && <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: act.child.avatar_color }}>{act.child.name.charAt(0)}</div>}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1A2B1C' }}>{act.title}</div>
                      <div style={{ fontSize: 11, color: 'rgba(26,43,28,0.45)' }}>{catEmoji[act.category]} {catLabel[act.category]}{act.location && ` · ${act.location}`}</div>
                    </div>
                    <LogChip actId={act.id} field="takes_user_id" value={act.takes_user_id} activity={act} {...chipProps} />
                    <LogChip actId={act.id} field="picks_user_id" value={act.picks_user_id} activity={act} {...chipProps} />
                  </div>
                  {/* Mobile */}
                  <div className="md:hidden px-4 py-3">
                    <div className="flex items-start gap-3">
                      {act.child && <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5" style={{ background: act.child.avatar_color }}>{act.child.name.charAt(0)}</div>}
                      <div className="flex-1 min-w-0">
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1A2B1C', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{act.title}</div>
                        <div style={{ fontSize: 11, color: 'rgba(26,43,28,0.50)', marginTop: 2 }}>{fmtDate(act.date)}{act.time ? ` · ${act.time.slice(0,5)}` : ''} · {catEmoji[act.category]}</div>
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

      {/* ─── VIEW: Por pessoa — TODOS os membros ─── */}
      {view === 'pessoa' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-up">
          {familyMembers.map(member => {
            const isMe = member.user_id === currentUserId
            const color = isMe ? '#2D6A35' : '#4338CA'
            const avatarBg = isMe ? 'linear-gradient(140deg,#3D6641,#2C4A2E)' : 'linear-gradient(140deg,#6366f1,#4338CA)'
            const name = isMe ? 'Você' : (member.display_name ?? 'Parceiro(a)')
            const memberActs = activities.filter(a => a.takes_user_id === member.user_id || a.picks_user_id === member.user_id)
            return (
              <PersonColumn key={member.user_id}
                name={name} userId={member.user_id} color={color} avatarBg={avatarBg}
                activities={memberActs} fmtDate={fmtDate} />
            )
          })}
          {familyMembers.length === 0 && (
            <div style={{ ...cardStyle, padding: '32px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>👫</div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1A2B1C', marginBottom: 6 }}>Nenhum parceiro conectado</p>
              <Link href="/configuracoes" className="inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: '#2D6A35', textDecoration: 'underline' }}>
                Convidar parceiro <ChevronRight size={14} />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PersonColumn({ name, userId, color, avatarBg, activities, fmtDate }: {
  name: string; userId: string; color: string; avatarBg: string
  activities: Activity[]; fmtDate: (d: string) => string
}) {
  const catEmoji: Record<string, string> = { escola: '📘', saude: '🩺', extracurricular: '⭐' }
  const cardStyle: React.CSSProperties = {
    background: 'linear-gradient(160deg,#FFFFFF 0%,#F8F3EA 100%)',
    border: '1px solid rgba(61,102,65,0.18)', boxShadow: '0 4px 16px rgba(44,74,46,0.08)',
    borderRadius: 16, overflow: 'hidden',
  }

  return (
    <div style={cardStyle}>
      <div className="flex items-center gap-3 p-4" style={{ borderBottom: '1px solid rgba(61,102,65,0.10)', background: 'rgba(61,102,65,0.04)' }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-none" style={{ background: avatarBg }}>
          {name.charAt(0).toUpperCase()}
        </div>
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
