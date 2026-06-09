'use client'
import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Child } from '@/lib/types'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { Plus, Pencil, Trash2, GraduationCap, Cake, Camera, X, AlertCircle } from 'lucide-react'

// Stable singleton — not re-created on every render
const supabase = createClient()

const AVATAR_COLORS = [
  '#F4522D','#F5A623','#00C48C','#2563EB',
  '#7C3AED','#DB2777','#0891B2','#059669',
]

function calcAge(birthDate: string | null) {
  if (!birthDate) return null
  const diff = Date.now() - new Date(birthDate + 'T00:00:00').getTime()
  const years = Math.floor(diff / (365.25 * 86_400_000))
  return years > 0 ? `${years} anos` : 'Menos de 1 ano'
}

// ── Avatar component — shows photo or letter fallback ─────────────────────
export function ChildAvatar({
  child, size = 56, radius = 18,
}: { child: Pick<Child,'name'|'avatar_color'|'avatar_url'>; size?: number; radius?: number }) {
  const [imgError, setImgError] = useState(false)
  const showPhoto = child.avatar_url && !imgError

  return (
    <div style={{
      width: size, height: size, borderRadius: radius, flexShrink: 0, overflow: 'hidden',
      background: showPhoto ? 'transparent' : child.avatar_color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: `0 6px 20px ${child.avatar_color}55`,
      fontFamily: 'var(--font-lora)', fontWeight: 700,
      fontSize: size * 0.38, color: 'white',
    }}>
      {showPhoto ? (
        <img src={child.avatar_url!} alt={child.name}
          onError={() => setImgError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        child.name.charAt(0).toUpperCase()
      )}
    </div>
  )
}

// ── Read file as data URL (returns a promise) ─────────────────────────────
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

// ── Photo picker ──────────────────────────────────────────────────────────
function PhotoPicker({ preview, onFile, onClear }: {
  preview: string | null
  onFile: (f: File) => void
  onClear: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  function openPicker() {
    inputRef.current?.click()
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) onFile(f)
    e.target.value = '' // reset so re-selecting same file works
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>

      {/* Photo area — div (not button) to avoid Android Chrome img-in-button bug.
          Uses backgroundImage so the data URL renders reliably on all mobile browsers. */}
      <div
        role="button"
        tabIndex={0}
        onClick={openPicker}
        onKeyDown={e => e.key === 'Enter' && openPicker()}
        style={{
          width: 88, height: 88, borderRadius: 20, flexShrink: 0,
          cursor: 'pointer', position: 'relative', overflow: 'hidden',
          // Show photo as CSS background — avoids img-in-button issues on Android
          backgroundImage: preview ? `url("${preview}")` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: preview ? '#000' : 'rgba(61,102,65,0.07)',
          border: preview ? 'none' : '2px dashed rgba(61,102,65,0.30)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
        {/* Camera icon: always show when no photo; subtle overlay when photo exists */}
        <div style={{
          position: 'absolute', inset: 0,
          background: preview ? 'rgba(0,0,0,0.30)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Camera size={preview ? 20 : 28} color={preview ? 'white' : 'rgba(61,102,65,0.45)'} />
        </div>
      </div>

      {/* Hidden native file input — off-screen, NOT display:none (iOS compatibility) */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ position: 'fixed', top: -9999, left: -9999, opacity: 0, pointerEvents: 'none' }}
        onChange={handleChange}
      />

      {/* Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          type="button"
          onClick={openPicker}
          style={{
            padding: '9px 16px', borderRadius: 10, cursor: 'pointer',
            background: 'rgba(61,102,65,0.10)', color: '#3D6641',
            border: '1px solid rgba(61,102,65,0.22)',
            fontSize: 13, fontWeight: 700,
          }}>
          {preview ? '📷 Trocar foto' : '📷 Escolher foto'}
        </button>

        {preview && (
          <button
            type="button"
            onClick={onClear}
            style={{
              padding: '7px 16px', borderRadius: 10, cursor: 'pointer',
              background: 'rgba(220,38,38,0.07)', color: '#DC2626',
              border: '1px solid rgba(220,38,38,0.18)',
              fontSize: 12, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
            <X size={11} /> Remover foto
          </button>
        )}

        <p style={{ fontSize: 11, color: 'rgba(26,43,28,0.35)', margin: 0 }}>
          JPG, PNG, WEBP • máx 5 MB
        </p>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────
interface Props { initialChildren: Child[] }

export default function ChildrenClient({ initialChildren }: Props) {
  const [children,     setChildren]     = useState<Child[]>(initialChildren)
  const [modal,        setModal]        = useState<{ mode:'new'|'edit'; child?: Child }|null>(null)
  const [saving,       setSaving]       = useState(false)
  const [saveError,    setSaveError]    = useState<string|null>(null)
  const [form,         setForm]         = useState({
    name: '', birth_date: '', school_name: '', avatar_color: AVATAR_COLORS[0],
  })
  const [photoFile,    setPhotoFile]    = useState<File|null>(null)
  const [photoPreview, setPhotoPreview] = useState<string|null>(null)

  const closeModal = useCallback(() => {
    setModal(null)
    setSaveError(null)
  }, [])

  async function load() {
    const { data } = await supabase.from('children').select('*').order('sort_order')
    setChildren(data ?? [])
  }

  function openNew() {
    setForm({ name: '', birth_date: '', school_name: '', avatar_color: AVATAR_COLORS[0] })
    setPhotoFile(null)
    setPhotoPreview(null)
    setSaveError(null)
    setModal({ mode: 'new' })
  }

  function openEdit(child: Child) {
    setForm({
      name: child.name,
      birth_date: child.birth_date ?? '',
      school_name: child.school_name ?? '',
      avatar_color: child.avatar_color,
    })
    setPhotoFile(null)
    setPhotoPreview(child.avatar_url ?? null)
    setSaveError(null)
    setModal({ mode: 'edit', child })
  }

  async function handleFileSelected(f: File) {
    setPhotoFile(f)
    try {
      const dataUrl = await readFileAsDataUrl(f)
      setPhotoPreview(dataUrl)
    } catch {
      setPhotoPreview(null)
    }
  }

  async function uploadPhoto(userId: string, childId: string): Promise<string | null> {
    if (!photoFile) return null

    const ext  = photoFile.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const path = `${userId}/${childId}_${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, photoFile, { upsert: true })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw new Error(`Erro ao enviar foto: ${uploadError.message}`)
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(path)

    return publicUrl
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    setSaveError(null)

    try {
      const { data: { user }, error: userErr } = await supabase.auth.getUser()
      if (userErr || !user) throw new Error('Sessão expirada. Faça login novamente.')

      if (modal?.mode === 'new') {
        // 1) Insert child first to get the generated ID
        const { data: inserted, error: insertErr } = await supabase
          .from('children')
          .insert({
            user_id:     user.id,
            name:        form.name.trim(),
            birth_date:  form.birth_date || null,
            school_name: form.school_name.trim() || null,
            avatar_color: form.avatar_color,
            sort_order:  children.length,
          })
          .select()
          .single()

        if (insertErr || !inserted) throw new Error('Erro ao cadastrar filho.')

        // 2) Upload photo if selected
        if (photoFile) {
          const url = await uploadPhoto(user.id, inserted.id)
          if (url) {
            const { error: upErr } = await supabase
              .from('children')
              .update({ avatar_url: url })
              .eq('id', inserted.id)
            if (upErr) console.warn('Foto enviada mas não salva no perfil:', upErr)
          }
        }

      } else {
        const child = modal!.child!

        // Determine final avatar_url
        let avatar_url: string | null = photoPreview // preserves existing URL if unchanged

        if (photoFile) {
          // New file selected → upload it
          avatar_url = await uploadPhoto(user.id, child.id)
        } else if (photoPreview === null) {
          // User explicitly cleared photo
          avatar_url = null
        }
        // else: photoPreview still holds the existing URL → keep it

        const { error: updateErr } = await supabase
          .from('children')
          .update({
            name:        form.name.trim(),
            birth_date:  form.birth_date || null,
            school_name: form.school_name.trim() || null,
            avatar_color: form.avatar_color,
            avatar_url,
          })
          .eq('id', child.id)

        if (updateErr) throw new Error(`Erro ao salvar: ${updateErr.message}`)
      }

      closeModal()
      load()

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido.'
      setSaveError(msg)
    } finally {
      setSaving(false)
    }
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
          <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: '#3D6641' }}>Perfis</p>
          <h1 style={{ fontFamily: 'var(--font-lora)', fontSize: 30, fontWeight: 700, color: '#1A2B1C', lineHeight: 1.1 }}>
            Meus Filhos
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(26,43,28,0.45)' }}>
            {children.length > 0
              ? `${children.length} filho${children.length > 1 ? 's' : ''} cadastrado${children.length > 1 ? 's' : ''}`
              : 'Adicione os perfis dos seus filhos'}
          </p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold text-white transition-all hover:brightness-105 active:scale-95"
          style={{ background: 'linear-gradient(140deg,#3D6641,#2C4A2E)', boxShadow: '0 4px 16px rgba(44,74,46,0.30)' }}>
          <Plus size={16} /> Adicionar
        </button>
      </div>

      {/* Empty state */}
      {children.length === 0 && (
        <div className="card p-10 text-center animate-fade-up" style={{ border: '2px dashed #EDE4D6' }}>
          <div className="text-5xl mb-4 animate-float">👶</div>
          <h3 style={{ fontFamily: 'var(--font-lora)', fontSize: 20, fontWeight: 700, color: '#1A2B1C', marginBottom: 8 }}>
            Nenhum filho cadastrado
          </h3>
          <p className="text-sm mb-5" style={{ color: 'rgba(26,43,28,0.45)' }}>
            Adicione seu primeiro filho para começar a organizar a rotina.
          </p>
          <button onClick={openNew}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white transition-all hover:brightness-105 active:scale-95"
            style={{ background: 'linear-gradient(140deg,#3D6641,#2C4A2E)', boxShadow: '0 4px 14px rgba(44,74,46,0.28)' }}>
            <Plus size={15} /> Adicionar filho
          </button>
        </div>
      )}

      {/* List */}
      {children.length > 0 && (
        <div className="space-y-3 stagger">
          {children.map((child, i) => (
            <div key={child.id}
              className="card card-lift animate-fade-up p-4 flex items-center gap-4"
              style={{ animationDelay: `${i * 0.06}s` }}>

              <ChildAvatar child={child} size={56} radius={16} />

              <div className="flex-1 min-w-0">
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1A2B1C' }}>{child.name}</div>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  {child.birth_date && (
                    <span className="text-xs flex items-center gap-1 font-medium" style={{ color: 'rgba(26,43,28,0.50)' }}>
                      <Cake size={12} /> {calcAge(child.birth_date)}
                    </span>
                  )}
                  {child.school_name && (
                    <span className="text-xs flex items-center gap-1 font-medium" style={{ color: 'rgba(26,43,28,0.50)' }}>
                      <GraduationCap size={12} /> {child.school_name}
                    </span>
                  )}
                  {!child.birth_date && !child.school_name && (
                    <span className="text-xs italic" style={{ color: 'rgba(26,43,28,0.30)' }}>Sem informações adicionais</span>
                  )}
                </div>
              </div>

              <div className="flex gap-1.5 flex-none">
                <button onClick={() => openEdit(child)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                  style={{ background: 'rgba(61,102,65,0.10)', color: '#3D6641' }}>
                  <Pencil size={15} />
                </button>
                <button onClick={() => handleDelete(child.id, child.name)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                  style={{ background: 'rgba(220,38,38,0.08)', color: '#DC2626' }}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal open={!!modal} onClose={closeModal}
        title={modal?.mode === 'new' ? '👶 Adicionar filho' : '✏️ Editar filho'} size="sm">
        <div className="space-y-5">

          {/* Error banner */}
          {saveError && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '12px 14px', borderRadius: 12,
              background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.22)',
            }}>
              <AlertCircle size={16} color="#DC2626" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 13, color: '#DC2626', lineHeight: 1.45, margin: 0 }}>{saveError}</p>
            </div>
          )}

          {/* Photo picker */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 10,
              textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(26,43,28,0.55)' }}>
              Foto
            </label>
            <PhotoPicker
              preview={photoPreview}
              onFile={handleFileSelected}
              onClear={() => { setPhotoFile(null); setPhotoPreview(null) }}
            />
          </div>

          {/* Name */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 6,
              textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(26,43,28,0.55)' }}>
              Nome *
            </label>
            <input type="text" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Nome do filho(a)" className="input-field w-full" />
          </div>

          {/* Birth date */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 6,
              textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(26,43,28,0.55)' }}>
              Data de nascimento
            </label>
            <input type="date" value={form.birth_date}
              onChange={e => setForm(f => ({ ...f, birth_date: e.target.value }))}
              className="input-field w-full" />
          </div>

          {/* School */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 6,
              textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(26,43,28,0.55)' }}>
              Escola
            </label>
            <input type="text" value={form.school_name}
              onChange={e => setForm(f => ({ ...f, school_name: e.target.value }))}
              placeholder="Nome da escola" className="input-field w-full" />
          </div>

          {/* Avatar color */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 8,
              textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(26,43,28,0.55)' }}>
              Cor do avatar
            </label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {AVATAR_COLORS.map(color => (
                <button key={color} type="button"
                  onClick={() => setForm(f => ({ ...f, avatar_color: color }))}
                  style={{
                    width: 36, height: 36, borderRadius: 10, background: color,
                    border: 'none', cursor: 'pointer',
                    boxShadow: form.avatar_color === color
                      ? `0 0 0 3px white, 0 0 0 5px ${color}`
                      : '0 2px 6px rgba(0,0,0,0.15)',
                    transform: form.avatar_color === color ? 'scale(1.15)' : 'scale(1)',
                    transition: 'all .18s',
                  }} />
              ))}
            </div>

            {/* Avatar preview */}
            <div style={{
              marginTop: 12, display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px', borderRadius: 14, background: 'rgba(61,102,65,0.06)',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 13, overflow: 'hidden', flexShrink: 0,
                background: form.avatar_color,
                backgroundImage: photoPreview ? `url("${photoPreview}")` : 'none',
                backgroundSize: 'cover', backgroundPosition: 'center',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-lora)', fontWeight: 700, fontSize: 18, color: 'white',
              }}>
                {!photoPreview && (form.name.charAt(0).toUpperCase() || '?')}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1A2B1C' }}>
                {form.name || 'Nome do filho'}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <Button variant="ghost" onClick={closeModal} style={{ flex: 1 }}>
              Cancelar
            </Button>
            <button
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
              style={{
                flex: 2, padding: '13px 20px', borderRadius: 14, border: 'none',
                cursor: saving || !form.name.trim() ? 'not-allowed' : 'pointer',
                background: saving || !form.name.trim()
                  ? 'rgba(61,102,65,0.25)'
                  : 'linear-gradient(140deg,#3D6641,#2C4A2E)',
                color: 'white', fontSize: 15, fontWeight: 700,
                boxShadow: saving || !form.name.trim() ? 'none' : '0 4px 16px rgba(44,74,46,0.32)',
                transition: 'all .2s',
              }}>
              {saving
                ? 'Salvando…'
                : modal?.mode === 'new'
                  ? '✓ Adicionar filho'
                  : '✓ Salvar alterações'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
