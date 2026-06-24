'use client'
import React, { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, FileText, ChevronRight, X, Upload, Loader2, Sparkles } from 'lucide-react'
import { toast } from '@/components/ui/Toast'
import { Child, AppDocument, DocumentCategory } from '@/lib/types'
import { useAccess } from '@/components/access/AccessContext'
import { getVaultCategory } from '@/lib/vault'
import { ocrDocument } from '@/lib/ocr'
import { getDocType } from '@/lib/docTypes'
import type { DocType } from '@/lib/docTypes'

function expiryStatus(expires_at: string | null): 'vencido' | 'a vencer' | 'valido' | null {
  if (!expires_at) return null
  const d = new Date(expires_at)
  const now = new Date()
  if (d < now) return 'vencido'
  const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  if (diff <= 30) return 'a vencer'
  return 'valido'
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  vencido:   { bg: 'rgba(239,68,68,0.12)',  color: '#B91C1C', label: 'Vencido' },
  'a vencer':{ bg: 'rgba(245,158,11,0.12)', color: '#92400E', label: 'A vencer' },
  valido:    { bg: 'rgba(16,185,129,0.12)', color: '#065F46', label: 'Válido' },
}

interface Props {
  category: DocumentCategory
  children: Child[]
  documents: AppDocument[]
  canOcr: boolean
}

