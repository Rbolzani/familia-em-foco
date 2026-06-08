import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

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
    const formData = await req.formData()
    const text = formData.get('text') as string | null
    const file = formData.get('image') as File | null

    if (!text && !file) {
      return NextResponse.json({ error: 'Envie texto ou imagem' }, { status: 400 })
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
  } catch (e: any) {
    console.error('AI extract error:', e)
    return NextResponse.json({ error: e.message || 'Erro ao processar' }, { status: 500 })
  }
}
