@AGENTS.md

# Família em Foco — Documentação do Projeto

## O que é o app

Plataforma de gestão familiar para pais brasileiros. Centraliza agenda escolar, saúde e atividades extracurriculares dos filhos, com IA para extração automática de dados, resumo diário via WhatsApp, compartilhamento entre parceiros e cofre de documentos.

**Tagline:** "Organize a vida dos seus filhos com carinho" / "sua rotina, com leveza"
**Público:** mães e pais brasileiros com filhos em idade escolar
**Mercado:** Brasil — português-BR, fuso America/Sao_Paulo, WhatsApp como canal primário

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16.2.7 (App Router) |
| Linguagem | TypeScript 5 |
| UI | React 19 + Tailwind CSS 4 |
| Ícones | Lucide React |
| Banco / Auth | Supabase (PostgreSQL + RLS) |
| IA (extração) | Claude Haiku via @anthropic-ai/sdk |
| IA (voz) | OpenAI Whisper via openai SDK |
| Notificações | WhatsApp Cloud API (Twilio fallback) |
| PWA | manifest.json — standalone, portrait-primary |

---

## Arquitetura de Pastas

```
src/
  app/
    (app)/            # Páginas autenticadas (layout com sidebar)
      dashboard/      # Tela principal — calendário + atividades do dia
      escola/         # Atividades escolares
      saude/          # Saúde (consultas, vacinas)
      atividades/     # Extracurricular
      ia/             # Captura por IA — foto, texto ou voz
      calendario/     # Calendário mensal
    api/
      ai-extract/     # POST: imagem ou texto → atividades/lembretes/docs (Claude)
      voice-transcribe/ # POST: áudio → texto transcrito (Whisper)
      documents/      # Upload e gestão de documentos
      whatsapp-daily/ # Cron 07h BRT — resumo diário via WhatsApp
    auth/             # Login e cadastro
  components/
    activities/       # ActivitiesPage.tsx — modal de criação/edição
    layout/           # AppLayout.tsx — sidebar, topbar, tema
    ui/               # Modal.tsx, VoiceInputButton.tsx, Toast.tsx, etc.
    access/           # AccessContext — controle de permissões
  hooks/
    useVoiceInput.ts  # MediaRecorder → Whisper → texto
  lib/
    supabase/         # client.ts e server.ts
    types.ts          # Activity, Child, etc.
```

---

## Modelo de Dados (Supabase)

### `activities`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK → auth.users |
| child_id | uuid | FK → children |
| category | enum | escola \| saude \| extracurricular |
| title | text | máx ~80 chars |
| description | text \| null | notas adicionais |
| date | date \| null | null = lembrete sem data |
| time | time \| null | |
| location | text \| null | |
| alert_days | int | 0–30 dias de antecedência |
| status | enum | pendente \| concluido \| cancelado |
| ai_generated | bool | gerado via IA |
| takes_user_id | uuid \| null | quem leva |
| picks_user_id | uuid \| null | quem busca |

### `children`
| Campo | Tipo |
|---|---|
| id | uuid |
| user_id | uuid |
| name | text |
| birth_date | date |
| school_name | text \| null |
| avatar_color | text (hex) |
| sort_order | int |

---

## Features Existentes

### 1. Captura por IA (`/ia`)
- **Foto/imagem:** envia para `/api/ai-extract`, Claude Haiku extrai atividades, lembretes e documentos
- **Texto livre:** mesmo endpoint, entrada manual
- **Voz (novo):** MediaRecorder → `/api/voice-transcribe` → Whisper → texto no campo → ai-extract

### 2. Calendário (`/calendario`)
- Visão mensal com dots por atividade
- Bottom sheet mobile com detalhe do dia
- Filtro por filho ou categoria

### 3. Atividades por Categoria (`/escola`, `/saude`, `/atividades`)
- Modal de criação/edição com campos: filho, título, data, hora, local, notas, alertas
- Chips de logística: quem leva / quem busca
- Agrupamento por data

