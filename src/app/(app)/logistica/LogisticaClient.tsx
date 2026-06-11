'use client'
import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Car, Home, Users, LayoutList, AlertTriangle, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

interface Child {
  id: string
  name: string
  avatar_color: string
}

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

interface Props {
  activities: Activity[]
  children: Child[]
  familyMembers: FamilyMember[]
  currentUserId: string
}

const catEmoji: Record<string, string> = { escola: '📘', saude: '🩺', extracurricular: '⭐' }
const catLabel: Record<string, string> = { escola: 'Escola', saude: 'Saúde', extracurricular: 'Extracurricular' }

export default function LogisticaClient({ activities: initial, children, familyMembers, currentUserId }: Props) {
  const supabase = createClient()
  const [activities, setActivities] = useState<Activity[]>(initial)
  const [view, setView] = useState<'atividade' | 'pessoa'>('atividade')
  const [filterChild, setFilterChild] = useState('')
  const [filterPeriod, setFilterPeriod] = useState<'semana' | 'mes' | 'tudo'>('tudo')
  const [filterMissing, setFilterMissing] = useState(false)

  const hasPartner = familyMembers.length > 1

  function memberName(userId: string | null | undefined, short = false): string {
    if (!userId) return ''
    if (userId === currentUserId) return short ? 'Você' : 'Você'
    const m = familyMembers.find(fm => fm.user_id === userId)
    return m?.display_name ?? 'Parceiro(a)'
  }

  function memberInitial(userId: string | null | undefined): string {
    const n = memberName(userId)
    return n.charAt(0).toUpperCase()
  }

  async function assignLogistics(actId: string, field: 'takes_user_id' | 'picks_user_id', currentVal: string | null) {
    const existing = currentVal
    if (existing && existing !== currentUserId) {
      const partner = memberName(existing)
      const ok = confirm(`${partner} já assumiu essa função. Deseja reatribuir para você?`)
      if (!ok) return
    }
    const newVal = existing === currentUserId ? null : currentUserId
    const { error } = await supabase.from('activities').update({ [field]: newVal }).eq('id', actId)
    if (error) {
      alert('Não foi possível salvar. Verifique sua conexão e tente novamente.')
      return
    }
    setActivities(prev => prev.map(a => a.id === actId ? { ...a, [field]: newVal } : a))
  }

  // Period filter
  const today = new Intl.DateTimeFormat('fr-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
  const endOfWeek = (() => {
    const d = new Date(); d.setDate(d.getDate() + 7)
    return new Intl.DateTimeFormat('fr-CA', { timeZone: 'America/Sao_Paulo' }).format(d)
  })()
  const endOfMonth = (() => {
    const d = new Date(); d.setDate(d.getDate() + 31)
    return new Intl.DateTimeFormat('fr-CA', { timeZone: 'America/Sao_Paulo' }).format(d)
  })()

  const filtered = activities.filter(a => {
    if (filterChild && a.child_id !== filterChild) return false
    if (filterPeriod === 'semana' && a.date > endOfWeek) return false
    if (filterPeriod === 'mes' && a.date > endOfMonth) return false
    if (filterMissing && (a.takes_user_id || a.picks_user_id)) return false
    return true
  })

  const missing = activities.filter(a => !a.takes_user_id || !a.picks_user_id)

  function fmtDate(dateStr: string) {
    return format(new Date(dateStr + 'T00:00:00'), "EEE, dd/MM", { locale: ptBR })
  }

  function LogChip({ actId, field, value }: { actId: string; field: 'takes_user_id' | 'picks_user_id'; value: string | null }) {
    const isMe = value === currentUserId
    const isPartner = value && value !== currentUserId

    let style: React.CSSProperties
    if (!value) {
      style = { background: 'rgba(61,102,65,0.05)', border: '1.5px dashed rgba(61,102,65,0.25)', color: 'rgba(26,43,28,0.40)' }
    } else if (isMe) {
      style = { background: 'rgba(61,102,65,0.10)', border: '1.5px solid rgba(61,102,65,0.30)', color: '#2D6A35' }
    } else {
      style = { background: 'rgba(99,102,241,0.08)', border: '1.5px solid rgba(99,102,241,0.25)', color: '#4338CA' }
    }

    return (
      <button
        onClick={() => assignLogistics(actId, field, value)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all hover:brightness-95 active:scale-95"
        style={{ fontSize: 11, fontWeight: 600, cursor: 'pointer', minWidth: 90, ...style }}>
        {field === 'takes_user_id' ? <Car size={11} /> : <Home size={11} />}
        {value ? memberName(value) : 'Definir'}
      </button>
    )
  }

  // Per-person grouping
  const myActivities = activities.filter(a => a.takes_user_id === currentUserId || a.picks_user_id === currentUserId)
  const partnerActivities = activities.filter(a => {
    const partner = familyMembers.find(m => m.user_id !== currentUserId)
    if (!partner) return false
    return a.takes_user_id === partner.user_id || a.picks_user_id === partner.user_id
  })
  const partner = familyMembers.find(m => m.user_id !== currentUserId)

  const cardStyle: React.CSSProperties = {
    background: 'linear-gradient(160deg,#FFFFFF 0%,#F8F3EA 100%)',
    border: '1px solid rgba(61,102,65,0.18)',
    boxShadow: '0 4px 16px rgba(44,74,46,0.08),0 1px 4px rgba(44,74,46,0.05)',
    borderRadius: 16,
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-5 space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 animate-fade-up">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: '#2D6A35' }}>
            🚗 Módulo E
          </p>
          <h1 style={{ fontFamily: 'var(--font-lora)', fontSize: 24, fontWeight: 700, color: '#1A2B1C' }}>
            Logística
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(26,43,28,0.45)', marginTop: 2 }}>
            Quem leva e busca — {filtered.length} atividade{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* View toggle */}
        <div className="flex rounded-xl overflow-hidden flex-shrink-0" style={{ border: '1.5px solid rgba(61,102,65,0.20)', background: 'rgba(61,102,65,0.06)' }}>
          {(['atividade', 'pessoa'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className="flex items-center gap-1.5 px-3 py-2 transition-all"
              style={{
                fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer',
                background: view === v ? '#2D6A35' : 'transparent',
                color: view === v ? '#fff' : 'rgba(26,43,28,0.50)',
              }}>
              {v === 'atividade' ? <LayoutList size={13} /> : <Users size={13} />}
              {v === 'atividade' ? 'Por atividade' : 'Por pessoa'}
            </button>
          ))}
        </div>
      </div>

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
          <select
            value={filterChild}
            onChange={e => setFilterChild(e.target.value)}
            className="text-xs font-semibold border rounded-xl px-3 py-2 focus:outline-none"
            style={{ borderColor: 'rgba(61,102,65,0.22)', color: '#1A2B1C', background: '#FDF8F2' }}>
            <option value="">Todos os filhos</option>
            {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}

        {(['semana', 'mes', 'tudo'] as const).map(p => (
          <button key={p} onClick={() => setFilterPeriod(p)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            style={{
              border: '1.5px solid',
              borderColor: filterPeriod === p ? '#2D6A35' : 'rgba(61,102,65,0.20)',
              background: filterPeriod === p ? '#2D6A35' : 'transparent',
              color: filterPeriod === p ? '#fff' : 'rgba(26,43,28,0.55)',
              cursor: 'pointer',
            }}>
            {p === 'semana' ? 'Esta semana' : p === 'mes' ? 'Este mês' : 'Tudo'}
          </button>
        ))}

        {missing.length > 0 && (
          <button onClick={() => setFilterMissing(f => !f)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            style={{
              border: '1.5px solid',
              borderColor: filterMissing ? '#D97706' : 'rgba(217,119,6,0.30)',
              background: filterMissing ? 'rgba(245,158,11,0.15)' : 'transparent',
              color: filterMissing ? '#92400E' : 'rgba(146,64,14,0.70)',
              cursor: 'pointer',
            }}>
            <AlertTriangle size={12} />
            Sem responsável ({missing.length})
          </button>
        )}
      </div>

      {/* ─── VIEW: Por atividade ─── */}
      {view === 'atividade' && (
        <div className="animate-fade-up">
          {filtered.length === 0 ? (
            <div style={{ ...cardStyle, padding: '40px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🎯</div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#1A2B1C' }}>Nenhuma atividade encontrada</p>
              <p style={{ fontSize: 13, color: 'rgba(26,43,28,0.45)', marginTop: 4 }}>Ajuste os filtros ou adicione atividades nos módulos.</p>
            </div>
          ) : (
            <div style={cardStyle}>
              {/* Table header — desktop */}
              <div className="hidden md:grid px-4 py-3 text-xs font-bold uppercase tracking-wide"
                style={{ gridTemplateColumns: '100px 52px 1fr 140px 140px', gap: 8, color: 'rgba(26,43,28,0.40)', borderBottom: '1.5px solid rgba(61,102,65,0.10)' }}>
                <span>Data</span>
                <span>Filho</span>
                <span>Atividade</span>
                <span>🚗 Quem leva</span>
                <span>🏠 Quem busca</span>
              </div>

              {filtered.map((act, i) => (
                <div key={act.id}
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(61,102,65,0.08)' : 'none' }}>

                  {/* Desktop row */}
                  <div className="hidden md:grid items-center px-4 hover:bg-black/[0.015] transition-colors"
                    style={{ gridTemplateColumns: '100px 52px 1fr 140px 140px', gap: 8, minHeight: 68 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#2D6A35' }}>
                        {fmtDate(act.date)}
                      </div>
                      {act.time && <div style={{ fontSize: 10, color: 'rgba(26,43,28,0.40)' }}>{act.time.slice(0,5)}</div>}
                    </div>
                    <div>
                      {act.child && (
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ background: act.child.avatar_color }}>
                          {act.child.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1A2B1C' }}>{act.title}</div>
                      <div style={{ fontSize: 11, color: 'rgba(26,43,28,0.45)' }}>
                        {catEmoji[act.category]} {catLabel[act.category]}
                        {act.location && ` · ${act.location}`}
                      </div>
                    </div>
                    <div>
                      <LogChip actId={act.id} field="takes_user_id" value={act.takes_user_id} />
                    </div>
                    <div>
                      <LogChip actId={act.id} field="picks_user_id" value={act.picks_user_id} />
                    </div>
                  </div>

                  {/* Mobile card row — height fixo para garantir linhas uniformes */}
                  <div className="md:hidden px-4" style={{ height: 106, display: 'flex', alignItems: 'center' }}>
                    <div className="flex items-center gap-3 w-full">
                      {act.child && (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: act.child.avatar_color }}>
                          {act.child.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1A2B1C',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {act.title}
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(26,43,28,0.50)', marginTop: 2,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {fmtDate(act.date)}{act.time ? ` · ${act.time.slice(0,5)}` : ''} · {catEmoji[act.category]} {catLabel[act.category]}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <LogChip actId={act.id} field="takes_user_id" value={act.takes_user_id} />
                          <LogChip actId={act.id} field="picks_user_id" value={act.picks_user_id} />
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
          {/* My column */}
          <PersonColumn
            name="Você"
            userId={currentUserId}
            color="#2D6A35"
            avatarBg="linear-gradient(140deg,#3D6641,#2C4A2E)"
            activities={myActivities}
            currentUserId={currentUserId}
            fmtDate={fmtDate}
          />

          {/* Partner column */}
          {partner ? (
            <PersonColumn
              name={partner.display_name ?? 'Parceiro(a)'}
              userId={partner.user_id}
              color="#4338CA"
              avatarBg="linear-gradient(140deg,#6366f1,#4338CA)"
              activities={partnerActivities}
              currentUserId={currentUserId}
              fmtDate={fmtDate}
            />
          ) : (
            <div style={{ ...cardStyle, padding: '32px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>👫</div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1A2B1C', marginBottom: 6 }}>
                Nenhum parceiro conectado
              </p>
              <Link href="/configuracoes"
                className="inline-flex items-center gap-1.5 text-sm font-bold"
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
  name: string
  userId: string
  color: string
  avatarBg: string
  activities: { id: string; title: string; date: string; time: string | null; takes_user_id: string | null; picks_user_id: string | null; child?: { name: string; avatar_color: string }; category: string }[]
  currentUserId: string
  fmtDate: (d: string) => string
}) {
  const catEmoji: Record<string, string> = { escola: '📘', saude: '🩺', extracurricular: '⭐' }

  const cardStyle: React.CSSProperties = {
    background: 'linear-gradient(160deg,#FFFFFF 0%,#F8F3EA 100%)',
    border: '1px solid rgba(61,102,65,0.18)',
    boxShadow: '0 4px 16px rgba(44,74,46,0.08)',
    borderRadius: 16,
    overflow: 'hidden',
  }

  return (
    <div style={cardStyle}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4" style={{ borderBottom: '1px solid rgba(61,102,65,0.10)', background: 'rgba(61,102,65,0.04)' }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-none"
          style={{ background: avatarBg }}>
          {name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1A2B1C' }}>{name}</div>
          <div style={{ fontSize: 11, color: 'rgba(26,43,28,0.45)' }}>
            {activities.length} atividade{activities.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Activity list */}
      {activities.length === 0 ? (
        <div style={{ padding: '28px 20px', textAlign: 'center', color: 'rgba(26,43,28,0.35)', fontSize: 12, fontStyle: 'italic' }}>
          Nenhuma atividade assumida ainda
        </div>
      ) : (
        <div>
          {activities.map((act, i) => {
            const takesMe = act.takes_user_id === userId
            const picksMe = act.picks_user_id === userId

            return (
              <div key={act.id} className="flex items-start gap-3 p-3"
                style={{ borderBottom: i < activities.length - 1 ? '1px solid rgba(61,102,65,0.07)' : 'none' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color, minWidth: 36, flexShrink: 0, marginTop: 2, lineHeight: 1.3 }}>
                  {fmtDate(act.date).split(',')[0]}<br />
                  <span style={{ fontWeight: 400, color: 'rgba(26,43,28,0.40)', fontSize: 10 }}>
                    {fmtDate(act.date).split(',')[1]?.trim()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1A2B1C', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {act.title}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(26,43,28,0.45)', marginTop: 1 }}>
                    {act.child && <span style={{ fontSize: 10, fontWeight: 700, color: act.child.avatar_color }}>{act.child.name} · </span>}
                    {catEmoji[act.category] ?? ''}
                    {act.time ? ` · ${act.time.slice(0,5)}` : ''}
                  </div>
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  {takesMe && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                      style={{ background: 'rgba(61,102,65,0.10)', color: '#2D6A35' }}>
                      <Car size={9} /> Leva
                    </span>
                  )}
                  {picksMe && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                      style={{ background: 'rgba(245,158,11,0.12)', color: '#92400E' }}>
                      <Home size={9} /> Busca
                    </span>
                  )}
                  {takesMe && picksMe && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                      style={{ background: 'rgba(99,102,241,0.10)', color: '#4338CA' }}>
                      Ambos
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Summary */}
      {activities.length > 0 && (
        <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(61,102,65,0.08)', background: 'rgba(61,102,65,0.03)' }}>
          <p style={{ fontSize: 11, color: 'rgba(26,43,28,0.55)' }}>
            🚗 Leva: <strong>{activities.filter(a => a.takes_user_id === userId).length}</strong> ·{' '}
            🏠 Busca: <strong>{activities.filter(a => a.picks_user_id === userId).length}</strong>
          </p>
        </div>
      )}
    </div>
  )
}
