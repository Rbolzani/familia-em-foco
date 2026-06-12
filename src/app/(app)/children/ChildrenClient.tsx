'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Child } from '@/lib/types'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { Plus, Pencil, Trash2, GraduationCap, Cake, Camera, X, AlertCircle } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'
import { useAccess } from '@/components/access/AccessContext'

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

// ── Photo picker ──────────────────────────────────────────────────────────
// Uses <label htmlFor> → <input> association: the most universally supported
// way to trigger a file picker on mobile without programmatic .click() calls.
// Image rendered as <img src={blobUrl}> inside the label — not backgroundImage,
// not inside a <button> — the combination that works on all Android/iOS browsers.
function PhotoPicker({ preview, onFile, onClear }: {
  preview: string | null
  onFile: (f: File) => void
  onClear: () => void
}) {
  const inputId = 'child-photo-input'

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) onFile(f)
    e.target.value = ''
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>

      {/* label triggers the file input natively — no .click() needed, works on all mobile */}
      <label
        htmlFor={inputId}
        style={{
          width: 88, height: 88, borderRadius: 20, flexShrink: 0,
          cursor: 'pointer', position: 'relative', overflow: 'hidden',
          display: 'block',
          background: 'rgba(61,102,65,0.07)',
          border: preview ? '2px solid rgba(61,102,65,0.20)' : '2px dashed rgba(61,102,65,0.35)',
        }}>
        {/* img inside label — renders blob URL reliably on all browsers */}
        {preview && (
          <img
            src={preview}
            alt=""
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover', display: 'block',
            }}
          />
        )}
        {/* Camera overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: preview ? 'rgba(0,0,0,0.28)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Camera size={preview ? 18 : 28} color={preview ? 'white' : 'rgba(61,102,65,0.50)'} />
        </div>
      </label>

      {/* File input — display:none is fine when triggered via label htmlFor */}
      <input
        id={inputId}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleChange}
      />

      {/* Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
        <label
          htmlFor={inputId}
          style={{
            padding: '9px 16px', borderRadius: 10, cursor: 'pointer',
            background: 'rgba(61,102,65,0.10)', color: '#3D6641',
            border: '1px solid rgba(61,102,65,0.22)',
            fontSize: 13, fontWeight: 700, display: 'block', textAlign: 'center',
          }}>
          {preview ? '📷 Trocar foto' : '📷 Escolher foto'}
        </label>

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
  const { canEdit } = useAccess()
  const [children,     setChildren]     = useState<Child[]>(initialChildren)
  const [modal,        setModal]        = useState<{ mode:'new'|'edit'; child?: Child }|null>(null)
  const [saving,       setSaving]       = useState(false)
  const [saveError,    setSaveError]    = useState<string|null>(null)
  const [deleteError,  setDeleteError]  = useState<string|null>(null)
  const [deleting,     setDeleting]     = useState<string|null>(null)   // id being deleted
  const [form,         setForm]         = useState({
    name: '', birth_date: '', school_name: '', avatar_color: AVATAR_COLORS[0],
  })
  const [photoFile,    setPhotoFile]    = useState<File|null>(null)
  const [photoPreview, setPhotoPreview] = useState<string|null>(null)

  // Track current blob URL so we can revoke it when replaced or unmounted
  const blobUrlRef = useRef<string | null>(null)

  function revokeBlobUrl() {
    if (blobUrlRef.current?.startsWith('blob:')) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }
  }

  // Revoke on unmount
  useEffect(() => revokeBlobUrl, [])

  const closeModal = useCallback(() => {
    revokeBlobUrl()
    setModal(null)
    setSaveError(null)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

  function handleFileSelected(f: File) {
    setPhotoFile(f)
    // Revoke previous blob URL before creating a new one
    revokeBlobUrl()
    const blobUrl = URL.createObjectURL(f)
    blobUrlRef.current = blobUrl
    setPhotoPreview(blobUrl)
  }

  async function uploadPhoto(userId: string, childId: string): Promise<string | null> {
    if (!photoFile) return null

    const ext  = photoFile.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const path = `${userId}/${childId}_${Date.now()}.${ext}`

    console.log('[uploadPhoto] uploading to path:', path)

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, photoFile, { upsert: true })

    if (uploadError) {
      console.error('[uploadPhoto] storage error:', uploadError)
      throw new Error(
        `Erro no upload da foto: ${uploadError.message}\n\n` +
        `Execute no Supabase SQL Editor (Storage → Policies → avatars bucket):\n` +
        `CREATE POLICY "avatars_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);\n` +
        `CREATE POLICY "avatars_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);\n` +
        `CREATE POLICY "avatars_select" ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');`
      )
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(path)

    console.log('[uploadPhoto] public URL:', publicUrl)
    return publicUrl
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    setSaveError(null)

    try {
      const { data: { user }, error: userErr } = await supabase.auth.getUser()
      if (userErr || !user) throw new Error('Sessão expirada. Faça login novamente.')

      const baseFields = {
        name:        form.name.trim(),
        birth_date:  form.birth_date || null,
        school_name: form.school_name.trim() || null,
        avatar_color: form.avatar_color,
      }

      if (modal?.mode === 'new') {
        // Step 1: insert base fields (no avatar_url yet)
        const { data: inserted, error: insertErr } = await supabase
          .from('children')
          .insert({ ...baseFields, user_id: user.id, sort_order: children.length })
          .select()
          .single()
        if (insertErr || !inserted) {
          console.error('[handleSave] insert error:', insertErr)
          throw new Error(
            `Erro ao cadastrar filho: ${insertErr?.message}\n\n` +
            `Execute no Supabase SQL Editor:\n` +
            `ALTER TABLE children ENABLE ROW LEVEL SECURITY;\n` +
            `CREATE POLICY "children_insert" ON children FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);`
          )
        }

        // Step 2: upload photo and update avatar_url
        if (photoFile) {
          const url = await uploadPhoto(user.id, inserted.id)
          if (url) {
            console.log('[handleSave] updating avatar_url:', url)
            const { error: photoErr } = await supabase
              .from('children').update({ avatar_url: url }).eq('id', inserted.id)
            if (photoErr) {
              console.error('[handleSave] avatar_url update error:', photoErr)
              // Filho salvo, foto falhou — mantém modal aberto com erro visível
              await load()
              setSaveError(
                `Filho adicionado ✓, mas a foto não salvou.\n\nErro: ${photoErr.message}\n\n` +
                `Execute no Supabase SQL Editor e tente novamente:\n` +
                `ALTER TABLE children ADD COLUMN IF NOT EXISTS avatar_url TEXT;\n\n` +
                `CREATE POLICY "children_update" ON children FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`
              )
              setSaving(false)
              return
            }
          }
        }

      } else {
        const child = modal!.child!

        // Step 1: save base fields first
        console.log('[handleSave] updating base fields for', child.id)
        const { error: baseErr } = await supabase
          .from('children').update(baseFields).eq('id', child.id)
        if (baseErr) {
          console.error('[handleSave] base update error:', baseErr)
          throw new Error(
            `Erro ao salvar dados: ${baseErr.message}\n\n` +
            `Execute no Supabase SQL Editor:\n` +
            `CREATE POLICY "children_update" ON children FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`
          )
        }

        // Step 2: save photo if new file selected
        if (photoFile) {
          const url = await uploadPhoto(user.id, child.id)
          if (url) {
            console.log('[handleSave] updating avatar_url:', url)
            const { error: photoErr } = await supabase
              .from('children').update({ avatar_url: url }).eq('id', child.id)
            if (photoErr) {
              console.error('[handleSave] avatar_url update error:', photoErr)
              await load()
              setSaveError(
                `Dados salvos ✓, mas a foto não salvou.\n\nErro: ${photoErr.message}\n\n` +
                `Execute no Supabase SQL Editor e tente novamente:\n` +
                `ALTER TABLE children ADD COLUMN IF NOT EXISTS avatar_url TEXT;`
              )
              setSaving(false)
              return
            }
          }
        } else if (photoPreview === null && child.avatar_url) {
          // User removed the photo
          await supabase.from('children').update({ avatar_url: null }).eq('id', child.id)
        }
      }

      await load()
      closeModal()

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido.'
      setSaveError(msg)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remover ${name}? As atividades associadas também serão removidas.`)) return
    setDeleteError(null)
    setDeleting(id)
    try {
      const { error } = await supabase.from('children').delete().eq('id', id)
      if (error) {
        console.error('[handleDelete] error:', error)
        setDeleteError(
          `Não foi possível excluir "${name}": ${error.message}\n\n` +
          `Execute no Supabase SQL Editor:\n` +
          `CREATE POLICY "children_delete" ON children FOR DELETE TO authenticated USING (auth.uid() = user_id);`
        )
      } else {
        await load()
      }
    } catch (err) {
      console.error('[handleDelete] unexpected error:', err)
      setDeleteError(`Erro inesperado ao excluir "${name}". Tente novamente.`)
    } finally {
      setDeleting(null)
    }
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
        {canEdit && (
          <button onClick={openNew}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold text-white transition-all hover:brightness-105 active:scale-95"
            style={{ background: 'linear-gradient(140deg,#3D6641,#2C4A2E)', boxShadow: '0 4px 16px rgba(44,74,46,0.30)' }}>
            <Plus size={16} /> Adicionar
          </button>
        )}
      </div>

      {/* Delete error banner */}
      {deleteError && (
        <div className="animate-fade-up" style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          padding: '14px 16px', borderRadius: 14,
          background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.22)',
        }}>
          <AlertCircle size={16} color="#DC2626" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, color: '#DC2626', lineHeight: 1.55, margin: 0, whiteSpace: 'pre-wrap' }}>{deleteError}</p>
          </div>
          <button onClick={() => setDeleteError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#DC2626', flexShrink: 0 }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Empty state */}
      {children.length === 0 && (
        <EmptyState
          title="Comece pela parte boa"
          subtitle="Cadastre seu primeiro filho para começar a organizar a rotina da família."
          actionLabel={canEdit ? '+ Adicionar filho' : undefined}
          onAction={canEdit ? openNew : undefined}
          showIaShortcut={false}
        />
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

              {canEdit && (
                <div className="flex gap-1.5 flex-none">
                  <button onClick={() => openEdit(child)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                    style={{ background: 'rgba(61,102,65,0.10)', color: '#3D6641' }}>
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => handleDelete(child.id, child.name)}
                    disabled={deleting === child.id}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                    style={{
                      background: 'rgba(220,38,38,0.08)', color: '#DC2626',
                      opacity: deleting === child.id ? 0.5 : 1,
                      cursor: deleting === child.id ? 'wait' : 'pointer',
                    }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
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
              onClear={() => { revokeBlobUrl(); setPhotoFile(null); setPhotoPreview(null) }}
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
