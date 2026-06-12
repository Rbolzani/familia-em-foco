'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Activity, ActivityCategory, Child } from '@/lib/types'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { DeadlineBadge } from '@/components/ui/Badge'
import { Plus, Trash2, Pencil, Filter, Clock, MapPin, Car, Home } from 'lucide-react'
import { mergeActivities } from '@/lib/merge-activities'
import { useRealtime } from '@/lib/useRealtime'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from '@/components/ui/Toast'
import EmptyState from '@/components/ui/EmptyState'

interface FamilyMemberInfo {
  user_id: string
  display_name: string | null
  role: string
}

interface Props {
  category: ActivityCategory
  title: string
  emoji: string
  color: string
  subtypes?: string[]
  // Pre-fetched from server → no client-side loading waterfall
  initialActivities?: Activity[]
  initialChildren?: Child[]
  familyMembers?: FamilyMemberInfo[]
  currentUserId?: string
}

const ALERT_OPTIONS = [
  { value: 0, label: 'No dia' },
  { value: 1, label: '1 dia antes' },
  { value: 2, label: '2 dias antes' },
  { value: 3, label: '3 dias antes' },
  { value: 5, label: '5 dias antes' },
  { value: 7, label: '1 semana antes' },
  { value: 14, label: '2 semanas antes' },
  { value: 30, label: '1 mês antes' },
]

const catGradient: Record<ActivityCategory, string> = {
  escola: 'linear-gradient(135deg,#2563EB,#1D4ED8)',
  saude: 'linear-gradient(135deg,#00C48C,#00A876)',
  extracurricular: 'linear-gradient(135deg,#7C3AED,#6D28D9)',
}
const catAccent: Record<ActivityCategory, string> = {
  escola: '#2563EB',
  saude: '#00C48C',
  extracurricular: '#7C3AED',
}
const catBg: Record<ActivityCategory, string> = {
  escola: '#EEF4FF',
  saude: '#E6FBF4',
  extracurricular: '#F3EEFF',
}

const placeholders: Record<ActivityCategory, string> = {
  escola: 'Ex.: Prova de Matemática',
  saude: 'Ex.: Consulta Pediatra',
  extracurricular: 'Ex.: Futebol',
}

const emptyForm = {
  child_id: '', title: '', description: '', date: '', time: '', alert_days: 3, location: '',
}

