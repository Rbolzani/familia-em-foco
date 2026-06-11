# Configuração do Resumo Matinal via WhatsApp

O código já está pronto. Para os envios funcionarem, são necessários 3 passos externos:
(1) aplicar a migração SQL, (2) criar o app no Meta, (3) configurar as variáveis no Vercel.

---

## Passo 1 — Migração no Supabase

Abra o **SQL Editor** do Supabase e rode o conteúdo de `supabase-migration-whatsapp.sql`
(cria a tabela `notification_settings` com RLS).

---

## Passo 2 — WhatsApp Cloud API (Meta)

1. Acesse https://developers.facebook.com → **My Apps** → **Create App** → tipo **Business**.
2. No app criado, adicione o produto **WhatsApp**.
3. Em **WhatsApp → API Setup** você verá:
   - **Phone Number ID** → será a variável `WHATSAPP_PHONE_ID`
   - Um **número de teste** da Meta e um **token temporário** (24h) para começar
4. **Para testar agora**: na mesma tela, em "To", adicione seu número pessoal na lista
   de destinatários de teste (a Meta envia um código de confirmação no seu WhatsApp).
5. **Token permanente** (para produção):
   - Business Settings → **System Users** → criar usuário do sistema (admin)
   - Gerar token com permissões `whatsapp_business_messaging` e `whatsapp_business_management`
   - Esse token vira a variável `WHATSAPP_TOKEN`
6. **Template de mensagem** (obrigatório p/ produção):
   Mensagens iniciadas pelo negócio fora da janela de 24h exigem template aprovado.
   - WhatsApp Manager → **Message Templates** → Create Template
   - Categoria: **Utility** · Nome: `resumo_diario` · Idioma: **Portuguese (BR)**
   - Corpo: `{{1}}` (apenas o parâmetro — o app injeta o resumo inteiro)
   - Após aprovação (geralmente minutos/horas), configure `WHATSAPP_TEMPLATE_NAME=resumo_diario`
   - **Sem** essa variável, o app envia texto simples — funciona nos testes com número
     de teste/janela aberta, mas não para envios diários em produção.
7. Para produção real: conectar um número próprio (não o de teste) e verificar o negócio
   no Business Manager.

---

## Passo 3 — Variáveis de ambiente no Vercel

Em **Vercel → Settings → Environment Variables**, adicione:

| Variável | Valor | Obrigatória |
|---|---|---|
| `WHATSAPP_TOKEN` | Token do system user (Meta) | Sim |
| `WHATSAPP_PHONE_ID` | Phone Number ID (Meta) | Sim |
| `WHATSAPP_TEMPLATE_NAME` | `resumo_diario` (após aprovação) | Produção |
| `CRON_SECRET` | String aleatória longa (gere em https://generate-secret.vercel.app/32) | Sim |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → `service_role` | Sim |

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` e `WHATSAPP_TOKEN` são segredos de servidor.
> Nunca usar prefixo `NEXT_PUBLIC_` neles.

Depois de adicionar, faça um **Redeploy** para as variáveis valerem.

---

## Como funciona

- **Cron**: `vercel.json` agenda `GET /api/whatsapp-daily` todo dia às **10:00 UTC = 07:00 Brasília**.
  O Vercel envia automaticamente o header `Authorization: Bearer $CRON_SECRET`.
- **Conteúdo**: atividades de hoje (com horário e quem leva/busca) + próximos 7 dias,
  de toda a família (suas + do parceiro conectado).
- **Opt-in**: cada usuário ativa o próprio resumo em **Configurações → Resumo matinal no WhatsApp**,
  salvando o número no formato `5511999998888`.
- **Teste**: botão "Enviar resumo de teste agora" na mesma tela dispara o envio imediato.

## Teste rápido (antes do template aprovado)

1. Rode a migração (Passo 1)
2. Configure `WHATSAPP_TOKEN` (pode ser o temporário de 24h), `WHATSAPP_PHONE_ID`,
   `CRON_SECRET` e `SUPABASE_SERVICE_ROLE_KEY` no Vercel + Redeploy
3. Adicione seu número como destinatário de teste no painel da Meta (Passo 2.4)
4. No app: Configurações → salve seu número → "Enviar resumo de teste agora"