export default function GavetaClient({ category, children, documents: initialDocs, canOcr }: Props) {
  const router = useRouter()
  const { canEdit } = useAccess()
  const cat = getVaultCategory(category)
  const meta = { label: cat?.label ?? category, accent: cat?.accent ?? '#3D6641', desc: cat?.desc ?? '' }
  const [docs, setDocs] = useState<AppDocument[]>(initialDocs)
  const [childFilter, setChildFilter] = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Upload form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [childId, setChildId] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [docNumber, setDocNumber] = useState('')
  const [issuer, setIssuer] = useState('')
  const [issueDate, setIssueDate] = useState('')
  const [tags, setTags] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  // OCR (cofre inteligente): texto extraído + natureza + estado de auto-preench.
  const [ocrText, setOcrText] = useState<string | null>(null)
  const [docType, setDocType] = useState<DocType | null>(null)
  const [metadata, setMetadata] = useState<Record<string, unknown>>({})
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrApplied, setOcrApplied] = useState(false)

  const filtered = childFilter ? docs.filter(d => d.child_id === childFilter) : docs

  // Ao selecionar arquivos (frente+verso): roda OCR, classifica a natureza e
  // auto-preenche os campos vazios. Conveniência — falha é silenciosa.
  async function handleFilesSelected(selected: File[]) {
    setFiles(selected)
    if (!canOcr) return
    setOcrLoading(true); setOcrApplied(false)
    const r = await ocrDocument(selected)
    setOcrLoading(false)
    if (!r) return
    setOcrText(r.ocr_text || null)
    setDocType(r.doc_type ?? null)
    setMetadata(r.metadata ?? {})
    setTitle(prev => prev.trim() ? prev : (r.title ?? ''))
    setDescription(prev => prev.trim() ? prev : (r.description ?? ''))
    setDocNumber(prev => prev.trim() ? prev : (r.doc_number ?? ''))
    setIssuer(prev => prev.trim() ? prev : (r.issuer ?? ''))
    setIssueDate(prev => prev ? prev : (r.issue_date ?? ''))
    setExpiresAt(prev => prev ? prev : (r.expires_at ?? ''))
    setOcrApplied(true)
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { toast('Informe o título do documento', 'error'); return }
    setUploading(true)
    try {
      const form = new FormData()
      form.append('title', title.trim())
      form.append('category', category)
      if (childId) form.append('child_id', childId)
      if (description) form.append('description', description.trim())
      if (expiresAt) form.append('expires_at', expiresAt)
      if (docNumber) form.append('doc_number', docNumber.trim())
      if (issuer) form.append('issuer', issuer.trim())
      if (issueDate) form.append('issue_date', issueDate)
      if (tags.trim()) form.append('tags', tags.trim())
      if (ocrText) form.append('ocr_text', ocrText)
      if (docType) form.append('doc_type', docType)
      if (Object.keys(metadata).length) form.append('metadata', JSON.stringify(metadata))
      files.forEach(f => form.append('files', f))

      const res = await fetch('/api/documents/upload', { method: 'POST', body: form })
      const json = await res.json()
      if (!res.ok) { toast(json.error ?? 'Falha no upload', 'error'); return }

      toast('Documento salvo com sucesso ✓')
      const childRef = children.find(c => c.id === childId)
      setDocs(prev => [{ ...json.document, child: childRef ? { id: childRef.id, name: childRef.name, avatar_color: childRef.avatar_color } : null, files: json.files }, ...prev])
      setShowUpload(false)
      setTitle(''); setDescription(''); setChildId(''); setExpiresAt(''); setFiles([])
      setDocNumber(''); setIssuer(''); setIssueDate(''); setTags('')
      setOcrText(null); setOcrApplied(false); setDocType(null); setMetadata({})
    } catch {
      toast('Erro ao salvar documento', 'error')
    } finally {
      setUploading(false)
    }
  }

  const CARD: React.CSSProperties = {
    background: 'linear-gradient(160deg,#FFFFFF 0%,#F5F0E8 100%)',
    border: '1px solid rgba(61,102,65,0.18)',
    boxShadow: '0 4px 16px rgba(44,74,46,0.08),0 1px 4px rgba(44,74,46,0.05)',
    borderRadius: 16,
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 overflow-x-hidden">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 animate-fade-up">
        <Link href="/vault" className="flex items-center gap-1 text-sm font-medium transition-colors hover:opacity-70"
          style={{ color: '#3D6641', textDecoration: 'none' }}>
          <ChevronLeft size={16} />
          Documentos
        </Link>
        <span style={{ color: 'rgba(26,43,28,0.30)', fontSize: 14 }}>/</span>
        <span className="text-sm font-bold" style={{ color: '#1A2B1C' }}>{meta.label}</span>
      </div>

      {/* Header */}
      <div className="animate-fade-up">
        <h1 style={{ fontFamily: 'var(--font-lora)', fontSize: 28, fontWeight: 700, color: '#1A2B1C', letterSpacing: '-0.02em' }}>
          {meta.label}
        </h1>
        <p className="text-sm mt-0.5 italic" style={{ color: 'rgba(26,43,28,0.50)' }}>{meta.desc}</p>
      </div>

      {/* Filtro filho */}
      {children.length > 0 && (
        <div className="flex flex-wrap gap-2 animate-fade-up">
          <button
            onClick={() => setChildFilter(null)}
            className="px-3 py-1 rounded-full text-xs font-bold transition-all"
            style={{
              background: !childFilter ? 'linear-gradient(140deg,#3D6641,#2C4A2E)' : 'rgba(61,102,65,0.10)',
              color: !childFilter ? '#fff' : '#3D6641',
            }}>
            Todos
          </button>
          {children.map(c => (
            <button key={c.id}
              onClick={() => setChildFilter(c.id === childFilter ? null : c.id)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all"
              style={{
                background: childFilter === c.id ? c.avatar_color : `${c.avatar_color}22`,
                color: childFilter === c.id ? '#fff' : c.avatar_color,
              }}>
              <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black"
                style={{ background: childFilter === c.id ? 'rgba(255,255,255,0.25)' : c.avatar_color, color: '#fff' }}>
                {c.name[0]}
              </span>
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Lista de documentos */}
      {filtered.length === 0 ? (
        <div className="animate-fade-up flex flex-col items-center py-16 gap-3" style={{ color: 'rgba(26,43,28,0.35)' }}>
          <FileText size={40} strokeWidth={1.2} />
          <p className="text-sm italic">Nenhum documento nesta gaveta</p>
          {canEdit && (
            <button onClick={() => setShowUpload(true)}
              className="text-sm font-bold px-4 py-2 rounded-2xl transition-all hover:brightness-105"
              style={{ background: 'rgba(61,102,65,0.10)', color: '#3D6641' }}>
              Adicionar primeiro documento
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2 animate-fade-up">
          {filtered.map(doc => {
            const status = expiryStatus(doc.expires_at)
            const child = doc.child
            const fileCount = doc.files?.length ?? 0
            return (
              <Link key={doc.id} href={`/vault/${category}/${doc.id}`}
                className="block transition-all hover:-translate-y-[1px]"
                style={{ textDecoration: 'none' }}>
                <div style={{ ...CARD, padding: '14px 16px', borderLeft: `4px solid ${meta.accent}` }}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-sm truncate" style={{ color: '#1A2B1C' }}>{doc.title}</span>
                        {status && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: STATUS_STYLE[status].bg, color: STATUS_STYLE[status].color }}>
                            {STATUS_STYLE[status].label}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {child && (
                          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: `${child.avatar_color}22`, color: child.avatar_color }}>
                            <span className="w-3 h-3 rounded-full flex items-center justify-center text-[8px] font-black"
                              style={{ background: child.avatar_color, color: '#fff' }}>
                              {child.name[0]}
                            </span>
                            {child.name}
                          </span>
                        )}
                        {doc.expires_at && (
                          <span className="text-[11px] italic" style={{ color: 'rgba(26,43,28,0.40)' }}>
                            Vence {new Date(doc.expires_at).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                        {fileCount > 0 && (
                          <span className="text-[11px]" style={{ color: 'rgba(26,43,28,0.40)' }}>
                            {fileCount} arquivo{fileCount > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={16} color="rgba(26,43,28,0.30)" className="flex-shrink-0" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Modal de upload */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowUpload(false) }}>
          <div className="w-full max-w-md rounded-2xl p-6 space-y-4 animate-fade-up"
            style={{ background: '#F5F0E8', border: '1px solid rgba(61,102,65,0.20)', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>

            <div className="flex items-center justify-between">
              <h2 style={{ fontFamily: 'var(--font-lora)', fontSize: 20, fontWeight: 700, color: '#1A2B1C' }}>
                Novo documento — {meta.label}
              </h2>
              <button onClick={() => setShowUpload(false)} className="p-1 rounded-lg hover:bg-black/10 transition-colors">
                <X size={18} color="#1A2B1C" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(26,43,28,0.50)' }}>
                  Título *
                </label>
                <input className="input-field w-full" value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="Ex: Carteira de vacinação" required />
              </div>

              {children.length > 0 && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(26,43,28,0.50)' }}>
                    Filho
                  </label>
                  <select className="input-field w-full" value={childId} onChange={e => setChildId(e.target.value)}>
                    <option value="">Todos os filhos</option>
                    {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(26,43,28,0.50)' }}>
                  Descrição
                </label>
                <textarea className="input-field w-full resize-none" rows={2} value={description}
                  onChange={e => setDescription(e.target.value)} placeholder="Informações adicionais..." />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(26,43,28,0.50)' }}>
                    Emissão
                  </label>
                  <input type="date" className="input-field w-full" value={issueDate} onChange={e => setIssueDate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(26,43,28,0.50)' }}>
                    Vencimento
                  </label>
                  <input type="date" className="input-field w-full" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(26,43,28,0.50)' }}>
                    Nº do documento
                  </label>
                  <input className="input-field w-full" value={docNumber} onChange={e => setDocNumber(e.target.value)} placeholder="Ex: 12.345.678-9" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(26,43,28,0.50)' }}>
                    Órgão emissor
                  </label>
                  <input className="input-field w-full" value={issuer} onChange={e => setIssuer(e.target.value)} placeholder="Ex: SSP-SP" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(26,43,28,0.50)' }}>
                  Tags (separadas por vírgula)
                </label>
                <input className="input-field w-full" value={tags} onChange={e => setTags(e.target.value)} placeholder="Ex: viagem, escola" />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(26,43,28,0.50)' }}>
                  Arquivos (PDF, imagem)
                  {canOcr && <span className="inline-flex items-center gap-1 normal-case tracking-normal font-semibold" style={{ color: '#3D6641' }}><Sparkles size={11} /> a IA preenche os campos</span>}
                </label>
                <input ref={fileRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp"
                  className="hidden" onChange={e => handleFilesSelected(Array.from(e.target.files ?? []))} />
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed text-sm font-medium transition-colors hover:bg-black/5"
                  style={{ borderColor: 'rgba(61,102,65,0.30)', color: '#3D6641' }}>
                  <Upload size={15} />
                  {files.length > 0 ? `${files.length} arquivo${files.length > 1 ? 's' : ''} selecionado${files.length > 1 ? 's' : ''}` : 'Selecionar arquivos'}
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
                {docType && (
                  <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(61,102,65,0.12)', color: '#2C4A2E' }}>
                    Natureza detectada: {getDocType(docType).label}
                  </div>
                )}
                {files.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center justify-between text-xs px-2 py-1 rounded-lg"
                        style={{ background: 'rgba(61,102,65,0.07)' }}>
                        <span className="truncate" style={{ color: '#1A2B1C' }}>{f.name}</span>
                        <button type="button" onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}>
                          <X size={12} color="rgba(26,43,28,0.50)" />
                        </button>
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
