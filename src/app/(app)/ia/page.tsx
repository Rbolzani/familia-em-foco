'use client'
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Child } from '@/lib/types'
import {
  Sparkles, Upload, FileText, Camera, Check, X, Loader2,
  Clock, MapPin, BookOpen, HeartPulse, Trophy, Plus,
} from 'lucide-react'

// ── Musgo design tokens ───────────────────────────────────────────────────
const NOISE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`

const CARD: React.CSSProperties = {
  borderRadius: '17px 11px 15px 13px',
  background: `${NOISE}, linear-gradient(160deg,#FFFFFF 0%,#FAFAF7 100%)`,
  backgroundSize: '200px 200px, 100% 100%',
  border: '1px solid rgba(61,102,65,0.22)',
  boxShadow: '0 4px 16px rgba(44,74,46,0.10),0 1px 4px rgba(44,74,46,0.07),0 -1px 0 rgba(255,255,255,0.85) inset',
}

const CAT_CONFIG = {
  escola:          { label:'Escola',         icolor:'#2563EB', ibg:'linear-gradient(140deg,#DBEAFE,#BFDBFE)', icon:BookOpen  },
  saude:           { label:'Saúde',          icolor:'#065F46', ibg:'linear-gradient(140deg,#D1FAE5,#A7F3D0)', icon:HeartPulse},
  extracurricular: { label:'Extracurricular',icolor:'#92400E', ibg:'linear-gradient(140deg,#FEF3C7,#FDE68A)', icon:Trophy    },
}
type CatKey = keyof typeof CAT_CONFIG

interface ExtractedActivity {
  title: string
  category: CatKey
  date: string | null
  time: string | null
  description: string | null
  location: string | null
  selected: boolean
  child_ids: string[]   // multi-child support
}

