// Server-only: normaliza imagens enviadas pelo usuário para um dos formatos
// que a Claude Vision API aceita (jpeg, png, gif, webp).
//
// Fotos tiradas direto da câmera do celular (principalmente iPhone e boa
// parte dos Android recentes) vêm em HEIC/HEIF por padrão — a Claude API
// não entende esse formato. Convertemos para JPEG antes de qualquer coisa.
import convert from 'heic-convert'

export type SupportedMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
const SUPPORTED: readonly SupportedMediaType[] = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

const HEIC_TYPES = new Set(['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'])

const EXT_TO_TYPE: Record<string, SupportedMediaType> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp',
}

function extOf(filename: string): string {
  return (filename.split('.').pop() ?? '').toLowerCase()
}

export async function normalizeImage(
  buffer: Buffer, mimeType: string, filename: string
): Promise<{ buffer: Buffer; mediaType: SupportedMediaType } | null> {
  const ext = extOf(filename)

  // Já num formato aceito — segue sem conversão.
  if (SUPPORTED.includes(mimeType as SupportedMediaType)) {
    return { buffer, mediaType: mimeType as SupportedMediaType }
  }

  // HEIC/HEIF (por tipo MIME ou, quando o navegador não informa o tipo
  // corretamente, pela extensão do arquivo) — converte para JPEG.
  if (HEIC_TYPES.has(mimeType) || ext === 'heic' || ext === 'heif') {
    const jpeg = await convert({ buffer, format: 'JPEG', quality: 0.92 })
    return { buffer: Buffer.from(jpeg), mediaType: 'image/jpeg' }
  }

  // Tipo MIME ausente/genérico (comum em uploads de câmera móvel) — usa a
  // extensão do arquivo como fallback.
  if ((!mimeType || mimeType === 'application/octet-stream') && EXT_TO_TYPE[ext]) {
    return { buffer, mediaType: EXT_TO_TYPE[ext] }
  }

  return null
}
