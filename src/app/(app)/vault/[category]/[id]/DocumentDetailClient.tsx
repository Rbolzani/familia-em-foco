'use client'
import React, { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Download, Trash2, Plus, FileText, Image, File, Loader2, X, Upload, AlertTriangle } from 'lucide-react'
import { toast } from '@/components/ui/Toast'
import { Child, AppDocument, DocumentFile, DocumentCategory } from '@/lib/types'

const META: Record<DocumentCategory, { label: string; accent: string }> = {
  saude:        { label: 'Saúde',        accent: '#10B981' },
  identidade:   { label: 'Identidade',   accent: '#3B82F6' },
  contratos:    { label: 'Contratos',    accent: '#F59E0B' },
  carteirinhas: { label: 'Carteirinhas', accent: '#8B5CF6' },
}

function fileIcon(mime: string | null) {
  if (!mime) return <File size={18} />
  if (mime.startsWith('image/')) return <Image size={18} />
  if (mime === 'application/pdf') return <FileText size={18} />
  return <File size={18} />
}

function formatBytes(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function expiryStatus(expires_at: string | null): { label: string; bg: string; color: string } | null {
  if (!expires_at) return null
  const d = new Date(expires_at)
  const now = new Date()
  if (d < now) return { label: 'Vencido', bg: 'rgba(239,68,68,0.12)', color: '#B91C1C' }
  const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  if (diff <= 30) return { label: 'Vence em breve', bg: 'rgba(245,158,11,0.12)', color: '#92400E' }
  return { label: 'Válido', bg: 'rgba(16,185,129,0.12)', color: '#065F46' }
}

interface Props {
  document: AppDocument
  category: DocumentCategory
  children: Child[]
}

export default function DocumentDetailClient({ document: doc, category, children }: Props) {
  const router = useRouter()
  const meta = META[category]
  const [files, setFiles] = useState<DocumentFile[]>(doc.files ?? [])
  const [downloading, setDownloading] = useState<string | null>(null)
  const [deletingFile, setDeletingFile] = useState<string | null>(null)
  const [deletingDoc, setDeletingDoc] = useState(false)
  const [uploadingMore, setUploadingMore] = useState(false)
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [showAddFiles, setShowAddFiles] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const child = doc.child
  const status = expiryStatus(doc.expires_at)

  async function downloadFile(file: DocumentFile) {
    setDownloading(file.id)
    try {
      const res = await fetch(`/api/documents/${doc.id}/signed-url?fileId=${file.id}`)
      const json = await res.json()
      if (!res.ok) { toast(json.error ?? 'Erro ao gerar link', 'error'); return }
      window.open(json.url, '_blank')
    } catch {
      toast('Erro ao baixar arquivo', 'error')
    } finally {
      setDownloading(null)
    }
  }

  async function deleteFile(file: DocumentFile) {
    setDeletingFile(file.id)
    try {
      const res = await fetch(`/api/documents/${doc.id}/files?fileId=${file.id}`, { method: 'DELETE' })
      if (!res.ok) { toast('Erro ao remover arquivo', 'error'); return }
      setFiles(prev => prev.filter(f => f.id !== file.id))
      toast('Arquivo removido')
    } catch {
      toast('Erro ao remover arquivo', 'error')
    } finally {
      setDeletingFile(null)
    }
  }

  async function uploadMoreFiles(e: React.FormEvent) {
    e.preventDefault()
    if (!newFiles.length) return
    setUploadingMore(true)
    try {
      const form = new FormData()
      newFiles.forEach(f => form.append('files', f))
      const res = await fetch(`/api/documents/${doc.id}/files`, { method: 'POST', body: form })
      const json = await res.json()
      if (!res.ok) { toast(json.error ?? 'Erro no upload', 'error'); return }
      setFiles(prev => [...prev, ...json.files])
      setNewFiles([])
      setShowAddFiles(false)
      toast('Arquivos adicionados ✓')
    } catch {
      toast('Erro no upload', 'error')
    } finally {
      setUploadingMore(false)
    }
  }

  async function deleteDocument() {
    setDeletingDoc(true)
    try {
      const res = await fetch(`/api/documents/${doc.id}`, { method: 'DELETE' })
      if (!res.ok) { toast('Erro ao excluir documento', 'error'); setDeletingDoc(false); return }
      toast('Documento excluído')
      router.push(`/vault/${category}`)
    } catch {
      toast('Erro ao excluir documento', 'error')
      setDeletingDoc(false)
    }
  }

  const CARD: React.CSSProperties = {
    background: 'linear-gradient(160deg,#FFFFFF 0%,#F5F0E8 100%)',
    border: '1px solid rgba(61,102,65,0.18)',
    boxShadow: '0 4px 16px rgba(44,74,46,0.08),0 1px 4px rgba(44,74,46,0.05)',
    borderRadius: 16,
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-8 space-y-5">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm animate-fade-up">
        <Link href="/vault" style={{ color: '#3D6641', textDecoration: 'none' }} className="hover:opacity-70 transition-opacity">
          Documentos
        </Link>
        <span style={{ color: 'rgba(26,43,28,0.30)' }}>/</span>
        <Link href={`/vault/${category}`} style={{ color: '#3D6641', textDecoration: 'none' }} className="hover:opacity-70 transition-opacity">
          {meta.label}
        </Link>
        <span style={{ color: 'rgba(26,43,28,0.30)' }}>/</span>
        <span className="font-bold truncate" style={{ color: '#1A2B1C' }}>{doc.title}</span>
      </div>

      {/* Header card */}
      <div className="animate-fade-up" style={{ ...CARD, padding: '20px', borderLeft: `4px solid ${meta.accent}` }}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h1 style={{ fontFamily: 'var(--font-lora)', fontSize: 22, fontWeight: 700, color: '#1A2B1C' }}>
              {doc.title}
            </h1>
            {doc.description && (
              <p className="text-sm mt-1 italic" style={{ color: 'rgba(26,43,28,0.55)' }}>{doc.description}</p>
            )}
          </div>
          {status && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
              style={{ background: status.bg, color: status.color }}>
              {status.label}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-3" style={{ borderTop: '1px solid rgba(61,102,65,0.10)' }}>
          {child && (
            <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: `${child.avatar_color}22`, color: child.avatar_color }}>
              <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black"
                style={{ background: child.avatar_color, color: '#fff' }}>
                {child.name[0]}
              </span>
              {child.name}
            </span>
          )}
          <span className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: `${meta.accent}18`, color: meta.accent }}>
            {meta.label}
          </span>
          {doc.expires_at && (
            <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(26,43,28,0.06)', color: 'rgba(26,43,28,0.55)' }}>
              Vence {new Date(doc.expires_at).toLocaleDateString('pt-BR')}
            </span>
          )}
          <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(26,43,28,0.06)', color: 'rgba(26,43,28,0.55)' }}>
            Criado {new Date(doc.created_at).toLocaleDateString('pt-BR')}
          </span>
        </div>
      </div>

      {/* Arquivos */}
      <div className="animate-fade-up" style={CARD}>
        <div className="flex items-center justify-between p-4 pb-0 mb-3">
          <h2 className="font-bold text-sm" style={{ color: '#1A2B1C' }}>Arquivos ({files.length})</h2>
          <button onClick={() => setShowAddFiles(true)}
            className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl transition-all hover:brightness-105 active:scale-95"
            style={{ background: 'rgba(61,102,65,0.10)', color: '#3D6641' }}>
            <Plus size={13} />
            Adicionar
          </button>
        </div>

        {files.length === 0 ? (
          <div className="px-4 pb-4 flex flex-col items-center py-8 gap-2" style={{ color: 'rgba(26,43,28,0.35)' }}>
            <File size={32} strokeWidth={1.2} />
            <p className="text-xs italic">Nenhum arquivo anexado</p>
          </div>
        ) : (
          <div className="px-4 pb-4 space-y-2">
            {files.map(file => (
              <div key={file.id} className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'rgba(61,102,65,0.05)', border: '1px solid rgba(61,102,65,0.10)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(61,102,65,0.10)', color: '#3D6641' }}>
                  {fileIcon(file.mime_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: '#1A2B1C' }}>{file.file_name}</div>
                  {file.file_size && (
                    <div className="text-xs" style={{ color: 'rgba(26,43,28,0.45)' }}>{formatBytes(file.file_size)}</div>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => downloadFile(file)}
                    disabled={downloading === file.id}
                    className="p-1.5 rounded-lg transition-colors hover:bg-black/10 disabled:opacity-50"
                    title="Download">
                    {downloading === file.id ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} color="#3D6641" />}
                  </button>
                  <button onClick={() => deleteFile(file)}
                    disabled={deletingFile === file.id}
                    className="p-1.5 rounded-lg transition-colors hover:bg-red-50 disabled:opacity-50"
                    title="Remover">
                    {deletingFile === file.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} color="#EF4444" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Zona de perigo */}
      <div className="animate-fade-up p-4 rounded-2xl" style={{ border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.04)' }}>
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={14} color="#EF4444" />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#EF4444' }}>Zona de perigo</span>
        </div>
        <p className="text-xs mb-3" style={{ color: 'rgba(26,43,28,0.55)' }}>
          Esta ação é permanente e removerá o documento e todos os arquivos associados.
        </p>
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)}
            className="text-sm font-bold px-4 py-2 rounded-xl transition-all hover:bg-red-50"
            style={{ color: '#EF4444', border: '1px solid rgba(239,68,68,0.30)' }}>
            Excluir documento
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={deleteDocument} disabled={deletingDoc}
              className="text-sm font-bold px-4 py-2 rounded-xl text-white flex items-center gap-1.5 disabled:opacity-60 transition-all"
              style={{ background: '#EF4444' }}>
              {deletingDoc ? <><Loader2 size={13} className="animate-spin" /> Excluindo...</> : 'Confirmar exclusão'}
            </button>
            <button onClick={() => setConfirmDelete(false)}
              className="text-sm font-bold px-4 py-2 rounded-xl transition-all hover:bg-black/10"
              style={{ color: 'rgba(26,43,28,0.60)' }}>
              Cancelar
            </button>
          </div>
        )}
      </div>

      {/* Modal adicionar arquivos */}
      {showAddFiles && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowAddFiles(false) }}>
          <div className="w-full max-w-md rounded-2xl p-6 space-y-4 animate-fade-up"
            style={{ background: '#F5F0E8', border: '1px solid rgba(61,102,65,0.20)', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div className="flex items-center justify-between">
              <h2 style={{ fontFamily: 'var(--font-lora)', fontSize: 18, fontWeight: 700, color: '#1A2B1C' }}>
                Adicionar arquivos
              </h2>
              <button onClick={() => setShowAddFiles(false)} className="p-1 rounded-lg hover:bg-black/10 transition-colors">
                <X size={18} color="#1A2B1C" />
              </button>
            </div>
            <form onSubmit={uploadMoreFiles} className="space-y-3">
              <input ref={fileRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden" onChange={e => setNewFiles(Array.from(e.target.files ?? []))} />
              <button type="button" onClick={() => fileRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed text-sm font-medium transition-colors hover:bg-black/5"
                style={{ borderColor: 'rgba(61,102,65,0.30)', color: '#3D6641' }}>
                <Upload size={16} />
                {newFiles.length > 0 ? `${newFiles.length} arquivo${newFiles.length > 1 ? 's' : ''} selecionado${newFiles.length > 1 ? 's' : ''}` : 'Selecionar arquivos'}
              </button>
              {newFiles.length > 0 && (
                <div className="space-y-1">
                  {newFiles.map((f, i) => (
                    <div key={i} className="flex items-center justify-between text-xs px-2 py-1 rounded-lg"
                      style={{ background: 'rgba(61,102,65,0.07)' }}>
                      <span className="truncate" style={{ color: '#1A2B1C' }}>{f.name}</span>
                      <button type="button" onClick={() => setNewFiles(prev => prev.filter((_, j) => j !== i))}>
                        <X size={12} color="rgba(26,43,28,0.50)" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button type="submit" disabled={uploadingMore || !newFiles.length}
                className="w-full py-3 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all hover:brightness-105 active:scale-95 disabled:opacity-60"
                style={{ background: 'linear-gradient(140deg,#3D6641,#2C4A2E)' }}>
                {uploadingMore ? <><Loader2 size={15} className="animate-spin" /> Enviando...</> : 'Enviar arquivos'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