export default function ActivitiesPage({ category, title, emoji, color, initialActivities, initialChildren, familyMembers = [], currentUserId }: Props) {
  const supabase = createClient()
  // If server pre-fetched data, use it immediately (no loading flash)
  const [activities, setActivities] = useState<Activity[]>(initialActivities ?? [])
  const [children, setChildren] = useState<Child[]>(initialChildren ?? [])
  const [loading, setLoading] = useState(!initialActivities)
  const [filterChild, setFilterChild] = useState('')
  const [modal, setModal] = useState<{ mode: 'new' | 'edit'; activity?: Activity } | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })

  const accent = catAccent[category]
  const gradient = catGradient[category]
  const bg = catBg[category]

  const load = useCallback(async () => {
    const [{ data: acts }, { data: kids }] = await Promise.all([
      supabase.from('activities')
        .select('*, child:children(name, avatar_color)')
        .eq('category', category)
        .order('date').order('time', { nullsFirst: false }),
      supabase.from('children').select('*').order('sort_order'),
    ])
    setActivities(acts ?? [])
    setChildren(kids ?? [])
    setLoading(false)
  }, [category])

  useEffect(() => { load() }, [load])
  // Realtime: recarrega a lista quando o parceiro cria/edita atividades
  // ou muda marcadores de leva/busca (escopo de família via RLS).
  useRealtime(['activities'], load)

  function openNew() {
    setForm({ ...emptyForm, date: new Date().toISOString().split('T')[0], child_id: children[0]?.id ?? '' })
    setModal({ mode: 'new' })
  }

  function openEdit(a: Activity) {
    setForm({ child_id: a.child_id, title: a.title, description: a.description ?? '', date: a.date ?? '', time: a.time ?? '', alert_days: a.alert_days, location: a.location ?? '' })
    setModal({ mode: 'edit', activity: a })
  }

  async function handleSave() {
    if (!form.title.trim() || !form.child_id) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const payload = {
      user_id: user!.id, child_id: form.child_id, category,
      title: form.title.trim(), description: form.description.trim() || null,
      date: form.date || null, time: form.time || null, alert_days: form.alert_days,
      location: form.location.trim() || null,
    }
    const { error } = modal?.mode === 'new'
      ? await supabase.from('activities').insert(payload)
      : await supabase.from('activities').update(payload).eq('id', modal!.activity!.id)
    setSaving(false)
    if (error) { toast('Não foi possível salvar. Tente novamente.', 'error'); return }
    setModal(null); load()
    toast(modal?.mode === 'new' ? 'Atividade adicionada ✓' : 'Alterações salvas ✓')
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta atividade?')) return
    const { error } = await supabase.from('activities').delete().eq('id', id)
    if (error) { toast('Não foi possível excluir. Tente novamente.', 'error'); return }
    setActivities(prev => prev.filter(x => x.id !== id))
    toast('Atividade excluída')
  }

  // Today in Brazil timezone — activities before today are automatically hidden
  const todayDs = new Intl.DateTimeFormat('fr-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())

  const filtered = activities.filter(a => {
    if (!a.date) return false           // no date → reminders, not here
    if (a.date < todayDs) return false
    if (filterChild && a.child_id !== filterChild) return false
    return true
  })

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-5 space-y-5" style={{ boxSizing:'border-box' }}>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 animate-fade-up">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: accent }}>
            {emoji} Módulo
          </p>
          <h1 className="text-2xl font-bold" style={{ fontFamily:'var(--font-lora)', color: '#1A2B1C' }}>{title}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(26,43,28,0.45)' }}>
            {filtered.length} próxima{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold text-white transition-all hover:brightness-105 active:scale-95 flex-shrink-0"
          style={{ background: gradient, boxShadow: `0 4px 16px ${accent}44` }}
        >
          <Plus size={16} /> Nova
        </button>
      </div>

      {/* Filter bar — child selector only */}
      {children.length > 1 && (
        <div className="card p-3 flex gap-2 items-center animate-fade-up">
          <Filter size={13} style={{ color: 'rgba(26,43,28,0.45)', flexShrink:0 }} />
          <select
            value={filterChild}
            onChange={e => setFilterChild(e.target.value)}
            className="text-xs font-semibold border rounded-xl px-2 py-1.5 focus:outline-none transition-colors min-w-0"
            style={{ borderColor: 'rgba(61,102,65,0.22)', color: '#1A2B1C', background: '#FDF8F2', maxWidth: 160 }}
          >
            <option value="">Todos os filhos</option>
            {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <span className="ml-auto text-xs font-semibold flex-shrink-0" style={{ color: 'rgba(26,43,28,0.45)' }}>
            {filtered.length}
          </span>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="card h-20 shimmer" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Tudo tranquilo por aqui"
          subtitle={`Nenhuma atividade de ${title.toLowerCase()} agendada. Adicione manualmente ou fotografe a agenda — a IA extrai tudo sozinha.`}
          actionLabel="+ Adicionar"
          onAction={openNew}
        />
      ) : (
        <div className="space-y-2.5 stagger">
          {mergeActivities(filtered).map((group, gi) => (
            <ActivityCard
              key={group[0].id}
              group={group}
              accent={accent}
              index={gi}
              onEdit={(a) => openEdit(a)}
              onDelete={(id) => handleDelete(id)}
              familyMembers={familyMembers}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'new' ? `${emoji} Nova ${title}` : `✏️ Editar atividade`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: '#0F1F3D' }}>
              Filho(a) *
            </label>
            <select
              value={form.child_id}
              onChange={e => setForm(f => ({ ...f, child_id: e.target.value }))}
              className="input-field w-full"
            >
              <option value="">Selecione...</option>
              {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: '#0F1F3D' }}>
              Título *
            </label>
            <input
              type="text" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder={placeholders[category]}
              className="input-field w-full"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: '#0F1F3D' }}>
                Data <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0 }}>(opcional)</span>
              </label>
              <input
                type="date" value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="input-field w-full"
              />
              {!form.date && (
                <p className="text-[11px] mt-1 italic" style={{ color:'rgba(146,64,14,0.70)' }}>
                  Sem data → vai para Lembretes no dashboard
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: '#0F1F3D' }}>
                Hora
              </label>
              <input
                type="time" value={form.time}
                onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                className="input-field w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: '#0F1F3D' }}>
              Local / Observações
            </label>
            <input
              type="text" value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              placeholder="Ex.: Dr. Silva — Clínica ABC"
              className="input-field w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: '#0F1F3D' }}>
              Notas
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              placeholder="Anotações adicionais..."
              className="input-field w-full resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: '#0F1F3D' }}>
              Avisar com antecedência
            </label>
            <select
              value={form.alert_days}
              onChange={e => setForm(f => ({ ...f, alert_days: Number(e.target.value) }))}
              className="input-field w-full"
            >
              {ALERT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Button variant="ghost" onClick={() => setModal(null)}>Cancelar</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.title.trim() || !form.child_id}
              style={{ background: gradient, boxShadow: `0 4px 14px ${accent}44` }}
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

