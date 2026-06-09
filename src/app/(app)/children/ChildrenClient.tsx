'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Child } from '@/lib/types'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { Baby, Plus, Pencil, Trash2, GraduationCap, Cake, Camera, X } from 'lucide-react'

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
function PhotoPicker({ preview, onFile, onClear }: {
  preview: string | null; onFile: (f: File)=>void; onClear: ()=>void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div className="flex items-center gap-4">
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          width: 80, height: 80, borderRadius: 18, overflow: 'hidden', cursor: 'pointer', flexShrink: 0,
          background: preview ? 'transparent' : 'rgba(61,102,65,0.07)',
          border: '2px dashed rgba(61,102,65,0.30)', position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
        {preview ? (
          <img src={preview} alt="preview" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        ) : (
          <Camera size={28} color="rgba(61,102,65,0.45)" />
        )}
        {/* camera overlay on hover */}
        <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.28)',
          display:'flex', alignItems:'center', justifyContent:'center', opacity:0, transition:'opacity .2s' }}
          className="hover:opacity-100">
          <Camera size={20} color="white" />
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f=e.target.files?.[0]; if(f){onFile(f)} }} />
      <div className="flex flex-col gap-1.5">
        <button type="button" onClick={() => inputRef.current?.click()}
          className="text-xs font-bold px-3 py-1.5 rounded-lg"
          style={{ background:'rgba(61,102,65,0.10)', color:'#3D6641', border:'1px solid rgba(61,102,65,0.20)' }}>
          {preview ? 'Trocar foto' : 'Escolher foto'}
        </button>
        {preview && (
          <button type="button" onClick={onClear}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1"
            style={{ background:'rgba(220,38,38,0.07)', color:'#DC2626', border:'1px solid rgba(220,38,38,0.15)' }}>
            <X size={11}/> Remover foto
          </button>
        )}
        <p className="text-[10px]" style={{ color:'rgba(26,43,28,0.35)' }}>JPG, PNG • máx 5 MB</p>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────
interface Props { initialChildren: Child[] }