### 4. Dashboard (`/dashboard`)
- Saudação por horário + nome
- Atividades de hoje e próxima semana
- Painel de lembretes (atividades sem data)
- Mini calendário

### 5. WhatsApp Daily (`/api/whatsapp-daily`)
- Cron às 07h BRT
- Resumo das atividades do dia para todos os membros da família
- Meta Cloud API com fallback Twilio

### 6. Compartilhamento
- Parceiro pode ter acesso completo, somente leitura ou somente logística
- Controle via `AccessContext` + Supabase RLS

### 7. Cofre de Documentos
- Upload de arquivos (PDF, imagem)
- Categorias: saúde, identidade, contratos, carteirinhas
- Data de vencimento opcional
- Imagem escaneada na IA é auto-anexada ao documento

---

## Módulo de Voz — Implementado

### Decisão de arquitetura
- **Descartado:** Web Speech API — instável no iOS PWA standalone (modo instalado)
- **Escolhido:** OpenAI Whisper via backend — funciona em 100% dos browsers e modos (iOS, Android, Firefox, PWA)
- **Custo:** $0,006/minuto, 100% variável, zero custo fixo

### Fluxo
```
Usuária clica "Voz" → MediaRecorder captura áudio
→ POST /api/voice-transcribe (audio blob)
→ OpenAI Whisper (model: whisper-1, language: pt)
→ texto transcrito → inserido no textarea
→ usuária clica "Analisar com IA"
→ /api/ai-extract → atividades/lembretes/docs
```

### Arquivos do módulo
| Arquivo | Responsabilidade |
|---|---|
| `src/hooks/useVoiceInput.ts` | MediaRecorder, seleção de MIME type (webm/mp4 por SO), estados, envio |
| `src/components/ui/VoiceInputButton.tsx` | Botão com estados idle/recording/transcribing/error |
| `src/app/api/voice-transcribe/route.ts` | Endpoint — recebe audio File, chama Whisper, retorna `{ text }` |
| `src/app/(app)/ia/page.tsx` | Integração — botão "Voz" no modo texto, transcrição concatena no textarea |

### Variável de ambiente necessária
```
OPENAI_API_KEY=sk-...
```

### Formatos de áudio suportados
- Chrome/Android: `audio/webm;codecs=opus`
- iOS Safari/Chrome: `audio/mp4`
- Fallback automático via `MediaRecorder.isTypeSupported()`

---

## Variáveis de Ambiente

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# IA — extração de texto/imagem
ANTHROPIC_API_KEY=

# IA — transcrição de voz
OPENAI_API_KEY=

# WhatsApp
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
# Twilio (fallback)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=
```

---

## Design System

### Paleta principal (tema Floresta)
```css
--verde-extra-dark: #1E3320
--verde-dark:       #2C4A2E
--verde-medium:     #3D6641
--verde-light:      #5A8C5E
--verde-pale:       #D4E8D5
--terra:            #C49A6C
--bg-creme:         #F8F3EA
--text-main:        #1A2B1C
```

### Temas disponíveis
Floresta (padrão) · Índigo · Âmbar · Rosa · Ardósia

### Tipografia
- Display: Lora (serifada, elegante)
- UI: DM Sans

### Padrões de componente
- Cards com `border-radius` orgânico (ex: `17px 11px 15px 13px`)
- Sombras suaves com inset highlight
- Textura noise sutil via SVG inline
- Animações: `animate-fade-up`, `animate-scale-in`, `animate-slide-up`

### Mobile
- PWA standalone + portrait-primary
- Bottom sheet: padrão para detalhes no mobile (ver `CalendarioClient.tsx`)
- Safe area insets respeitados: `env(safe-area-inset-bottom)`
- `maximumScale: 1` no viewport
- Sidebar: 58px vertical no mobile, 256px horizontal no desktop