type ActivityWithChild = Activity & {
  child?: { name: string; avatar_color: string }
  takes_user_id?: string | null
  picks_user_id?: string | null
}

function LogisticsChip({
  type,
  assignedUserId,
  currentUserId,
  familyMembers,
  activityId,
  onUpdated,
}: {
  type: 'takes' | 'picks'
  assignedUserId: string | null | undefined
  currentUserId: string | undefined
  familyMembers: { user_id: string; display_name: string | null }[]
  activityId: string
  onUpdated: (field: 'takes_user_id' | 'picks_user_id', value: string | null) => void
}) {
  const supabase = createClient()
  const [saving, setSaving] = useState(false)

  const field: 'takes_user_id' | 'picks_user_id' = type === 'takes' ? 'takes_user_id' : 'picks_user_id'
  const isMe = assignedUserId === currentUserId
  const isPartner = assignedUserId && assignedUserId !== currentUserId
  const assignedMember = familyMembers.find(m => m.user_id === assignedUserId)
  const assignedName = isMe ? 'Você' : (assignedMember?.display_name ?? 'Parceiro(a)')

  async function handleClick() {
    if (saving) return
    // If partner assigned → confirm before reatribuir
    if (isPartner) {
      const ok = confirm(`${assignedName} já assumiu essa função. Deseja reatribuir para você?`)
      if (!ok) return
    }
    setSaving(true)
    const newValue = assignedUserId === currentUserId ? null : (currentUserId ?? null)
    await supabase.from('activities').update({ [field]: newValue }).eq('id', activityId)
    onUpdated(field, newValue)
    setSaving(false)
  }

  const icon = type === 'takes' ? <Car size={11} /> : <Home size={11} />
  const label = type === 'takes' ? 'Leva' : 'Busca'

  let chipStyle: React.CSSProperties
  if (!assignedUserId) {
    chipStyle = {
      background: 'rgba(61,102,65,0.05)',
      border: '1.5px dashed rgba(61,102,65,0.25)',
      color: 'rgba(26,43,28,0.40)',
    }
  } else if (isMe) {
    chipStyle = {
      background: 'rgba(61,102,65,0.10)',
      border: '1.5px solid rgba(61,102,65,0.30)',
      color: '#2D6A35',
    }
  } else {
    chipStyle = {
      background: 'rgba(99,102,241,0.07)',
      border: '1.5px solid rgba(99,102,241,0.25)',
      color: '#4338CA',
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={saving}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all hover:brightness-95 active:scale-95 disabled:opacity-50 flex-1"
      style={{ fontSize: 11, fontWeight: 600, cursor: 'pointer', ...chipStyle }}>
      {icon}
      <span style={{ fontSize: 9, fontWeight: 700, opacity: 0.65, marginRight: 2 }}>{label.toUpperCase()}</span>
      {assignedUserId ? assignedName : 'Definir'}
    </button>
  )
}

function ActivityCard({
  group, index, onEdit, onDelete, familyMembers = [], currentUserId,
}: {
  group: ActivityWithChild[]
  accent: string
  index: number
  onEdit: (a: ActivityWithChild) => void
  onDelete: (id: string) => void
  familyMembers?: { user_id: string; display_name: string | null; role: string }[]
  currentUserId?: string
}) {
  const [localGroup, setLocalGroup] = useState<ActivityWithChild[]>(group)
  const first  = localGroup[0]
  const merged = localGroup.length > 1
  const fmtDate = (d: string | null) => d ? format(new Date(d + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR }) : '—'

  // Only show logistics chips for dated activities when family sharing is active
  const showLogistics = !!first.date && familyMembers.length > 0

  function handleLogisticsUpdate(actId: string, field: 'takes_user_id' | 'picks_user_id', value: string | null) {
    setLocalGroup(prev => prev.map(a => a.id === actId ? { ...a, [field]: value } : a))
  }

  return (
    <div
      className="card card-lift animate-fade-up p-4"
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      <div className="flex items-start gap-3">
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm" style={{ color: '#0F1F3D' }}>
            {first.title}
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {localGroup.map(a => a.child && (
              <span key={a.id} className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                style={{ background: a.child.avatar_color }}>
                {a.child.name}
              </span>
            ))}
            <span className="text-xs font-medium" style={{ color: '#8B7A68' }}>
              📅 {fmtDate(first.date)}
            </span>
            {first.time && (
              <span className="text-xs flex items-center gap-1" style={{ color: '#8B7A68' }}>
                <Clock size={11} /> {first.time.slice(0,5)}
              </span>
            )}
            <DeadlineBadge date={first.date} />
          </div>
          {first.location && (
            <p className="text-xs flex items-center gap-1 mt-1" style={{ color: '#8B7A68' }}>
              <MapPin size={11} /> {first.location}
            </p>
          )}
          {first.description && (
            <p className="text-xs mt-1 line-clamp-2" style={{ color: '#C4B5A5' }}>{first.description}</p>
          )}

          {/* Logistics chips — one row per activity in group */}
          {showLogistics && (
            <div className="mt-2.5 pt-2 space-y-1.5" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              {localGroup.map(a => (
                <div key={a.id} className="flex gap-2">
                  {merged && a.child && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white flex-shrink-0 self-center"
                      style={{ background: a.child.avatar_color }}>
                      {a.child.name}
                    </span>
                  )}
                  <div className="flex gap-1.5 flex-1">
                    <LogisticsChip
                      type="takes"
                      assignedUserId={a.takes_user_id}
                      currentUserId={currentUserId}
                      familyMembers={familyMembers}
                      activityId={a.id}
                      onUpdated={(field, val) => handleLogisticsUpdate(a.id, field, val)}
                    />
                    <LogisticsChip
                      type="picks"
                      assignedUserId={a.picks_user_id}
                      currentUserId={currentUserId}
                      familyMembers={familyMembers}
                      activityId={a.id}
                      onUpdated={(field, val) => handleLogisticsUpdate(a.id, field, val)}
                    />
                  </div>
                  {merged && (
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => onEdit(a)}
                        className="w-7 h-7 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                        style={{ background: '#EEF4FF', color: '#2563EB' }}>
                        <Pencil size={11} />
                      </button>
                      <button onClick={() => onDelete(a.id)}
                        className="w-7 h-7 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                        style={{ background: '#FFF0EB', color: '#F4522D' }}>
                        <Trash2 size={11} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Per-child action rows when merged and NO logistics */}
          {merged && !showLogistics && (
            <div className="mt-2.5 space-y-1.5 border-t pt-2" style={{ borderColor:'rgba(0,0,0,0.06)' }}>
              {localGroup.map(a => (
                <div key={a.id} className="flex items-center gap-2">
                  {a.child && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white flex-shrink-0"
                      style={{ background: a.child.avatar_color }}>
                      {a.child.name}
                    </span>
                  )}
                  <div className="ml-auto flex gap-1 flex-shrink-0">
                    <button onClick={() => onEdit(a)}
                      className="w-7 h-7 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                      style={{ background: '#EEF4FF', color: '#2563EB' }}>
                      <Pencil size={11} />
                    </button>
                    <button onClick={() => onDelete(a.id)}
                      className="w-7 h-7 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                      style={{ background: '#FFF0EB', color: '#F4522D' }}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions — only shown when NOT merged */}
        {!merged && (
          <div className="flex gap-1.5 flex-none">
            <button onClick={() => onEdit(first)}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110"
              style={{ background: '#EEF4FF', color: '#2563EB' }}>
              <Pencil size={13} />
            </button>
            <button onClick={() => onDelete(first.id)}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110"
              style={{ background: '#FFF0EB', color: '#F4522D' }}>
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
