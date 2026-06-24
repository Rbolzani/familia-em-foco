// Helper client p/ OCR de documentos (cofre inteligente — v1b).
// Envia 1 arquivo (imagem ou PDF) ao endpoint, que retorna o texto extraído
// e os campos estruturados para auto-preenchimento do formulário.

export interface OcrResult {
  ocr_text: string
  title: string | null
  doc_number: string | null
  issuer: string | null
  issue_date: string | null   // YYYY-MM-DD
  expires_at: string | null   // YYYY-MM-DD
}

// Tipos aceitos para OCR (imagens + PDF).
export const OCR_ACCEPTED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf',
]

export function isOcrable(file: File): boolean {
  return OCR_ACCEPTED_TYPES.includes(file.type)
}

// Chama /api/documents/ocr. Retorna null em qualquer falha (auto-preenchimento
// é conveniência: nunca deve quebrar o fluxo de upload).
export async function ocrDocument(file: File): Promise<OcrResult | null> {
  try {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/documents/ocr', { method: 'POST', body: form })
    if (!res.ok) return null
    const json = await res.json()
    if (typeof json?.ocr_text !== 'string') return null
    return json as OcrResult
  } catch {
    return null
  }
}
