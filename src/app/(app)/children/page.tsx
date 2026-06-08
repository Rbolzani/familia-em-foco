'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Child } from '@/lib/types'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { Baby, Plus, Pencil, Trash2, GraduationCap, Cake } from 'lucide-react'

const AVATAR_COLORS = [
  '#F4522D','#F5A623','#00C48C','#2563EB',
  '#7C3AED','#DB2777','#0891B2','#059669',
]

function age(birthDate: string | null) {
  if (!birthDate) return null
  const diff = Date.now() - new Date(birthDate + 'T00:00:00').getTime()
  const years = Math.floor(diff / (365.25 * 86_400_000))
  return years > 0 ? `${years} anos` : 'Menos de 1 ano'
}

export default function ChildrenPage() {
  const supabase = createClient()
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ mode: 'new' | 'edit'; child?: Child } | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', birth_date: '', school_name: '', avatar_color: AVATAR_COLORS[0] })

  async function load() {
    const { data } = await supabase.from('children').select('*').order('sort_order')
    setChildren(data ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function openNew() {
    setForm({ name: '', birth_date: '', school_name: '', avatar_color: AVATAR_COLORS[0] })
    setModal({ mode: 'new' })
  }
  function openEdit(child: Child) {
    setForm({ name: child.name, birth_date: child.birth_date ?? '', school_name: child.school_name ?? '', avatar_color: child.avatar_color })
    setModal({ mode: 'edit', child })
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    if (modal?.mode === 'new') {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('children').insert({
        user_id: user!.id,
        name: form.name.trim(),
        birth_date: form.birth_date || null,
        school_name: form.school_name.trim() || null,
        avatar_color: form.avatar_color,
        sort_order: children.length,
      })
    } else {
      await supabase.from('children').update({
        name: form.name.trim(),
        birth_date: form.birth_date || null,
        school_name: form.school_name.trim() || null,
        avatar_color: form.avatar_color,
      }).eq('id', modal!.child!.id)
    }
    setSaving(false); setModal(null); load()
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remover ${name}? As atividades associadas também serão removidas.`)) return
    await supabase.from('children').delete().eq('id', id)
    load()
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: '#F4522D' }}>
            Perfis
          </p>
          <h1 className="font-fraunces text-3xl font-bold" style={{ color: '#0F1F3D' }}>
            Meus Filhos
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#8B7A68' }}>
            {children.length > 0
              ? `${children.length} filho${children.length > 1 ? 's' : ''} cadastrado${children.length > 1 ? 's' : ''}`
              : 'Adicione os perfis dos seus filhos'}
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold text-white transition-all hover:brightness-105 active:scale-95"
          style={{ background: 'linear-gradient(135deg,#F4522D,#D93D1A)', boxShadow: '0 4px 16px rgba(244,82,45,.3)' }}
        >
          <Plus size={16} /> Adicionar
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1,2].map(i => (
            <div key={i} className="card h-24 shimmer" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && children.length === 0 && (
        <div className="card p-10 text-center animate-fade-up" style={{ border: '2px dashed #EDE4D6' }}>
          <div className="text-5xl mb-4 animate-float">👶</div>
          <h3 className="font-fraunces text-xl font-bold mb-2" style={{ color: '#0F1F3D' }}>
            Nenhum filho cadastrado
          </h3>
          <p className="text-sm mb-5" style={{ color: '#8B7A68' }}>
            Adicione seu primeiro filho para começar a organizar a rotina.
          </p>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white transition-all hover:brightness-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg,#F4522D,#D93D1A)', boxShadow: '0 4px 14px rgba(244,82,45,.3)' }}
          >
            <Plus size={15} /> Adicionar filho
          </button>
        </div>
      )}

      {/* List */}
      {!loading && children.length > 0 && (
        <div className="space-y-3 stagger">
          {children.map((child, i) => (
            <div
              key={child.id}
              className="card card-lift animate-fade-up p-4 flex items-center gap-4"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              {/* Avatar */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-bold font-fraunces flex-none shadow-lg"
                style={{ background: child.avatar_color, boxShadow: `0 6px 20px ${child.avatar_color}55` }}
              >
                {child.name.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-base" style={{ color: '#0F1F3D' }}>{child.name}</div>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  {child.birth_date && (
                    <span className="text-xs flex items-center gap-1 font-medium" style={{ color: '#8B7A68' }}>
                      <Cake size={12} /> {age(child.birth_date)}
                    </span>
                  )}
                  {child.school_name && (
                    <span className="text-xs flex items-center gap-1 font-medium" style={{ color: '#8B7A68' }}>
                      <GraduationCap size={12} /> {child.school_name}
                    </span>
                  )}
                  {!child.birth_date && !child.school_name && (
                    <span className="text-xs" style={{ color: '#C4B5A5' }}>Sem informações adicionais</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-1.5 flex-none">
                <button
                  onClick={() => openEdit(child)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                  style={{ background: '#EEF4FF', color: '#2563EB' }}
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => handleDelete(child.id, child.name)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                  style={{ background: '#FFF0EB', color: '#F4522D' }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'new' ? '👶 Adicionar filho' : '✏️ Editar filho'}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: '#0F1F3D' }}>
              Nome *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Nome do filho(a)"
              className="input-field w-full"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: '#0F1F3D' }}>
              Data de nascimento
            </label>
            <input
              type="date"
              value={form.birth_date}
              onChange={e => setForm(f => ({ ...f, birth_date: e.target.value }))}
              className="input-field w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: '#0F1F3D' }}>
              Escola
            </label>
            <input
              type="text"
              value={form.school_name}
              onChange={e => setForm(f => ({ ...f, school_name: e.target.value }))}
              placeholder="Nome da escola"
              className="input-field w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: '#0F1F3D' }}>
              Cor do avatar
            </label>
            <div className="flex gap-2.5 flex-wrap">
              {AVATAR_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, avatar_color: color }))}
                  className="w-9 h-9 rounded-xl transition-all hover:scale-110"
                  style={{
                    background: color,
                    boxShadow: form.avatar_color === color ? `0 0 0 3px white, 0 0 0 5px ${color}` : 'none',
                    transform: form.avatar_color === color ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
            {/* Preview */}
            <div className="mt-3 flex items-center gap-3 p-3 rounded-xl" style={{ background: '#F9F5F0' }}>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold font-fraunces text-lg flex-none"
                style={{ background: form.avatar_color }}
              >
                {form.name.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="text-sm font-semibold" style={{ color: '#0F1F3D' }}>
                {form.name || 'Nome do filho'}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Button variant="ghost" onClick={() => setModal(null)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving ? 'Salvando...' : modal?.mode === 'new' ? 'Adicionar' : 'Salvar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
