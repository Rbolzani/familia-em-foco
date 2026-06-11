import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const MAX_FILE_BYTES = 8 * 1024 * 1024 // 8 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const
const MAX_TEXT_CHARS = 12_000

const PROMPT = `Você é um assistente que extrai atividades escolares, médicas e extracurriculares de imagens ou textos enviados por pais.

Analise o conteúdo e extraia TODAS as atividades, compromissos, provas, consultas, eventos e tarefas com datas.

Retorne APENAS um JSON válido no seguinte formato (sem markdown, sem explicação):
{
  "activities": [
    {
      "title": "título curto e claro da atividade",
      "category": "escola",
      "date": "YYYY-MM-DD",
      "time": "HH:MM",
      "description": "detalhes adicionais se houver",
      "location": "local se mencionado"
    }
  ]
}

Regras:
- category deve ser exatamente "escola", "saude" ou "extracurricular"
- Se a data for relativa (ex: "próxima segunda"), calcule a partir de hoje: ${new Date().toISOString().split('T')[0]}
- Se não houver data clara, use null no campo date
- time e description e location podem ser null se não houver
- categoria "escola": provas, trabalhos, eventos escolares, tarefas de casa, reuniões de pais
- categoria "saude": consultas, vacinas, retornos médicos, exames
- categoria "extracurricular": esportes, cursos, hobbies, competições
- Títulos devem ser curtos (máx 80 chars)
- Retorne apenas o JSON, sem texto antes ou depois`

export async function POST(req: NextRequest) {
  try {
    // Endpoint consome a API da Anthropic — exige usuário autenticado
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const formData = await req.formData()
    const text = formData.get('text') as string | null
    const file = formData.get('image') as File | null

    if (!text && !file) {
      return NextResponse.json({ error: 'Envie texto ou imagem' }, { status: 400 })
    }
    if (text && text.length > MAX_TEXT_CHARS) {
      return NextResponse.json({ error: 'Texto muito longo (máx. 12 mil caracteres)' }, { status: 400 })
    }
    if (file) {
      if (!ALLOWED_TYPES.includes(file.type as typeof ALLOWED_TYPES[number])) {
        return NextResponse.json({ error: 'Formato de imagem não suportado (use JPG, PNG, GIF ou WebP)' }, { status: 400 })
      }
      if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json({ error: 'Imagem muito grande (máx. 8 MB)' }, { status: 400 })
      }
    }

    let message

    if (file) {
      const bytes = await file.arrayBuffer()
      const base64 = Buffer.from(bytes).toString('base64')
      const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

      message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
              { type: 'text', text: PROMPT },
            ],
          },
        ],
      })
    } else {
      message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: `Texto para analisar:\n\n${text}\n\n${PROMPT}`,
          },
        ],
      })
    }

    const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    const jsonStr = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
    const parsed = JSON.parse(jsonStr)

    return NextResponse.json(parsed)
  } catch (e) {
    console.error('AI extract error:', e)
    // Não vazar detalhes internos do erro para o cliente
    return NextResponse.json({ error: 'Não foi possível processar. Tente novamente.' }, { status: 500 })
  }
}