export default function ChildrenClient({ initialChildren }: Props) {
  const supabase = createClient()
  const [children, setChildren] = useState<Child[]>(initialChildren)
  const [modal, setModal] = useState<{ mode:'new'|'edit'; child?: Child }|null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name:'', birth_date:'', school_name:'', avatar_color: AVATAR_COLORS[0] })
  const [photoFile, setPhotoFile] = useState<File|null>(null)
  const [photoPreview, setPhotoPreview] = useState<string|null>(null)

  async function load() {
    const { data } = await supabase.from('children').select('*').order('sort_order')
    setChildren(data ?? [])
  }

  function openNew() {
    setForm({ name:'', birth_date:'', school_name:'', avatar_color: AVATAR_COLORS[0] })
    setPhotoFile(null); setPhotoPreview(null)
    setModal({ mode:'new' })
  }
  function openEdit(child: Child) {
    setForm({ name:child.name, birth_date:child.birth_date??'', school_name:child.school_name??'', avatar_color:child.avatar_color })
    setPhotoFile(null)
    setPhotoPreview(child.avatar_url ?? null)
    setModal({ mode:'edit', child })
  }

  async function uploadPhoto(userId: string, childId: string): Promise<string|null> {
    if (!photoFile) return null
    const ext   = photoFile.name.split('.').pop() ?? 'jpg'
    const path  = `${userId}/${childId}_${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, photoFile, { upsert:true })
    if (error) return null
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    return publicUrl
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    if (modal?.mode === 'new') {
      // Insert first to get the ID, then upload photo
      const { data: inserted } = await supabase.from('children').insert({
        user_id: user.id,
        name: form.name.trim(),
        birth_date: form.birth_date || null,
        school_name: form.school_name.trim() || null,
        avatar_color: form.avatar_color,
        sort_order: children.length,
      }).select().single()

      if (inserted && photoFile) {
        const url = await uploadPhoto(user.id, inserted.id)
        if (url) await supabase.from('children').update({ avatar_url: url }).eq('id', inserted.id)
      }
    } else {
      const child = modal!.child!
      // If photoPreview is null and original had a photo → user removed it
      const avatar_url = photoFile
        ? await uploadPhoto(user.id, child.id)
        : photoPreview   // null if cleared, existing URL otherwise
      await supabase.from('children').update({
        name: form.name.trim(),
        birth_date: form.birth_date || null,
        school_name: form.school_name.trim() || null,
        avatar_color: form.avatar_color,
        avatar_url,
      }).eq('id', child.id)
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
          <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color:'#3D6641' }}>Perfis</p>
          <h1 style={{ fontFamily:'var(--font-lora)', fontSize:30, fontWeight:700, color:'#1A2B1C', lineHeight:1.1 }}>Meus Filhos</h1>
          <p className="text-sm mt-1" style={{ color:'rgba(26,43,28,0.45)' }}>
            {children.length > 0
              ? `${children.length} filho${children.length>1?'s':''} cadastrado${children.length>1?'s':''}`
              : 'Adicione os perfis dos seus filhos'}
          </p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold text-white transition-all hover:brightness-105 active:scale-95"
          style={{ background:'linear-gradient(140deg,#3D6641,#2C4A2E)', boxShadow:'0 4px 16px rgba(44,74,46,0.30)' }}>
          <Plus size={16}/> Adicionar
        </button>
      </div>

      {/* Empty state */}
      {children.length === 0 && (
        <div className="card p-10 text-center animate-fade-up" style={{ border:'2px dashed #EDE4D6' }}>
          <div className="text-5xl mb-4 animate-float">👶</div>
          <h3 style={{ fontFamily:'var(--font-lora)', fontSize:20, fontWeight:700, color:'#1A2B1C', marginBottom:8 }}>Nenhum filho cadastrado</h3>
          <p className="text-sm mb-5" style={{ color:'rgba(26,43,28,0.45)' }}>Adicione seu primeiro filho para começar a organizar a rotina.</p>
          <button onClick={openNew}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white transition-all hover:brightness-105 active:scale-95"
            style={{ background:'linear-gradient(140deg,#3D6641,#2C4A2E)', boxShadow:'0 4px 14px rgba(44,74,46,0.28)' }}>
            <Plus size={15}/> Adicionar filho
          </button>
        </div>
      )}

      {/* List */}
      {children.length > 0 && (
        <div className="space-y-3 stagger">
          {children.map((child, i) => (
            <div key={child.id}
              className="card card-lift animate-fade-up p-4 flex items-center gap-4"
              style={{ animationDelay:`${i*0.06}s` }}>

              <ChildAvatar child={child} size={56} radius={16} />

              <div className="flex-1 min-w-0">
                <div style={{ fontSize:16, fontWeight:700, color:'#1A2B1C' }}>{child.name}</div>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  {child.birth_date && (
                    <span className="text-xs flex items-center gap-1 font-medium" style={{ color:'rgba(26,43,28,0.50)' }}>
                      <Cake size={12}/> {calcAge(child.birth_date)}
                    </span>
                  )}
                  {child.school_name && (
                    <span className="text-xs flex items-center gap-1 font-medium" style={{ color:'rgba(26,43,28,0.50)' }}>
                      <GraduationCap size={12}/> {child.school_name}
                    </span>
                  )}
                  {!child.birth_date && !child.school_name && (
                    <span className="text-xs italic" style={{ color:'rgba(26,43,28,0.30)' }}>Sem informações adicionais</span>
                  )}
                </div>
              </div>

              <div className="flex gap-1.5 flex-none">
                <button onClick={() => openEdit(child)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                  style={{ background:'rgba(61,102,65,0.10)', color:'#3D6641' }}>
                  <Pencil size={15}/>
                </button>
                <button onClick={() => handleDelete(child.id, child.name)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                  style={{ background:'rgba(220,38,38,0.08)', color:'#DC2626' }}>
                  <Trash2 size={15}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal open={!!modal} onClose={() => setModal(null)}
        title={modal?.mode==='new' ? '👶 Adicionar filho' : '✏️ Editar filho'} size="sm">
        <div className="space-y-5">

          {/* Photo picker */}
          <div>
            <label className="block text-xs font-bold mb-2 uppercase tracking-wide" style={{ color:'rgba(26,43,28,0.55)' }}>Foto</label>
            <PhotoPicker
              preview={photoPreview}
              onFile={f => {
                setPhotoFile(f)
                // FileReader → data URL (universally supported on iOS/Android)
                const reader = new FileReader()
                reader.onload = e => setPhotoPreview(e.target?.result as string ?? null)
                reader.readAsDataURL(f)
              }}
              onClear={() => { setPhotoFile(null); setPhotoPreview(null) }}
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color:'rgba(26,43,28,0.55)' }}>Nome *</label>
            <input type="text" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}
              placeholder="Nome do filho(a)" className="input-field w-full" autoFocus />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color:'rgba(26,43,28,0.55)' }}>Data de nascimento</label>
            <input type="date" value={form.birth_date} onChange={e=>setForm(f=>({...f,birth_date:e.target.value}))}
              className="input-field w-full" />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color:'rgba(26,43,28,0.55)' }}>Escola</label>
            <input type="text" value={form.school_name} onChange={e=>setForm(f=>({...f,school_name:e.target.value}))}
              placeholder="Nome da escola" className="input-field w-full" />
          </div>

          <div>
            <label className="block text-xs font-bold mb-2 uppercase tracking-wide" style={{ color:'rgba(26,43,28,0.55)' }}>Cor do avatar</label>
            <div className="flex gap-2.5 flex-wrap">
              {AVATAR_COLORS.map(color => (
                <button key={color} type="button" onClick={() => setForm(f=>({...f,avatar_color:color}))}
                  className="w-9 h-9 rounded-xl transition-all hover:scale-110"
                  style={{ background:color,
                    boxShadow:form.avatar_color===color?`0 0 0 3px white,0 0 0 5px ${color}`:'none',
                    transform:form.avatar_color===color?'scale(1.15)':'scale(1)' }} />
              ))}
            </div>
            {/* Preview */}
            <div className="mt-3 flex items-center gap-3 p-3 rounded-xl" style={{ background:'rgba(61,102,65,0.06)' }}>
              <div style={{ width:40, height:40, borderRadius:12, overflow:'hidden', flexShrink:0,
                background: photoPreview ? 'transparent' : form.avatar_color,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontFamily:'var(--font-lora)', fontWeight:700, fontSize:17, color:'white' }}>
                {photoPreview
                  ? <img src={photoPreview} alt="preview" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                  : (form.name.charAt(0).toUpperCase() || '?')}
              </div>
              <div style={{ fontSize:14, fontWeight:600, color:'#1A2B1C' }}>{form.name || 'Nome do filho'}</div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setModal(null)} style={{ flex:1 }}>Cancelar</Button>
            <button
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
              style={{
                flex: 2,
                padding: '12px 20px',
                borderRadius: 14,
                border: 'none',
                cursor: saving || !form.name.trim() ? 'not-allowed' : 'pointer',
                background: saving || !form.name.trim()
                  ? 'rgba(61,102,65,0.25)'
                  : 'linear-gradient(140deg,#3D6641,#2C4A2E)',
                color: 'white',
                fontSize: 15,
                fontWeight: 700,
                boxShadow: saving || !form.name.trim() ? 'none' : '0 4px 16px rgba(44,74,46,0.35)',
                transition: 'all .2s',
              }}>
              {saving ? 'Salvando…' : modal?.mode === 'new' ? '✓ Adicionar filho' : '✓ Salvar alterações'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
