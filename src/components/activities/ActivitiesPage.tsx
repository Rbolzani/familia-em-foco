'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Activity, ActivityCategory, Child } from '@/lib/types'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { DeadlineBadge, StatusBadge } from '@/components/ui/Badge'
import { Plus, Check, Trash2, Pencil, Filter, Clock, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Props {
  category: ActivityCategory
  title: string
  emoji: string
  color: string
  subtypes?: string[]
  // Pre-fetched from server → no client-side loading waterfall
  initialActivities?: Activity[]
  initialChildren?: Child[]
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

export default function ActivitiesPage({ category, title, emoji, color, initialActivities, initialChildren }: Props) {
  const supabase = createClient()
  // If server pre-fetched data, use it immediately (no loading flash)
  const [activities, setActivities] = useState<Activity[]>(initialActivities ?? [])
  const [children, setChildren] = useState<Child[]>(initialChildren ?? [])
  const [loading, setLoading] = useState(!initialActivities)
  const [filterChild, setFilterChild] = useState('')
  const [filterStatus, setFilterStatus] = useState('pendente')
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

  function openNew() {
    setForm({ ...emptyForm, date: new Date().toISOString().split('T')[0], child_id: children[0]?.id ?? '' })
    setModal({ mode: 'new' })
  }

  function openEdit(a: Activity) {
    setForm({ child_id: a.child_id, title: a.title, description: a.description ?? '', date: a.date, time: a.time ?? '', alert_days: a.alert_days, location: a.location ?? '' })
    setModal({ mode: 'edit', activity: a })
  }

  async function handleSave() {
    if (!form.title.trim() || !form.date || !form.child_id) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const payload = {
      user_id: user!.id, child_id: form.child_id, category,
      title: form.title.trim(), description: form.description.trim() || null,
      date: form.date, time: form.time || null, alert_days: form.alert_days,
      location: form.location.trim() || null,
    }
    if (modal?.mode === 'new') await supabase.from('activities').insert(payload)
    else await supabase.from('activities').update(payload).eq('id', modal!.activity!.id)
    setSaving(false); setModal(null); load()
  }

  async function toggleStatus(a: Activity) {
    const newStatus = a.status === 'pendente' ? 'concluido' : 'pendente'
    await supabase.from('activities').update({ status: newStatus }).eq('id', a.id)
    setActivities(prev => prev.map(x => x.id === a.id ? { ...x, status: newStatus } : x))
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta atividade?')) return
    await supabase.from('activities').delete().eq('id', id)
    setActivities(prev => prev.filter(x => x.id !== id))
  }

  const filtered = activities.filter(a => {
    if (filterChild && a.child_id !== filterChild) return false
    if (filterStatus && a.status !== filterStatus) return false
    return true
  })

  const pendentes = activities.filter(a => a.status === 'pendente').length

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
            {pendentes} pendente{pendentes !== 1 ? 's' : ''}
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

      {/* Filter bar */}
      <div className="card p-3 flex flex-wrap gap-2 items-center animate-fade-up">
        <Filter size={13} style={{ color: 'rgba(26,43,28,0.45)', flexShrink:0 }} />
        {children.length > 0 && (
          <select
            value={filterChild}
            onChange={e => setFilterChild(e.target.value)}
            className="text-xs font-semibold border rounded-xl px-2 py-1.5 focus:outline-none transition-colors min-w-0"
            style={{ borderColor: 'rgba(61,102,65,0.22)', color: '#1A2B1C', background: '#FDF8F2', maxWidth: 130 }}
          >
            <option value="">Todos</option>
            {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
        <div className="flex gap-1.5 flex-wrap">
          {[
            { value: '', label: 'Todos' },
            { value: 'pendente', label: 'Pendentes' },
            { value: 'concluido', label: 'Feitos' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilterStatus(opt.value)}
              className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              style={filterStatus === opt.value
                ? { background: accent, color: '#fff', boxShadow: `0 2px 8px ${accent}44` }
                : { background: bg, color: accent }
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs font-semibold flex-shrink-0" style={{ color: 'rgba(26,43,28,0.45)' }}>
          {filtered.length}
        </span>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="card h-20 shimmer" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center animate-fade-up" style={{ border: '2px dashed #EDE4D6' }}>
          <div className="text-4xl mb-3 animate-float">{emoji}</div>
          <h3 className="font-fraunces text-lg font-bold mb-1" style={{ color: '#0F1F3D' }}>
            Nenhuma atividade
          </h3>
          <p className="text-sm mb-4" style={{ color: '#8B7A68' }}>
            {filterStatus === 'pendente' ? 'Tudo em dia! Ou adicione uma nova.' : 'Nenhum registro encontrado.'}
          </p>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:brightness-105"
            style={{ background: gradient }}
          >
            <Plus size={14} /> Adicionar
          </button>
        </div>
      ) : (
        <div className="space-y-2.5 stagger">
          {filtered.map((a, i) => (
            <ActivityCard
              key={a.id}
              activity={a}
              accent={accent}
              index={i}
              onToggle={() => toggleStatus(a)}
              onEdit={() => openEdit(a)}
              onDelete={() => handleDelete(a.id)}
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
                Data *
              </label>
              <input
                type="date" value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="input-field w-full"
              />
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
              disabled={saving || !form.title.trim() || !form.date || !form.child_id}
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

function ActivityCard({
  activity, accent, index, onToggle, onEdit, onDelete,
}: {
  activity: Activity & { child?: { name: string; avatar_color: string } }
  accent: string
  index: number
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const done = activity.status === 'concluido'
  const fmtDate = (d: string) => format(new Date(d + 'T00:00:00'), "dd/MM (EEE)", { locale: ptBR })

  return (
    <div
      className="card card-lift animate-fade-up flex items-start gap-3 p-4"
      style={{ animationDelay: `${index * 0.04}s`, opacity: done ? .65 : 1 }}
    >
      {/* Toggle */}
      <button
        onClick={onToggle}
        className="mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-none transition-all hover:scale-110"
        style={done
          ? { background: '#00C48C', borderColor: '#00C48C', color: '#fff' }
          : { borderColor: '#EDE4D6', background: 'transparent' }
        }
      >
        {done && <Check size={12} strokeWidth={3} />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div
          className="font-semibold text-sm"
          style={{ color: done ? '#8B7A68' : '#0F1F3D', textDecoration: done ? 'line-through' : 'none' }}
        >
          {activity.title}
        </div>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {activity.child && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
              style={{ background: activity.child.avatar_color }}
            >
              {activity.child.name}
            </span>
          )}
          <span className="text-xs font-medium" style={{ color: '#8B7A68' }}>
            📅 {fmtDate(activity.date)}
          </span>
          {activity.time && (
            <span className="text-xs flex items-center gap-1" style={{ color: '#8B7A68' }}>
              <Clock size={11} /> {activity.time.slice(0,5)}
            </span>
          )}
          <DeadlineBadge date={activity.date} />
          <StatusBadge status={activity.status} />
        </div>
        {activity.location && (
          <p className="text-xs flex items-center gap-1 mt-1" style={{ color: '#8B7A68' }}>
            <MapPin size={11} /> {activity.location}
          </p>
        )}
        {activity.description && (
          <p className="text-xs mt-1 line-clamp-2" style={{ color: '#C4B5A5' }}>{activity.description}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-1.5 flex-none">
        <button
          onClick={onEdit}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110"
          style={{ background: '#EEF4FF', color: '#2563EB' }}
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={onDelete}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110"
          style={{ background: '#FFF0EB', color: '#F4522D' }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}
