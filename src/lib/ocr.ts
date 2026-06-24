// Helper client p/ OCR de documentos (cofre inteligente — v1b/v1c).
// Envia 1 ou 2 arquivos (frente+verso) ao endpoint, que classifica a NATUREZA
// do documento e devolve o texto + os campos comuns + os campos específicos do
// tipo (metadata) para auto-preenchimento do formulário.

import type { DocType } from './docTypes'

export interface OcrResult {
  ocr_text: string
  doc_type: DocType | null
  // Campos comuns (mapeiam a colunas de `documents`)
  title: string | null
  description: string | null
  doc_number: string | null
  issuer: string | null
  issue_date: string | null   // YYYY-MM-DD
  expires_at: string | null   // YYYY-MM-DD
  // Campos específicos do tipo (chave→valor conforme docTypes)
  metadata: Record<string, unknown>
}

// Tipos aceitos para OCR (imagens + PDF).
export const OCR_ACCEPTED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf',
]

export function isOcrable(file: File): boolean {
  return OCR_ACCEPTED_TYPES.includes(file.type)
}

// Chama /api/documents/ocr com até 2 arquivos (frente+verso). Retorna null em
// qualquer falha (auto-preenchimento é conveniência: nunca quebra o upload).
export async function ocrDocument(files: File | File[]): Promise<OcrResult | null> {
  try {
    const list = (Array.isArray(files) ? files : [files]).filter(isOcrable).slice(0, 2)
    if (list.length === 0) return null
    const form = new FormData()
    list.forEach(f => form.append('files', f))
    const res = await fetch('/api/documents/ocr', { method: 'POST', body: form })
    if (!res.ok) return null
    const json = await res.json()
    if (typeof json?.ocr_text !== 'string') return null
    return {
      ocr_text: json.ocr_text,
      doc_type: json.doc_type ?? null,
      title: json.title ?? null,
      description: json.description ?? null,
      doc_number: json.doc_number ?? null,
      issuer: json.issuer ?? null,
      issue_date: json.issue_date ?? null,
      expires_at: json.expires_at ?? null,
      metadata: (json.metadata && typeof json.metadata === 'object') ? json.metadata : {},
    }
  } catch {
    return null
  }
}
