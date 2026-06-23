import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { getFamilyPlan, getAiUsageThisMonth, incrementAiUsage, PLAN_LIMITS } from '@/lib/billing'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const MAX_FILE_BYTES = 8 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const
const MAX_TEXT_CHARS = 12_000

const PROMPT = `Você é um assistente inteligente que analisa conteúdo enviado por pais e classifica automaticamente em três categorias distintas.

Hoje é: ${new Date().toISOString().split('T')[0]}

Analise o conteúdo e classifique cada item em exatamente uma das três categorias:

**CATEGORIA 1 — activities (Atividades / Compromissos / Agenda)**
Itens que têm uma data específica em que algo VAI ACONTECER:
- Provas e trabalhos escolares (têm data de realização/entrega)
- Consultas médicas, exames, vacinas (têm data agendada)
- Eventos escolares (reuniões, festas, apresentações)
- Atividades extracurriculares recorrentes (futebol toda terça)
- Qualquer compromisso com data/horário definido

**CATEGORIA 2 — reminders (Pendências / Lembretes)**
Ações que precisam ser feitas, mas SEM data específica de ocorrência:
- Coisas para comprar, providenciar ou renovar
- Documentos para solicitar ou entregar
- Ligações a fazer, formulários a preencher
- Tarefas sem prazo definido
- Lembretes gerais ("precisa renovar carteirinha", "comprar material")

**CATEGORIA 3 — documents (Documentos)**
Documentos físicos ou digitais identificados no conteúdo:
- Documentos de identidade (RG, CPF, certidão de nascimento, passaporte)
- Documentos de saúde (carteirinha de vacinação, plano de saúde, receitas, resultados de exames)
- Contratos (matrícula escolar, plano de saúde, seguro)
- Carteirinhas (estudante, plano de saúde, clube)
- Boletos ou faturas identificados
- Qualquer documento formal listado ou visível

Retorne APENAS um JSON válido neste formato exato (sem markdown, sem explicação):
{
  "activities": [
    {
      "title": "título curto (máx 80 chars)",
      "category": "escola",
      "date": "YYYY-MM-DD ou null",
      "time": "HH:MM ou null",
      "description": "detalhes adicionais ou null",
      "location": "local ou null"
    }
  ],
  "reminders": [
    {
      "title": "título curto (máx 80 chars)",
      "category": "escola",
      "description": "contexto adicional ou null",
      "child_hint": "nome do filho se mencionado, ou null"
    }
  ],
  "documents": [
    {
      "title": "nome do documento",
      "category": "saude",
      "description": "detalhes do documento ou null",
      "expires_at": "YYYY-MM-DD ou null"
    }
  ]
}

Regras para reminders:
- category: exatamente "escola", "saude" ou "extracurricular" — escolha a que melhor descreve a natureza da pendência
- escola: coisas relacionadas à escola, material, reuniões sem data
- saude: renovar plano de saúde, agendar consulta, buscar receita
- extracurricular: inscrições, renovações de atividades

Regras para activities:
- category: exatamente "escola", "saude" ou "extracurricular"
- escola: provas, trabalhos, eventos escolares, reuniões de pais, tarefas com data
- saude: consultas, vacinas, exames, retornos médicos
- extracurricular: esportes, cursos, hobbies, competições
- date: calcule datas relativas a partir de hoje se necessário; null se incerta

Regras para documents:
- category: exatamente "saude", "identidade", "contratos" ou "carteirinhas"
- saude: carteirinha de vacinação, receitas, resultados de exames, plano de saúde
- identidade: RG, CPF, certidão de nascimento, passaporte, CNH
- contratos: matrícula escolar, contrato de plano de saúde, seguros, locação
- carteirinhas: carteirinha de estudante, clube, plano de saúde físico
- expires_at: data de validade se visível ou mencionada

Se não houver itens de uma categoria, retorne array vazio [].
Retorne apenas o JSON, sem texto antes ou depois.`

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    // Verificar limite de IA do plano
    const plan = await getFamilyPlan()
    const aiLimit = PLAN_LIMITS[plan].aiPerMonth
    if (aiLimit !== Infinity) {
      const used = await getAiUsageThisMonth(user.id)
      if (used >= aiLimit) {
        return NextResponse.json(
          { error: 'LIMIT_AI', plan, used, limit: aiLimit },
          { status: 402 }
        )
      }
    }

    const formData = await req.formData()
    const text = formData.get('text') as string | null
    const file = formData.get('image') as File | null

    if (!text && !file) return NextResponse.json({ error: 'Envie texto ou imagem' }, { status: 400 })
    if (text && text.length > MAX_TEXT_CHARS) {
      return NextResponse.json({ error: 'Texto muito longo (máx. 12 mil caracteres)' }, { status: 400 })
    }
    if (file) {
      if (!ALLOWED_TYPES.includes(file.type as typeof ALLOWED_TYPES[number])) {
        return NextResponse.json({ error: 'Formato não suportado (use JPG, PNG, GIF ou WebP)' }, { status: 400 })
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
        max_tokens: 3000,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
            { type: 'text', text: PROMPT },
          ],
        }],
      })
    } else {
      message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 3000,
        messages: [{
          role: 'user',
          content: `Conteúdo para analisar:\n\n${text}\n\n${PROMPT}`,
        }],
      })
    }

    const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    const jsonStr = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
    const parsed = JSON.parse(jsonStr)

    // Registrar uso de IA (não bloqueia a resposta se falhar)
    incrementAiUsage(user.id).catch(err => console.error('[ai-extract] incrementAiUsage error', err))

    return NextResponse.json({
      activities: parsed.activities ?? [],
      reminders: parsed.reminders ?? [],
      documents: parsed.documents ?? [],
    })
  } catch (e) {
    console.error('AI extract error:', e)
    return NextResponse.json({ error: 'Não foi possível processar. Tente novamente.' }, { status: 500 })
  }
}
