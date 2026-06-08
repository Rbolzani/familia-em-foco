'use client'
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Child } from '@/lib/types'
import Button from '@/components/ui/Button'
import { CategoryBadge } from '@/components/ui/Badge'
import { Sparkles, Upload, FileText, Camera, Check, X, Loader2, Clock, MapPin } from 'lucide-react'

interface ExtractedActivity {
  title: string
  category: 'escola' | 'saude' | 'extracurricular'
  date: string | null
  time: string | null
  description: string | null
  location: string | null
  selected: boolean
  child_id: string
}

const catAccent = { escola: '#2563EB', saude: '#00C48C', extracurricular: '#7C3AED' }

export default function IAPage() {
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [children, setChildren] = useState<Child[]>([])
  const [mode, setMode] = useState<'text' | 'image'>('image')
  const [text, setText] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [extracted, setExtracted] = useState<ExtractedActivity[] | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('children').select('*').order('sort_order').then(({ data }) => setChildren(data ?? []))
  }, [])

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) { setError('Selecione apenas imagens.'); return }
    setImage(file); setImagePreview(URL.createObjectURL(file)); setExtracted(null); setError('')
  }

  async function handleExtract() {
    setLoading(true); setError(''); setExtracted(null)
    try {
      const fd = new FormData()
      if (mode === 'image' && image) fd.append('image', image)
      else {
        if (!text.trim()) { setError('Digite algo para analisar.'); setLoading(false); return }
        fd.append('text', text)
      }
      const res = await fetch('/api/ai-extract', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro desconhecido')
      const defaultChildId = children[0]?.id ?? ''
      const activities: ExtractedActivity[] = (data.activities ?? []).map((a: any) => ({ ...a, selected: true, child_id: defaultChildId }))
      setExtracted(activities)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!extracted) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const toSave = extracted
      .filter(a => a.selected && a.date && a.child_id)
      .map(a => ({
        user_id: user!.id, child_id: a.child_id, category: a.category,
        title: a.title, description: a.description, date: a.date!,
        time: a.time, location: a.location, ai_generated: true, alert_days: 3,
      }))
    if (toSave.length === 0) { setSaving(false); return }
    const { error } = await supabase.from('activities').insert(toSave)
    if (error) { setError(error.message); setSaving(false); return }
    setSaved(true); setSaving(false)
    setTimeout(() => { setSaved(false); setExtracted(null); setImage(null); setImagePreview(null); setText('') }, 2500)
  }

  function toggleSelect(i: number) {
    setExtracted(prev => prev!.map((a, idx) => idx === i ? { ...a, selected: !a.selected } : a))
  }
  function setChildForActivity(i: number, childId: string) {
    setExtracted(prev => prev!.map((a, idx) => idx === i ? { ...a, child_id: childId } : a))
  }

  const selectedCount = extracted?.filter(a => a.selected && a.date).length ?? 0

  if (saved) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FDF8F2' }}>
        <div className="text-center animate-scale-in">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5"
            style={{ background: 'linear-gradient(135deg,#00C48C,#00A876)', boxShadow: '0 12px 32px rgba(0,196,140,.3)' }}>
            <Check size={36} color="white" strokeWidth={3} />
          </div>
          <h2 className="font-fraunces text-2xl font-bold mb-1" style={{ color: '#0F1F3D' }}>
            Atividades salvas!
          </h2>
          <p className="text-sm" style={{ color: '#8B7A68' }}>Tudo organizado ✨</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

      {/* Header */}
      <div className="animate-fade-up">
        <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: '#F4522D' }}>
          ✨ Inteligência Artificial
        </p>
        <h1 className="font-fraunces text-3xl font-bold" style={{ color: '#0F1F3D' }}>
          Adicionar com IA
        </h1>
        <p className="text-sm mt-0.5" style={{ color: '#8B7A68' }}>
          Envie uma foto ou texto — a IA extrai as atividades automaticamente.
        </p>
      </div>

      {/* AI CTA banner */}
      <div
        className="card animate-fade-up overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#0F1F3D,#1D3461)', border: 'none', padding: '16px 20px' }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-none"
            style={{ background: 'linear-gradient(135deg,#F4522D,#F5A623)', boxShadow: '0 4px 16px rgba(244,82,45,.4)' }}>
            <Sparkles size={22} color="white" />
          </div>
          <div>
            <div className="font-fraunces text-base font-bold text-white">Claude IA</div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,.5)' }}>
              Foto da agenda escolar, anotações à mão, print ou texto livre
            </div>
          </div>
        </div>
      </div>

      {/* Mode selector */}
      <div className="card p-1.5 flex gap-1.5 animate-fade-up" style={{ padding: '6px' }}>
        {[
          { key: 'image', label: 'Foto / Imagem', icon: Camera },
          { key: 'text',  label: 'Texto livre',   icon: FileText },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => { setMode(key as 'text' | 'image'); setExtracted(null); setError('') }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={mode === key
              ? { background: 'linear-gradient(135deg,#F4522D,#D93D1A)', color: '#fff', boxShadow: '0 4px 12px rgba(244,82,45,.3)' }
              : { color: '#8B7A68', background: 'transparent' }
            }
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* Image upload */}
      {mode === 'image' && (
        <div
          className="card animate-fade-up cursor-pointer transition-all"
          style={{ border: `2px dashed ${imagePreview ? '#F4522D' : '#EDE4D6'}`, textAlign: 'center', padding: '32px 20px' }}
          onClick={() => fileRef.current?.click()}
          onDrop={e => { e.preventDefault(); e.dataTransfer.files[0] && handleFile(e.dataTransfer.files[0]) }}
          onDragOver={e => e.preventDefault()}
        >
          {imagePreview ? (
            <div>
              <img src={imagePreview} alt="Preview" className="max-h-60 mx-auto rounded-2xl object-contain shadow-lg" />
              <p className="text-xs font-semibold mt-3" style={{ color: '#F4522D' }}>
                Clique para trocar a imagem
              </p>
            </div>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ background: '#FFF0EB' }}>
                <Upload size={26} style={{ color: '#F4522D' }} />
              </div>
              <p className="font-bold text-sm mb-1" style={{ color: '#0F1F3D' }}>
                Clique ou arraste uma imagem
              </p>
              <p className="text-xs" style={{ color: '#8B7A68' }}>
                Agenda escolar, anotações à mão, prints de tela...
              </p>
            </>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>
      )}

      {/* Text input */}
      {mode === 'text' && (
        <div className="card animate-fade-up" style={{ padding: '16px' }}>
          <label className="block text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: '#0F1F3D' }}>
            Digite ou cole o texto
          </label>
          <textarea
            value={text} onChange={e => setText(e.target.value)} rows={6}
            placeholder="Ex: Prova de matemática dia 15/06, consulta pediatra 20/06 às 14h, futebol toda terça e quinta..."
            className="input-field w-full resize-none"
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-xs font-semibold px-4 py-3 rounded-xl animate-fade-up"
          style={{ background: '#FFF0EB', color: '#F4522D', border: '1px solid #FDD5C9' }}>
          ⚠ {error}
        </div>
      )}

      {/* Extract button */}
      <button
        onClick={handleExtract}
        disabled={loading || (mode === 'image' ? !image : !text.trim())}
        className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-base font-bold text-white transition-all hover:brightness-105 active:scale-95 disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg,#F4522D,#D93D1A)', boxShadow: '0 6px 20px rgba(244,82,45,.35)' }}
      >
        {loading
          ? <><Loader2 size={18} className="animate-spin" /> Analisando com IA...</>
          : <><Sparkles size={18} /> Extrair atividades com IA</>
        }
      </button>

      {/* Results */}
      {extracted !== null && (
        <div className="space-y-4 animate-fade-up">
          <div className="flex items-center justify-between">
            <h2 className="font-fraunces text-xl font-bold" style={{ color: '#0F1F3D' }}>
              {extracted.length === 0 ? 'Nenhuma atividade encontrada' : `${extracted.length} atividade${extracted.length > 1 ? 's' : ''} encontrada${extracted.length > 1 ? 's' : ''}`}
            </h2>
            {extracted.length > 0 && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: '#FFF8E6', color: '#D97706' }}>
                {selectedCount} selecionada{selectedCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {extracted.length === 0 && (
            <div className="card p-6 text-center" style={{ border: '2px dashed #EDE4D6' }}>
              <div className="text-3xl mb-2">🤔</div>
              <p className="text-sm" style={{ color: '#8B7A68' }}>
                Nenhuma atividade identificada. Tente com uma imagem mais clara ou texto mais detalhado.
              </p>
            </div>
          )}

          <div className="space-y-3 stagger">
            {extracted.map((a, i) => {
              const accent = catAccent[a.category] ?? '#8B7A68'
              return (
                <div
                  key={i}
                  className="card animate-fade-up transition-all"
                  style={{ animationDelay: `${i * 0.05}s`, opacity: a.selected ? 1 : .5, padding: '14px 16px' }}
                >
                  <div className="flex items-start gap-3">
                    {/* Select toggle */}
                    <button
                      onClick={() => toggleSelect(i)}
                      className="mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-none transition-all hover:scale-110"
                      style={a.selected
                        ? { background: accent, borderColor: accent, color: '#fff' }
                        : { borderColor: '#EDE4D6' }
                      }
                    >
                      {a.selected && <Check size={12} strokeWidth={3} />}
                    </button>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm" style={{ color: '#0F1F3D' }}>{a.title}</span>
                        <CategoryBadge category={a.category} />
                      </div>

                      <div className="flex gap-3 flex-wrap">
                        {a.date && (
                          <span className="text-xs font-medium" style={{ color: '#8B7A68' }}>📅 {a.date}</span>
                        )}
                        {a.time && (
                          <span className="text-xs flex items-center gap-1" style={{ color: '#8B7A68' }}>
                            <Clock size={11} /> {a.time}
                          </span>
                        )}
                        {a.location && (
                          <span className="text-xs flex items-center gap-1" style={{ color: '#8B7A68' }}>
                            <MapPin size={11} /> {a.location}
                          </span>
                        )}
                      </div>

                      {a.description && (
                        <p className="text-xs" style={{ color: '#C4B5A5' }}>{a.description}</p>
                      )}

                      {!a.date && (
                        <div className="text-xs font-semibold px-2.5 py-1.5 rounded-lg inline-block"
                          style={{ background: '#FFF8E6', color: '#D97706' }}>
                          ⚠️ Data não identificada — edite depois de salvar
                        </div>
                      )}

                      {/* Child selector */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold" style={{ color: '#8B7A68' }}>Filho(a):</span>
                        <select
                          value={a.child_id}
                          onChange={e => setChildForActivity(i, e.target.value)}
                          className="text-xs rounded-xl px-2.5 py-1 border focus:outline-none transition-colors"
                          style={{ borderColor: '#EDE4D6', color: '#0F1F3D', background: '#FDF8F2' }}
                        >
                          {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleSelect(i)}
                      className="flex-none w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                      style={{ background: '#FFF0EB', color: '#F4522D' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {selectedCount > 0 && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold text-white transition-all hover:brightness-105 active:scale-95 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#00C48C,#00A876)', boxShadow: '0 6px 20px rgba(0,196,140,.3)' }}
            >
              {saving
                ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Salvando...</>
                : <><Check size={17} /> Salvar {selectedCount} atividade{selectedCount > 1 ? 's' : ''}</>
              }
            </button>
          )}
        </div>
      )}
    </div>
  )
}
