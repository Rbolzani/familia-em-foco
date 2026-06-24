'use client'
import React, { useMemo, useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight, Sparkles, Search, X, Plus, Upload, Loader2 } from 'lucide-react'
import { Child } from '@/lib/types'
import { useAccess } from '@/components/access/AccessContext'
import { VAULT_CATEGORIES, VAULT_CATEGORY_KEYS, getVaultCategory, expiryStatus, EXPIRY_META, expiryLabel } from '@/lib/vault'
import type { DocumentCategory } from '@/lib/types'
import { toast } from '@/components/ui/Toast'
import { ocrDocument, isOcrable } from '@/lib/ocr'
import { createClient } from '@/lib/supabase/client'

interface DocSummary {
  id: string
  category: string
  child_id: string | null
  title: string
  expires_at: string | null
}

interface Props {
  children: Child[]
  documents: DocSummary[]
  canOcr: boolean
  canSearch: boolean
}

type StatusFilter = 'todos' | 'a_vencer' | 'vencido'

export default function VaultClient({ children, documents: initialDocuments, canOcr, canSearch }: Props) {
  const router = useRouter()
  const { canEdit } = useAccess()
  const [documents, setDocuments] = useState<DocSummary[]>(initialDocuments)
  const [status, setStatus]     = useState<StatusFilter>('todos')
  const [childId, setChildId]   = useState<string | 'fam' | null>(null) // null = todos
  const [showSearch, setShowSearch] = useState(false)
  const [query, setQuery]       = useState('')
  // Busca full-text (conteúdo OCR): ids dos docs que casam no servidor.
  const [ftsIds, setFtsIds]     = useState<Set<string> | null>(null)

  // Upload modal
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uTitle, setUTitle]         = useState('')
  const [uCategory, setUCategory]   = useState<DocumentCategory>(VAULT_CATEGORIES[0].key as DocumentCategory)
  const [uChildId, setUChildId]     = useState('')
  const [uDescription, setUDescription] = useState('')
  const [uExpiresAt, setUExpiresAt] = useState('')
  const [uDocNumber, setUDocNumber] = useState('')
  const [uIssuer, setUIssuer]       = useState('')
  const [uIssueDate, setUIssueDate] = useState('')
  const [uTags, setUTags]           = useState('')
  const [uFiles, setUFiles]         = useState<File[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  // OCR (cofre inteligente) no modal de upload
  const [uOcrText, setUOcrText]     = useState<string | null>(null)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrApplied, setOcrApplied] = useState(false)

  function resetUploadForm() {
    setUTitle(''); setUCategory(VAULT_CATEGORIES[0].key); setUChildId(''); setUDescription('')
    setUExpiresAt(''); setUDocNumber(''); setUIssuer(''); setUIssueDate(''); setUTags(''); setUFiles([])
    setUOcrText(null); setOcrApplied(false)
  }

  // Auto-preenchimento por OCR ao escolher arquivo (preenche só campos vazios).
  async function handleUFilesSelected(selected: File[]) {
    setUFiles(selected)
    if (!canOcr) return
    const target = selected.find(isOcrable)
    if (!target) return
    setOcrLoading(true); setOcrApplied(false)
    const r = await ocrDocument(target)
    setOcrLoading(false)
    if (!r) return
    setUOcrText(r.ocr_text || null)
    setUTitle(prev => prev.trim() ? prev : (r.title ?? ''))
    setUDocNumber(prev => prev.trim() ? prev : (r.doc_number ?? ''))
    setUIssuer(prev => prev.trim() ? prev : (r.issuer ?? ''))
    setUIssueDate(prev => prev ? prev : (r.issue_date ?? ''))
    setUExpiresAt(prev => prev ? prev : (r.expires_at ?? ''))
    setOcrApplied(true)
  }

  // Busca full-text no servidor (inclui conteúdo OCR). Debounce ~300ms. Os ids
  // que casam entram no filtro `base` — todos os docs já estão carregados como
  // resumo, então basta marcar quais incluir. Gateada pelo plano (documentSearch).
  useEffect(() => {
    const q = query.trim()
    if (!canSearch || q.length < 2) { setFtsIds(null); return }
    let cancelled = false
    const t = setTimeout(async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('documents')
        .select('id')
        .textSearch('search_tsv', q, { type: 'websearch', config: 'portuguese' })
        .limit(200)
      if (!cancelled) setFtsIds(new Set((data ?? []).map((d: { id: string }) => d.id)))
    }, 300)
    return () => { cancelled = true; clearTimeout(t) }
  }, [query, canSearch])

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!uTitle.trim()) { toast('Informe o título do documento', 'error'); return }
    setUploading(true)
    try {
      const form = new FormData()
      form.append('title', uTitle.trim())
      form.append('category', uCategory)
      if (uChildId) form.append('child_id', uChildId)
      if (uDescription) form.append('description', uDescription.trim())
      if (uExpiresAt) form.append('expires_at', uExpiresAt)
      if (uDocNumber) form.append('doc_number', uDocNumber.trim())
      if (uIssuer) form.append('issuer', uIssuer.trim())
      if (uIssueDate) form.append('issue_date', uIssueDate)
      if (uTags.trim()) form.append('tags', uTags.trim())
      if (uOcrText) form.append('ocr_text', uOcrText)
      uFiles.forEach(f => form.append('files', f))
      const res = await fetch('/api/documents/upload', { method: 'POST', body: form })
      const json = await res.json()
      if (!res.ok) { toast(json.error ?? 'Falha no upload', 'error'); return }
      toast('Documento salvo com sucesso ✓')
      // add to local list so counts update instantly
      setDocuments(prev => [{ id: json.document.id, category: uCategory, child_id: uChildId || null, title: uTitle.trim(), expires_at: uExpiresAt || null }, ...prev])
      setShowUpload(false)
      resetUploadForm()
      router.push(`/vault/${uCategory}/${json.document.id}`)
    } catch {
      toast('Erro ao salvar documento', 'error')
    } finally {
      setUploading(false)
    }
  }

  const childName = (id: string | null) => children.find(c => c.id === id)?.name ?? null

  // Base: aplica filtro de FILHO + BUSCA (não o de status). Farol, gavetas e
  // lista derivam daqui — assim a contagem das gavetas respeita o filtro de filho.
  const base = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (documents as DocSummary[]).filter(d => {
      if (childId === 'fam' && d.child_id !== null) return false
      if (childId && childId !== 'fam' && d.child_id !== childId) return false
      // casa por título (instantâneo) OU por conteúdo via full-text do servidor
      if (q && !(d.title.toLowerCase().includes(q) || (ftsIds?.has(d.id) ?? false))) return false
      return true
    })
  }, [documents, childId, query, ftsIds])

  const counts = useMemo(() => {
    let ok = 0, soon = 0, late = 0
    for (const d of base) {
      const s = expiryStatus(d.expires_at)
      if (s === 'vencido') late++
      else if (s === 'a_vencer') soon++
      else ok++ // valido + sem_data contam como "em dia"
    }
    return { ok, soon, late }
  }, [base])

  const filtered = useMemo(() => base.filter(d => {
    if (status === 'a_vencer') return expiryStatus(d.expires_at) === 'a_vencer'
    if (status === 'vencido') return expiryStatus(d.expires_at) === 'vencido'
    return true
  }), [base, status])

  const countByCategory = (cat: string) => base.filter(d => d.category === cat).length

  const CARD: React.CSSProperties = {
    background: 'linear-gradient(160deg,#FFFFFF 0%,#F5F0E8 100%)',
    border: '1px solid rgba(61,102,65,0.18)',
    boxShadow: '0 4px 16px rgba(44,74,46,0.08),0 1px 4px rgba(44,74,46,0.05)',
    borderRadius: 16,
  }
  const pill = (active: boolean): React.CSSProperties => ({
    fontSize: 12.5, fontWeight: 600, padding: '6px 13px', borderRadius: 999, cursor: 'pointer',
    border: active ? '1px solid transparent' : '1px solid rgba(61,102,65,0.22)',
    background: active ? 'linear-gradient(140deg,#3D6641,#2C4A2E)' : '#fff',
    color: active ? '#fff' : 'rgba(26,43,28,0.65)',
    display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
  })

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5 overflow-x-hidden">

      {/* Header */}
      <div className="animate-fade-up">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] mb-2 flex items-center gap-2" style={{ color: '#5A8C5E' }}>
          <span className="inline-block w-4 h-[2px] rounded" style={{ background: 'linear-gradient(90deg,#5A8C5E,#C49A6C)' }} />
          Repositório Seguro
        </p>
        <h1 style={{ fontFamily: 'var(--font-lora)', fontSize: 34, fontWeight: 700, color: '#1A2B1C', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
          Documentos
        </h1>
        <p className="text-sm mt-1 italic" style={{ color: 'rgba(26,43,28,0.50)' }}>
          Cofre digital para documentos importantes dos seus filhos.
        </p>
        {canEdit && (
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {/* Captura IA: oculto no mobile pois já aparece na topbar */}
            <Link href="/ia" className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-sm transition-all hover:brightness-105 active:scale-95"
              style={{ background: 'linear-gradient(140deg,#3D6641,#2C4A2E)', color: '#D4E8D5', boxShadow: '0 4px 14px rgba(44,74,46,0.25)', textDecoration: 'none' }}>
              <Sparkles size={14} /> Captura com IA
            </Link>
            <button onClick={() => setShowUpload(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-sm transition-all hover:brightness-95 active:scale-95"
              style={{ background: '#fff', border: '1px solid rgba(61,102,65,0.30)', color: '#3D6641' }}>
              <Plus size={14} /> Adicionar manualmente
            </button>
          </div>
        )}
      </div>

      {/* Farol de status: 2 colunas no mobile, 4 no desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 animate-fade-up">
        {[
          { n: base.length,  label: 'Total',    emoji: '📁', bg: 'rgba(61,102,65,0.08)',   color: '#2C4A2E' },
          { n: counts.ok,    label: 'Em dia',   emoji: '🟢', bg: 'rgba(59,109,17,0.10)',   color: '#27500A' },
          { n: counts.soon,  label: 'A vencer', emoji: '🟡', bg: 'rgba(245,158,11,0.12)',  color: '#854F0B' },
          { n: counts.late,  label: 'Vencidos', emoji: '🔴', bg: 'rgba(220,38,38,0.09)',   color: '#A32D2D' },
        ].map(c => (
          <div key={c.label} style={{ background: c.bg, borderRadius: 14, padding: '12px 10px' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: c.color }}>{c.n}</div>
            <div style={{ fontSize: 11, color: c.color, fontWeight: 600 }}>{c.emoji} {c.label}</div>
          </div>
        ))}
      </div>

      {/* Barra de filtros */}
      <div className="animate-fade-up space-y-2.5">
        {/* Linha 1: chips de status + busca */}
        <div className="flex items-center gap-2 flex-wrap">
          <button style={pill(status === 'todos')}    onClick={() => setStatus('todos')}>Todos</button>
          <button style={pill(status === 'a_vencer')} onClick={() => setStatus('a_vencer')}>A vencer</button>
          <button style={pill(status === 'vencido')}  onClick={() => setStatus('vencido')}>Vencidos</button>
          <button style={pill(showSearch || !!query)} onClick={() => setShowSearch(v => !v)}>
            <Search size={13} /> Buscar
          </button>
        </div>

        {/* Linha 2: combobox de filho (sempre visível se houver filhos) */}
        {children.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              value={childId ?? ''}
              onChange={e => {
                const v = e.target.value
                setChildId(v === '' ? null : v === 'fam' ? 'fam' : v)
              }}
              style={{
                fontSize: 12.5, fontWeight: 600, padding: '6px 28px 6px 10px',
                borderRadius: 999, cursor: 'pointer', appearance: 'none',
                border: childId !== null ? '1px solid transparent' : '1px solid rgba(61,102,65,0.22)',
                background: childId !== null
                  ? 'linear-gradient(140deg,#3D6641,#2C4A2E)'
                  : '#fff',
                color: childId !== null ? '#fff' : 'rgba(26,43,28,0.65)',
                outline: 'none',
                backgroundImage: childId !== null
                  ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"), linear-gradient(140deg,%233D6641,%232C4A2E)`
                  : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%233D6641' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"), %23ffffff`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 10px center, center',
                backgroundSize: '12px, cover',
              }}>
              <option value="">Todos os filhos</option>
              {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              <option value="fam">Documentos da família</option>
            </select>
            {childId !== null && (
              <button onClick={() => setChildId(null)}
                className="p-1 rounded-full hover:bg-black/10 transition-colors"
                title="Limpar filtro">
                <X size={14} color="rgba(26,43,28,0.50)" />
              </button>
            )}
          </div>
        )}

        {/* Campo de busca */}
        {showSearch && (
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(26,43,28,0.40)' }} />
            <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
              placeholder={canSearch ? 'Buscar por título ou conteúdo do documento…' : 'Buscar por título…'}
              style={{ width: '100%', padding: '10px 34px', borderRadius: 12, border: '1px solid rgba(61,102,65,0.22)', fontSize: 14, outline: 'none', background: '#fff', color: '#1A2B1C' }} />
            {query && <X size={15} onClick={() => setQuery('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(26,43,28,0.40)', cursor: 'pointer' }} />}
          </div>
        )}
      </div>

      {/* Gavetas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {VAULT_CATEGORIES.map((cat, i) => {
          const count = countByCategory(cat.key)
          return (
            <Link key={cat.key} href={`/vault/${cat.key}`}
              className="animate-fade-up block transition-all hover:-translate-y-[2px] group"
              style={{ animationDelay: `${i * 0.04}s`, textDecoration: 'none' }}>
              <div style={{ ...CARD, padding: '14px 16px', borderLeft: `4px solid ${cat.accent}` }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0" style={{ background: cat.iconBg }}>
                    <cat.icon size={19} color={cat.iconColor} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm" style={{ color: '#1A2B1C' }}>{cat.label}</span>
                      <span className="text-xs font-bold flex-shrink-0" style={{ color: cat.accent }}>
                        {count} {count === 1 ? 'doc' : 'docs'}
                      </span>
                    </div>
                    <div className="text-[11px] mt-0.5 italic truncate" style={{ color: 'rgba(26,43,28,0.45)' }}>{cat.desc}</div>
                  </div>
                  <ChevronRight size={14} color="rgba(26,43,28,0.30)" className="flex-shrink-0" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Lista filtrada */}
      <div className="animate-fade-up">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] mb-2" style={{ color: 'rgba(26,43,28,0.40)' }}>
          {status === 'todos' && childId === null && !query ? 'Próximos vencimentos' : `Resultados · ${filtered.length}`}
        </p>
        {filtered.length === 0 ? (
          <p className="text-sm italic" style={{ color: 'rgba(26,43,28,0.40)' }}>Nenhum documento encontrado com esses filtros.</p>
        ) : (
          <div className="space-y-2">
            {filtered
              .slice()
              .sort((a, b) => (a.expires_at ?? '9999').localeCompare(b.expires_at ?? '9999'))
              .slice(0, 12)
              .map(d => {
                const cat = getVaultCategory(d.category)
                const st = expiryStatus(d.expires_at)
                const meta = EXPIRY_META[st]
                const cn = childName(d.child_id)
                const Icon = cat?.icon
                return (
                  <Link key={d.id} href={`/vault/${d.category}/${d.id}`}
                    className="flex items-center gap-3 transition-all hover:-translate-y-[1px]"
                    style={{ ...CARD, padding: '10px 12px', textDecoration: 'none', minWidth: 0 }}>
                    <div className="w-9 h-9 rounded-[11px] flex items-center justify-center flex-shrink-0" style={{ background: cat?.iconBg }}>
                      {Icon && <Icon size={16} color={cat?.iconColor} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate" style={{ fontSize: 14, fontWeight: 600, color: '#1A2B1C' }}>{d.title}</div>
                      <div className="truncate" style={{ fontSize: 11.5, color: 'rgba(26,43,28,0.45)' }}>
                        {cat?.label}{cn ? ` · ${cn}` : d.child_id === null ? ' · família' : ''}
                      </div>
                      <span className="inline-block mt-0.5" style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: meta.bg, color: meta.color }}>
                        {st === 'sem_data' ? 'sem validade' : expiryLabel(d.expires_at)}
                      </span>
                    </div>
                  </Link>
                )
              })}
          </div>
        )}
      </div>

      {/* Modal de upload global */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) { setShowUpload(false); resetUploadForm() } }}>
          <div className="w-full max-w-md rounded-2xl p-6 space-y-4 animate-fade-up max-h-[90vh] overflow-y-auto"
            style={{ background: '#F5F0E8', border: '1px solid rgba(61,102,65,0.20)', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div className="flex items-center justify-between">
              <h2 style={{ fontFamily: 'var(--font-lora)', fontSize: 20, fontWeight: 700, color: '#1A2B1C' }}>
                Novo documento
              </h2>
              <button onClick={() => { setShowUpload(false); resetUploadForm() }} className="p-1 rounded-lg hover:bg-black/10 transition-colors">
                <X size={18} color="#1A2B1C" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-3">
              {/* Gaveta */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(26,43,28,0.50)' }}>Gaveta *</label>
                <select className="input-field w-full" value={uCategory} onChange={e => setUCategory(e.target.value as DocumentCategory)}>
                  {VAULT_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>

              {/* Título */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(26,43,28,0.50)' }}>Título *</label>
                <input className="input-field w-full" value={uTitle} onChange={e => setUTitle(e.target.value)} placeholder="Ex: RG da Gabriela" required />
              </div>

              {/* Filho */}
              {children.length > 0 && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(26,43,28,0.50)' }}>Filho</label>
                  <select className="input-field w-full" value={uChildId} onChange={e => setUChildId(e.target.value)}>
                    <option value="">Todos os filhos</option>
                    {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(26,43,28,0.50)' }}>Emissão</label>
                  <input type="date" className="input-field w-full" value={uIssueDate} onChange={e => setUIssueDate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(26,43,28,0.50)' }}>Vencimento</label>
                  <input type="date" className="input-field w-full" value={uExpiresAt} onChange={e => setUExpiresAt(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(26,43,28,0.50)' }}>Nº do documento</label>
                  <input className="input-field w-full" value={uDocNumber} onChange={e => setUDocNumber(e.target.value)} placeholder="Ex: 12.345.678-9" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(26,43,28,0.50)' }}>Órgão emissor</label>
                  <input className="input-field w-full" value={uIssuer} onChange={e => setUIssuer(e.target.value)} placeholder="Ex: SSP-SP" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(26,43,28,0.50)' }}>Tags (separadas por vírgula)</label>
                <input className="input-field w-full" value={uTags} onChange={e => setUTags(e.target.value)} placeholder="Ex: viagem, escola" />
              </div>

              {/* Upload */}
              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(26,43,28,0.50)' }}>
                  Arquivos (PDF, imagem)
                  {canOcr && <span className="inline-flex items-center gap-1 normal-case tracking-normal font-semibold" style={{ color: '#3D6641' }}><Sparkles size={11} /> a IA preenche os campos</span>}
                </label>
                <input ref={fileRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden"
                  onChange={e => handleUFilesSelected(Array.from(e.target.files ?? []))} />
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed text-sm font-medium transition-colors hover:bg-black/5"
                  style={{ borderColor: 'rgba(61,102,65,0.30)', color: '#3D6641' }}>
                  <Upload size={15} />
                  {uFiles.length > 0 ? `${uFiles.length} arquivo${uFiles.length > 1 ? 's' : ''} selecionado${uFiles.length > 1 ? 's' : ''}` : 'Selecionar arquivos'}
                </button>
                {ocrLoading && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#3D6641' }}>
                    <Loader2 size={12} className="animate-spin" /> Lendo documento com IA…
                  </p>
                )}
                {ocrApplied && !ocrLoading && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#3D6641' }}>
                    <Sparkles size={12} /> Campos preenchidos pela IA — confira antes de salvar.
                  </p>
                )}
                {uFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {uFiles.map((f, i) => (
                      <div key={i} className="flex items-center justify-between text-xs px-2 py-1 rounded-lg" style={{ background: 'rgba(61,102,65,0.07)' }}>
                        <span className="truncate" style={{ color: '#1A2B1C' }}>{f.name}</span>
                        <button type="button" onClick={() => setUFiles(prev => prev.filter((_, j) => j !== i))}><X size={12} color="rgba(26,43,28,0.50)" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" disabled={uploading}
                className="w-full py-3 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all hover:brightness-105 active:scale-95 disabled:opacity-60"
                style={{ background: 'linear-gradient(140deg,#3D6641,#2C4A2E)' }}>
                {uploading ? <><Loader2 size={15} className="animate-spin" /> Salvando...</> : 'Salvar documento'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
