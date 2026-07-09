import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { getFamilyPlan, getAiUsageThisMonth, incrementAiUsage, PLAN_LIMITS } from '@/lib/billing'
import { normalizeImage } from '@/lib/image'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const MAX_FILE_BYTES = 8 * 1024 * 1024
const MAX_TEXT_CHARS = 12_000

const WEEKDAY_NAMES = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']
const today = new Date()
const todayISO = today.toISOString().split('T')[0]
const todayWeekday = WEEKDAY_NAMES[today.getDay()]

const PROMPT = `Você é um assistente inteligente que analisa conteúdo enviado por pais e classifica automaticamente em três categorias distintas.

Hoje é: ${todayISO} (${todayWeekday})

Analise o conteúdo e classifique cada item em exatamente uma das três categorias:

**CATEGORIA 1 — activities (Atividades / Compromissos / Agenda)**
Itens que têm uma data específica em que algo VAI ACONTECER:
- Provas e trabalhos escolares (têm data de realização/entrega)
- Consultas médicas, exames, vacinas (têm data agendada)
- Eventos escolares (reuniões, festas, apresentações)
- Atividades extracurriculares recorrentes (futebol toda terça)
- Qualquer compromisso com data/horário definido

**GRADES DE HORÁRIO ESCOLAR (regra importante)** — Se a imagem for uma tabela/grade de horários com colunas por dia da semana (ex: "2ª", "3ª", "4ª", "5ª", "6ª" ou "Segunda", "Terça"...) e linhas por período/horário, isso é uma AGENDA RECORRENTE (se repete toda semana), não um documento nem um lembrete. Trate CADA célula preenchida com uma matéria/atividade como um item separado em "activities":
- title: nome da matéria/atividade da célula (ex: "Geografia", "Xadrez", "Educação Física")
- category: "escola"
- date: calcule a data real (YYYY-MM-DD) da PRÓXIMA ocorrência daquele dia da semana — use a data mais próxima a partir de hoje (se esse dia da semana já passou nesta semana, use a mesma data na semana seguinte). Gere apenas UMA data (a primeira ocorrência) — não repita o item várias vezes para semanas futuras, isso é feito depois por outro processo.
- time: horário de início do período daquela linha (HH:MM)
- recurring: true (marca que esse item se repete toda semana no mesmo dia/horário)
- Gere um item para CADA célula preenchida da grade, mesmo que o total seja alto (dezenas de itens) — nunca resuma, agrupe ou pule células.
- Inclua TAMBÉM as células de intervalo/refeição (ex: "Lanche/Recreio", "Almoço/Recreio", "Lanche/Saída") como itens normais — a exclusão delas é feita depois por outro processo automaticamente; você não precisa (e não deve tentar) filtrá-las.
- Antes de responder, confira mentalmente linha por linha, coluna por coluna: o número de itens gerados para a grade deve ser exatamente igual ao número de células preenchidas na tabela (linhas × colunas). Não pule nenhuma célula.
Uma grade de horários NUNCA deve virar um item em "documents" nem em "reminders".
Para atividades com data específica e única (prova, consulta, evento — categoria 1 normal), use "recurring": false.

**CATEGORIA 2 — reminders (Pendências / Lembretes)**
Ações que precisam ser feitas, mas SEM data específica de ocorrência:
- Coisas para comprar, providenciar ou renovar
- Documentos para solicitar ou entregar
- Ligações a fazer, formulários a preencher
- Tarefas sem prazo definido
- Lembretes gerais ("precisa renovar carteirinha", "comprar material")

NÃO crie um reminder a partir de avisos/disclaimers genéricos de comunicados (ex: "este horário poderá sofrer alterações ao longo do ano letivo", "sujeito a mudanças", rodapés padrão de escola) — isso não é uma ação que o pai/mãe precisa tomar, é só um aviso legal do documento. Só crie reminder se houver uma ação real e específica pedida.

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
      "location": "local ou null",
      "recurring": false
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

// Quantas semanas materializar para itens de grade de horário (recurring:
// true) — a tabela activities não tem conceito de recorrência, então cada
// ocorrência semanal vira uma linha própria até esse horizonte.
const RECURRING_WEEKS = 12

interface ExtractedActivity {
  title: string
  category: string
  date: string | null
  time: string | null
  description?: string | null
  location?: string | null
  recurring?: boolean
  groupId?: string
}

// Filtro determinístico de períodos de intervalo/refeição — a IA nem sempre
// aplica essa exclusão de forma consistente entre execuções (observado em
// produção: a mesma grade ora incluía Almoço/Recreio, ora não). Em vez de
// depender só do prompt, garantimos isso em código.
const BREAK_KEYWORDS = ['recreio', 'almoço', 'almoco', 'lanche', 'saída', 'saida', 'intervalo']
function isBreakPeriod(title: string): boolean {
  const t = title.toLowerCase()
  return BREAK_KEYWORDS.some(k => t.includes(k))
}

// Cada ocorrência gerada de um mesmo item recorrente leva o mesmo groupId,
// para a tela de revisão poder agrupá-las (uma matéria = um card, não 12).
function expandRecurring(activities: ExtractedActivity[]): ExtractedActivity[] {
  const result: ExtractedActivity[] = []
  activities.forEach((act, idx) => {
    if (isBreakPeriod(act.title)) return
    if (!act.recurring || !act.date) { result.push({ ...act, recurring: false }); return }
    const groupId = `rec-${idx}-${act.title}-${act.time}`
    for (let week = 0; week < RECURRING_WEEKS; week++) {
      const d = new Date(act.date + 'T12:00:00')
      d.setDate(d.getDate() + week * 7)
      result.push({ ...act, date: d.toISOString().split('T')[0], recurring: true, groupId })
    }
  })
  return result
}

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
    if (file && file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: 'Imagem muito grande (máx. 8 MB)' }, { status: 400 })
    }

    let message
    let normalized: Awaited<ReturnType<typeof normalizeImage>> = null

    if (file) {
      const bytes = await file.arrayBuffer()
      normalized = await normalizeImage(Buffer.from(bytes), file.type, file.name)
      if (!normalized) {
        return NextResponse.json({ error: 'Formato não suportado (use JPG, PNG, GIF, WebP ou foto da câmera)' }, { status: 400 })
      }
    }

    if (normalized) {
      const base64 = normalized.buffer.toString('base64')
      const mediaType = normalized.mediaType

      message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 8192,
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
        max_tokens: 8192,
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
      activities: expandRecurring(parsed.activities ?? []),
      reminders: parsed.reminders ?? [],
      documents: parsed.documents ?? [],
    })
  } catch (e) {
    console.error('AI extract error:', e)
    return NextResponse.json({ error: 'Não foi possível processar. Tente novamente.' }, { status: 500 })
  }
}
