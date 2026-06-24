import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { getFamilyPlan, PLAN_LIMITS } from '@/lib/billing'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const MAX_FILE_BYTES = 12 * 1024 * 1024
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
const PDF_TYPE = 'application/pdf'

const PROMPT = `Você faz OCR e extração de dados de UM documento (imagem ou PDF) enviado por um pai ou mãe para um cofre digital familiar.

Hoje é: ${new Date().toISOString().split('T')[0]}

Tarefas:
1) Transcreva TODO o texto legível do documento no campo "ocr_text" (fiel ao conteúdo; pode ser longo).
2) Extraia os campos estruturados abaixo quando presentes.

Retorne APENAS um JSON válido neste formato exato (sem markdown, sem explicação):
{
  "ocr_text": "todo o texto transcrito do documento",
  "title": "nome curto e descritivo (ex: 'RG', 'Carteira de Vacinação', 'Contrato de matrícula') ou null",
  "doc_number": "número/registro principal do documento ou null",
  "issuer": "órgão/entidade emissora (ex: SSP-SP, Detran-SP, escola, convênio) ou null",
  "issue_date": "data de emissão no formato YYYY-MM-DD ou null",
  "expires_at": "data de validade/vencimento no formato YYYY-MM-DD ou null"
}

Regras:
- Datas SEMPRE no formato YYYY-MM-DD. Se não houver, use null.
- Não invente dados: se um campo não estiver visível, use null.
- "ocr_text" deve conter o texto real do documento, não um resumo.
- Retorne apenas o JSON, sem texto antes ou depois.`

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    // Gate de plano: OCR é recurso pago (Família/Plus). Volume ilimitado nesses
    // planos — não conta contra o limite mensal de IA.
    const plan = await getFamilyPlan()
    if (!PLAN_LIMITS[plan].ocr) {
      return NextResponse.json({ error: 'LIMIT_OCR', plan }, { status: 402 })
    }

    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Envie um arquivo' }, { status: 400 })

    const isImage = (IMAGE_TYPES as readonly string[]).includes(file.type)
    const isPdf = file.type === PDF_TYPE
    if (!isImage && !isPdf) {
      return NextResponse.json({ error: 'Formato não suportado para OCR (use JPG, PNG, WebP ou PDF)' }, { status: 400 })
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: 'Arquivo muito grande (máx. 12 MB)' }, { status: 400 })
    }

    const base64 = Buffer.from(await file.arrayBuffer()).toString('base64')

    const contentBlock = isPdf
      ? { type: 'document' as const, source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: base64 } }
      : { type: 'image' as const, source: { type: 'base64' as const, media_type: file.type as typeof IMAGE_TYPES[number], data: base64 } }

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [contentBlock, { type: 'text', text: PROMPT }],
      }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    const jsonStr = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
    const parsed = JSON.parse(jsonStr)

    return NextResponse.json({
      ocr_text: typeof parsed.ocr_text === 'string' ? parsed.ocr_text.slice(0, 12000) : '',
      title: parsed.title ?? null,
      doc_number: parsed.doc_number ?? null,
      issuer: parsed.issuer ?? null,
      issue_date: parsed.issue_date ?? null,
      expires_at: parsed.expires_at ?? null,
    })
  } catch (e) {
    console.error('OCR error:', e)
    return NextResponse.json({ error: 'Não foi possível ler o documento. Tente novamente.' }, { status: 500 })
  }
}