export default function IAPage() {
  const supabase  = createClient()
  const fileRef   = useRef<HTMLInputElement>(null)
  const [children, setChildren]         = useState<Child[]>([])
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([])
  const [mode, setMode]                 = useState<'image' | 'text'>('image')
  const [images, setImages]             = useState<File[]>([])
  const [previews, setPreviews]         = useState<string[]>([])
  const [text, setText]                 = useState('')
  const [loading, setLoading]           = useState(false)
  const [extracted, setExtracted]       = useState<ExtractedActivity[] | null>(null)
  const [saving, setSaving]             = useState(false)
  const [saved, setSaved]               = useState(false)
  const [error, setError]               = useState('')
  const [pasteHint, setPasteHint]       = useState(false)
  const [pasteZoneFocused, setPasteZoneFocused] = useState(false)
  const pasteZoneRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.from('children').select('*').order('sort_order').then(({ data }) => {
      setChildren(data ?? [])
      if (data?.[0]) setSelectedChildIds([data[0].id])
    })
  }, [])


  function toggleDefaultChild(childId: string) {
    setSelectedChildIds(prev => {
      const next = prev.includes(childId)
        ? prev.filter(id => id !== childId)
        : [...prev, childId]
      // At least one must always be selected
      if (next.length === 0) return prev
      // If extraction already done, update child_ids on all extracted items
      if (extracted) {
        setExtracted(ex => ex!.map(a => ({ ...a, child_ids: next })))
      }
      return next
    })
  }

  function addFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (arr.length === 0) { setError('Selecione apenas imagens (PNG, JPG, WEBP, GIF).'); return }
    setImages(prev => [...prev, ...arr])
    arr.forEach(f => {
      const url = URL.createObjectURL(f)
      setPreviews(prev => [...prev, url])
    })
    setExtracted(null); setError('')
  }

  function removeImage(idx: number) {
    setImages(prev  => prev.filter((_,i)=>i!==idx))
    setPreviews(prev => prev.filter((_,i)=>i!==idx))
  }

  async function handleExtract() {
    setLoading(true); setError(''); setExtracted(null)
    try {
      let allActivities: ExtractedActivity[] = []

      if (mode === 'image') {
        if (images.length === 0) { setError('Adicione pelo menos uma imagem.'); setLoading(false); return }

        // Process each image independently and merge results
        for (const img of images) {
          const fd = new FormData()
          fd.append('image', img)
          const res  = await fetch('/api/ai-extract', { method:'POST', body:fd })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'Erro ao processar imagem')
          const acts: ExtractedActivity[] = (data.activities ?? []).map((a: any) => ({
            ...a, selected: true, child_ids: selectedChildIds,
          }))
          allActivities = [...allActivities, ...acts]
        }
      } else {
        if (!text.trim()) { setError('Digite algo para analisar.'); setLoading(false); return }
        const fd = new FormData()
        fd.append('text', text)
        const res  = await fetch('/api/ai-extract', { method:'POST', body:fd })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erro desconhecido')
        allActivities = (data.activities ?? []).map((a: any) => ({ ...a, selected:true, child_ids:selectedChildIds }))
      }

      setExtracted(allActivities)
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
    // For each selected activity, create one row per child_id
    const toSave = extracted
      .filter(a => a.selected && a.child_ids.length > 0)
      .flatMap(a => a.child_ids.map(child_id => ({
        user_id: user!.id, child_id, category: a.category,
        title: a.title, description: a.description, date: a.date ?? null,
        time: a.time, location: a.location, ai_generated: true, alert_days: 3,
      })))
    if (toSave.length === 0) { setSaving(false); return }
    const { error: saveErr } = await supabase.from('activities').insert(toSave)
    if (saveErr) { setError(saveErr.message); setSaving(false); return }
    setSaved(true); setSaving(false)
    setTimeout(() => { setSaved(false); setExtracted(null); setImages([]); setPreviews([]); setText('') }, 2500)
  }

  function toggleSelect(i: number) {
    setExtracted(prev => prev!.map((a,idx) => idx===i ? {...a, selected:!a.selected} : a))
  }
  function toggleChildForActivity(i: number, childId: string) {
    setExtracted(prev => prev!.map((a,idx) => {
      if (idx !== i) return a
      const ids = a.child_ids.includes(childId)
        ? a.child_ids.filter(id => id !== childId)
        : [...a.child_ids, childId]
      return { ...a, child_ids: ids.length > 0 ? ids : a.child_ids }
    }))
  }

  // Total rows that will be saved (1 per activity × number of selected children)
  const selectedCount = extracted?.filter(a => a.selected)
    .reduce((sum, a) => sum + a.child_ids.length, 0) ?? 0

  // ── Success screen ─────────────────────────────────────────────────────
  if (saved) {
    return (
      <div className="min-h-screen flex items-center justify-center musgo-bg">
        <div className="text-center animate-scale-in">
          <div className="w-20 h-20 rounded-[24px] flex items-center justify-center mx-auto mb-5"
            style={{ background:'linear-gradient(140deg,#3D6641,#2C4A2E)', boxShadow:'0 12px 32px rgba(44,74,46,.30)' }}>
            <Check size={36} color="#D4E8D5" strokeWidth={3} />
          </div>
          <h2 style={{ fontFamily:'var(--font-lora)', fontSize:28, fontWeight:700, color:'#1A2B1C' }}>
            Atividades salvas!
          </h2>
          <p className="text-sm mt-2 italic" style={{ color:'rgba(26,43,28,0.50)' }}>Tudo organizado ✨</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-8 space-y-5">

      {/* ── Header ── */}
      <div className="animate-fade-up">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] mb-2 flex items-center gap-2"
          style={{ color:'#5A8C5E' }}>
          <span className="inline-block w-4 h-[2px] rounded" style={{ background:'linear-gradient(90deg,#5A8C5E,#C49A6C)' }} />
          Inteligência Artificial
        </p>
        <h1 style={{ fontFamily:'var(--font-lora)', fontSize:34, fontWeight:700, color:'#1A2B1C', letterSpacing:'-0.02em', lineHeight:1.15 }}>
          Adicionar com IA
        </h1>
        <p className="text-sm mt-1 italic" style={{ color:'rgba(26,43,28,0.50)' }}>
          Envie uma foto ou texto — a IA extrai as atividades automaticamente.
        </p>
      </div>

      {/* ── AI Banner ── */}
      <div className="animate-fade-up overflow-hidden relative"
        style={{ borderRadius:'20px 13px 18px 15px', padding:'18px 20px', background:'linear-gradient(140deg,#2C4A2E 0%,#1E3320 100%)', border:'1px solid rgba(44,74,46,0.35)', boxShadow:'0 8px 28px rgba(44,74,46,0.28),0 -1px 0 rgba(255,255,255,0.12) inset' }}>
        <div className="absolute pointer-events-none" style={{ top:-12, right:-8, width:80, height:80, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }} />
        <div className="flex items-center gap-4 relative">
          <div className="w-12 h-12 rounded-[15px] flex items-center justify-center flex-none"
            style={{ background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.18)', boxShadow:'0 4px 14px rgba(0,0,0,0.20)' }}>
            <Sparkles size={22} color="#D4E8D5" />
          </div>
          <div>
            <div style={{ fontFamily:'var(--font-lora)', fontSize:16, fontWeight:700, color:'#D4E8D5' }}>Claude IA</div>
            <div style={{ fontSize:'12px', color:'rgba(212,232,213,0.60)', fontStyle:'italic' }}>
              Foto da agenda escolar, anotações à mão, print ou texto livre
            </div>
          </div>
        </div>
      </div>

      {/* ── Child Selector (multi-select) ── */}
      {children.length > 0 && (
        <div className="animate-fade-up" style={{ ...CARD, padding:'16px 18px' }}>
          <label style={{ display:'block', fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.10em', color:'rgba(26,43,28,0.50)', marginBottom:4 }}>
            As atividades são para qual filho?
          </label>
          <p style={{ fontSize:11, color:'rgba(26,43,28,0.38)', fontStyle:'italic', marginBottom:10 }}>
            Selecione um ou mais filhos — cada atividade será salva para todos os selecionados.
          </p>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            {children.map(c => {
              const isSelected = selectedChildIds.includes(c.id)
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleDefaultChild(c.id)}
                  style={{
                    display:'flex', alignItems:'center', gap:8,
                    padding:'8px 14px', borderRadius:12, cursor:'pointer',
                    border:`2px solid ${isSelected ? c.avatar_color : 'rgba(61,102,65,0.18)'}`,
                    background: isSelected ? `${c.avatar_color}14` : 'rgba(255,255,255,0.70)',
                    transition:'all .18s',
                    boxShadow: isSelected ? `0 0 0 1px ${c.avatar_color}40, 0 2px 8px ${c.avatar_color}22` : 'none',
                  }}
                >
                  <span style={{
                    width:28, height:28, borderRadius:'50%', flexShrink:0, display:'flex',
                    alignItems:'center', justifyContent:'center',
                    background: c.avatar_color,
                    fontFamily:'var(--font-lora)', fontWeight:700, fontSize:13, color:'white',
                  }}>
                    {c.name.charAt(0).toUpperCase()}
                  </span>
                  <span style={{ fontSize:13, fontWeight:700, color: isSelected ? c.avatar_color : '#1A2B1C' }}>
                    {c.name}
                  </span>
                  {isSelected && <Check size={13} strokeWidth={3} style={{ color: c.avatar_color, marginLeft:2 }} />}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Mode Selector ── */}
      <div className="animate-fade-up p-[6px] flex gap-1.5"
        style={{ ...CARD, padding:6 }}>
        {[
          { key:'image', label:'Foto / Imagem', icon:Camera   },
          { key:'text',  label:'Texto livre',   icon:FileText },
        ].map(({ key, label, icon:Icon }) => (
          <button key={key}
            onClick={() => { setMode(key as 'image'|'text'); setExtracted(null); setError('') }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[12px] text-sm font-bold transition-all"
            style={mode===key
              ? { background:'linear-gradient(140deg,#3D6641,#2C4A2E)', color:'#D4E8D5', boxShadow:'0 4px 12px rgba(44,74,46,0.28)' }
              : { color:'rgba(26,43,28,0.50)', background:'transparent' }
            }>
            <Icon size={15}/> {label}
          </button>
        ))}
      </div>

      {/* ── Image Upload ── */}
      {mode === 'image' && (
        <div className="animate-fade-up space-y-3">
          {/* File upload drop zone */}
          <div
            className="cursor-pointer transition-all relative"
            style={{ ...CARD, textAlign:'center', padding:'24px 20px',
              borderStyle:'dashed', borderWidth:2,
              borderColor: images.length > 0 ? 'rgba(61,102,65,0.40)' : 'rgba(61,102,65,0.22)',
            }}
            onClick={() => fileRef.current?.click()}
            onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files) }}
            onDragOver={e => e.preventDefault()}>
            <div className="w-12 h-12 rounded-[16px] flex items-center justify-center mx-auto mb-2"
              style={{ backgroundImage:'linear-gradient(140deg,#D1FAE5,#A7F3D0)', border:'1px solid rgba(0,0,0,0.06)' }}>
              <Upload size={20} color="#3D6641" />
            </div>
            <p className="font-bold text-sm mb-0.5" style={{ color:'#1A2B1C' }}>
              Clique ou arraste imagens aqui
            </p>
            <p className="text-xs italic" style={{ color:'rgba(26,43,28,0.45)' }}>
              Agenda escolar, anotações à mão, prints — vários arquivos permitidos
            </p>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
              onChange={e => e.target.files && addFiles(e.target.files)} />
          </div>

          {/* ── Paste zone — click to focus, then Ctrl+V ── */}
          <div
            ref={pasteZoneRef}
            tabIndex={0}
            role="button"
            aria-label="Área de colagem — clique aqui e pressione Ctrl+V"
            onClick={() => pasteZoneRef.current?.focus()}
            onFocus={() => setPasteZoneFocused(true)}
            onBlur={() => { setPasteZoneFocused(false); setPasteHint(false) }}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') pasteZoneRef.current?.focus() }}
            onPaste={e => {
              e.preventDefault()
              const items = Array.from(e.clipboardData?.items ?? [])
              const imageItems = items.filter(it => it.type.startsWith('image/'))
              if (imageItems.length === 0) {
                setError('Nenhuma imagem no clipboard. Faça um print (Win+Shift+S ou PrintScreen) antes de colar.')
                return
              }
              const files = imageItems.map(it => it.getAsFile()).filter(Boolean) as File[]
              addFiles(files)
              setPasteHint(true)
              setTimeout(() => { setPasteHint(false); pasteZoneRef.current?.blur() }, 1500)
            }}
            style={{
              ...CARD,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '20px',
              cursor: 'pointer',
              outline: 'none',
              borderWidth: 2,
              borderStyle: 'solid',
              borderColor: pasteHint
                ? '#3D6641'
                : pasteZoneFocused
                  ? 'rgba(61,102,65,0.60)'
                  : 'rgba(61,102,65,0.22)',
              background: pasteHint
                ? 'linear-gradient(140deg,#D1FAE5,#FAFAF7)'
                : pasteZoneFocused
                  ? 'linear-gradient(140deg,rgba(61,102,65,0.07),rgba(61,102,65,0.03))'
                  : undefined,
              transition: 'border-color .2s, background .2s',
              boxShadow: pasteZoneFocused
                ? '0 0 0 3px rgba(61,102,65,0.15), 0 4px 16px rgba(44,74,46,0.10)'
                : undefined,
            }}>
            {pasteHint ? (
              <>
                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background:'linear-gradient(140deg,#3D6641,#2C4A2E)' }}>
                  <Check size={20} color="#D4E8D5" strokeWidth={3}/>
                </div>
                <p className="font-bold text-sm" style={{ color:'#3D6641' }}>Imagem colada!</p>
              </>
            ) : pasteZoneFocused ? (
              <>
                <div className="w-10 h-10 rounded-full flex items-center justify-center animate-pulse"
                  style={{ background:'rgba(61,102,65,0.15)', border:'2px solid rgba(61,102,65,0.35)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3D6641" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="2" width="6" height="4" rx="1"/><path d="M9 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-2"/>
                  </svg>
                </div>
                <p className="font-bold text-sm" style={{ color:'#3D6641' }}>Pronto! Pressione Ctrl+V agora</p>
                <p className="text-xs italic" style={{ color:'rgba(26,43,28,0.45)' }}>A imagem do clipboard será carregada</p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3D6641" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="2" width="6" height="4" rx="1"/><path d="M9 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-2"/>
                  </svg>
                  <span className="font-bold text-sm" style={{ color:'#1A2B1C' }}>Colar captura de tela</span>
                </div>
                <p className="text-xs italic" style={{ color:'rgba(26,43,28,0.45)' }}>
                  Clique aqui para ativar → depois pressione <kbd style={{ fontFamily:'monospace', fontSize:11, padding:'1px 5px', borderRadius:4, background:'rgba(61,102,65,0.10)', border:'1px solid rgba(61,102,65,0.25)', color:'#3D6641' }}>Ctrl+V</kbd>
                </p>
              </>
            )}
          </div>

          {/* Previews grid */}
          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-2.5">
              {previews.map((url, i) => (
                <div key={i} className="relative group rounded-[13px] overflow-hidden"
                  style={{ aspectRatio:'1', border:'1px solid rgba(61,102,65,0.22)', boxShadow:'0 2px 8px rgba(44,74,46,0.10)' }}>
                  <img src={url} alt={`Preview ${i+1}`} className="w-full h-full object-cover" />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background:'rgba(26,43,28,0.55)' }}>
                    <button onClick={e => { e.stopPropagation(); removeImage(i) }}
                      className="w-9 h-9 rounded-full flex items-center justify-center"
                      style={{ background:'rgba(220,38,38,0.90)', color:'white' }}>
                      <X size={16} strokeWidth={2.5}/>
                    </button>
                  </div>
                  {/* Index badge */}
                  <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{ background:'rgba(44,74,46,0.85)', color:'#D4E8D5' }}>{i+1}</div>
                </div>
              ))}

              {/* Add more button */}
              <button
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center justify-center gap-1 rounded-[13px] transition-all hover:border-[rgba(61,102,65,0.40)]"
                style={{ aspectRatio:'1', border:'2px dashed rgba(61,102,65,0.22)', background:'rgba(61,102,65,0.04)', color:'rgba(26,43,28,0.40)' }}>
                <Plus size={20}/>
                <span className="text-[11px] font-semibold">Adicionar</span>
              </button>
            </div>
          )}

          {images.length > 0 && (
            <p className="text-xs font-semibold text-center italic" style={{ color:'rgba(26,43,28,0.45)' }}>
              {images.length} imagem{images.length>1?'s':''} selecionada{images.length>1?'s':''}
              {images.length>1 ? ' — a IA vai analisar todas' : ''}
            </p>
          )}
        </div>
      )}

      {/* ── Text Input ── */}
      {mode === 'text' && (
        <div className="animate-fade-up" style={{ ...CARD, padding:16 }}>
          <label className="block text-xs font-bold mb-2 uppercase tracking-[0.08em]"
            style={{ color:'rgba(26,43,28,0.50)' }}>
            Digite ou cole o texto
          </label>
          <textarea
            value={text} onChange={e => setText(e.target.value)} rows={6}
            placeholder="Ex: Prova de matemática dia 15/06, consulta pediatra 20/06 às 14h, futebol toda terça e quinta..."
            className="w-full resize-none outline-none text-sm"
            style={{ background:'transparent', color:'#1A2B1C' }}
          />
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="text-xs font-semibold px-4 py-3 rounded-[13px] animate-fade-up"
          style={{ background:'linear-gradient(140deg,#FEE2E2,#FECACA)', color:'#991B1B', border:'1px solid rgba(220,38,38,0.20)' }}>
          ⚠ {error}
        </div>
      )}

      {/* ── Extract Button ── */}
      <button
        onClick={handleExtract}
        disabled={loading || (mode==='image' ? images.length===0 : !text.trim())}
        className="w-full flex items-center justify-center gap-2.5 py-4 rounded-[16px] text-base font-bold transition-all hover:brightness-105 active:scale-95 disabled:opacity-50"
        style={{ background:'linear-gradient(140deg,#3D6641,#2C4A2E)', color:'#D4E8D5', boxShadow:'0 6px 20px rgba(44,74,46,0.28),0 -1px 0 rgba(255,255,255,0.12) inset' }}>
        {loading
          ? <><Loader2 size={18} className="animate-spin"/> Analisando{images.length>1 ? ` ${images.length} imagens` : ''}...</>
          : <><Sparkles size={18}/> Extrair atividades com IA</>
        }
      </button>

      {/* ── Results ── */}
      {extracted !== null && (
        <div className="space-y-4 animate-fade-up">
          <div className="flex items-center justify-between">
            <h2 style={{ fontFamily:'var(--font-lora)', fontSize:22, fontWeight:600, color:'#1A2B1C' }}>
              {extracted.length===0 ? 'Nenhuma atividade encontrada' : `${extracted.length} atividade${extracted.length>1?'s':''} encontrada${extracted.length>1?'s':''}`}
            </h2>
            {extracted.length > 0 && (
              <span className="text-xs font-bold px-3 py-1 rounded-full"
                style={{ background:'linear-gradient(140deg,#FEF3C7,#FDE68A)', color:'#92400E', border:'1px solid rgba(146,64,14,0.18)', boxShadow:'0 1px 3px rgba(44,74,46,0.08)' }}>
                {selectedCount} selecionada{selectedCount!==1?'s':''}
              </span>
            )}
          </div>

          {extracted.length===0 && (
            <div className="p-6 text-center" style={{ ...CARD, borderStyle:'dashed', borderWidth:2 }}>
              <div className="text-3xl mb-2">🤔</div>
              <p className="text-sm italic" style={{ color:'rgba(26,43,28,0.50)' }}>
                Nenhuma atividade identificada. Tente com uma imagem mais clara ou texto mais detalhado.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {extracted.map((a, i) => {
              const cat = CAT_CONFIG[a.category as CatKey] ?? CAT_CONFIG.escola
              return (
                <div key={i} className="transition-all" style={{ ...CARD, padding:'14px 16px', opacity:a.selected?1:0.5 }}>
                  <div className="flex items-start gap-3">
                    {/* Select toggle */}
                    <button onClick={() => toggleSelect(i)}
                      className="mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-none transition-all hover:scale-110"
                      style={a.selected
                        ? { background:cat.icolor, borderColor:cat.icolor, color:'#fff' }
                        : { borderColor:'rgba(61,102,65,0.22)' }
                      }>
                      {a.selected && <Check size={12} strokeWidth={3}/>}
                    </button>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Category chip */}
                        <div className="w-6 h-6 rounded-[7px] flex items-center justify-center flex-none"
                          style={{ backgroundImage:cat.ibg, border:'1px solid rgba(0,0,0,0.07)' }}>
                          <cat.icon size={12} color={cat.icolor} strokeWidth={2}/>
                        </div>
                        <span className="font-bold text-sm" style={{ color:'#1A2B1C' }}>{a.title}</span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                          style={{ backgroundImage:cat.ibg, color:cat.icolor, border:`1px solid ${cat.icolor}22` }}>
                          {cat.label}
                        </span>
                      </div>

                      <div className="flex gap-3 flex-wrap">
                        {a.date && (
                          <span className="text-xs flex items-center gap-1 italic" style={{ color:'rgba(26,43,28,0.50)' }}>
                            📅 {a.date.split('-').reverse().join('/')}
                          </span>
                        )}
                        {a.time && (
                          <span className="text-xs flex items-center gap-1 italic" style={{ color:'rgba(26,43,28,0.50)' }}>
                            <Clock size={11}/> {a.time}
                          </span>
                        )}
                        {a.location && (
                          <span className="text-xs flex items-center gap-1 italic" style={{ color:'rgba(26,43,28,0.50)' }}>
                            <MapPin size={11}/> {a.location}
                          </span>
                        )}
                      </div>

                      {a.description && (
                        <p className="text-xs italic" style={{ color:'rgba(26,43,28,0.36)' }}>{a.description}</p>
                      )}

                      {!a.date && (
                        <div className="text-xs font-semibold px-2.5 py-1.5 rounded-[10px] inline-block"
                          style={{ background:'linear-gradient(140deg,#FEF3C7,#FDE68A)', color:'#92400E', border:'1px solid rgba(146,64,14,0.18)' }}>
                          ⚠️ Data não identificada — edite depois de salvar
                        </div>
                      )}

                      {/* Per-activity child selector (pills) */}
                      {children.length > 1 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold flex-shrink-0" style={{ color:'rgba(26,43,28,0.50)' }}>Filho(a):</span>
                          {children.map(c => {
                            const active = a.child_ids.includes(c.id)
                            return (
                              <button key={c.id} type="button" onClick={() => toggleChildForActivity(i, c.id)}
                                style={{
                                  display:'flex', alignItems:'center', gap:5,
                                  padding:'3px 10px', borderRadius:99, cursor:'pointer',
                                  fontSize:11, fontWeight:700,
                                  border:`1.5px solid ${active ? c.avatar_color : 'rgba(61,102,65,0.18)'}`,
                                  background: active ? `${c.avatar_color}18` : 'rgba(255,255,255,0.70)',
                                  color: active ? c.avatar_color : 'rgba(26,43,28,0.45)',
                                  transition:'all .15s',
                                }}>
                                <span style={{ width:10, height:10, borderRadius:'50%', background:c.avatar_color, display:'inline-block', flexShrink:0 }}/>
                                {c.name}
                                {active && <Check size={10} strokeWidth={3}/>}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    <button onClick={() => toggleSelect(i)}
                      className="flex-none w-7 h-7 rounded-[9px] flex items-center justify-center transition-all hover:scale-110"
                      style={{ background:'linear-gradient(140deg,#FEE2E2,#FECACA)', color:'#DC2626' }}>
                      <X size={14}/>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {selectedCount > 0 && (
            <button onClick={handleSave} disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-[16px] text-sm font-bold transition-all hover:brightness-105 active:scale-95 disabled:opacity-60"
              style={{ background:'linear-gradient(140deg,#3D6641,#2C4A2E)', color:'#D4E8D5', boxShadow:'0 6px 20px rgba(44,74,46,0.28),0 -1px 0 rgba(255,255,255,0.12) inset' }}>
              {saving
                ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/> Salvando...</>
                : <><Check size={17}/> Salvar {selectedCount} atividade{selectedCount>1?'s':''}</>
              }
            </button>
          )}
        </div>
      )}
    </div>
  )
}
