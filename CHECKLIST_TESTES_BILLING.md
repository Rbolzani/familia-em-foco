# Checklist de Testes — Billing / Assinaturas

**Atualizado:** 2026-06-22
**Ambiente:** dev (Stripe test mode, Supabase `fawsbgxmrbpgcnlhjoao`)
**Contas de teste:** rogerbolzani (owner) · rbolzanic (parceiro)

> Legenda: ✅ ok · ⏳ pendente · 🔜 próximo

---

## A) Plano Gratuito — restrições
- ✅ Até 2 filhos
- ✅ IA limitada (5 usos/mês)
- ✅ Sem entrada por voz
- ✅ Sem resumo diário no WhatsApp
- ✅ Sem compartilhamento com parceiro

## B) Checkout e ativação
- ✅ Checkout com cartão de teste → plano Família ativa
- ✅ Libera IA ilimitada, voz, WhatsApp e compartilhamento
- ✅ Trial de 14 dias só para conta nova (server-enforced)
- ✅ **Sem trial após os primeiros 14 dias, em nenhuma hipótese** (decisão no servidor, não no cliente)
- ✅ Rótulo do botão correto: "Mudar para X" para quem já é pagante (não "Começar grátis…")

## C) Cancelamento e reativação
- ✅ Cancelar dentro do app cancela de verdade no Stripe (não só rótulo)
- ✅ Formulário de motivo do cancelamento → gravado no Stripe (`cancellation_details`)
- ✅ Reativação antes do fim do período
- ✅ Cancelamento desabilitado no portal Stripe (evita botão duplicado)
- ✅ Reconciliação on-page-load (robusto a webhook perdido)

## D) Upgrade / Downgrade
- ✅ Upgrade Família → Plus vai ao checkout/modificação com proration
- ✅ Downgrade Plus → Família com proration (créditos explicados)
- ✅ **Plano anual (−20%)**: troca mensal↔anual sem pedir cartão; toggle abre no intervalo atual; preço R$31,90/mês (R$382,80/ano)

## E) Compartilhamento e herança de plano
- ✅ Isolamento entre famílias (item 30)
- ✅ Parceiro herda o plano do owner (`getEffectiveSubscription` / `get_family_plan`)
- ✅ Parceiro não vê trial/plano próprios — reflete o do owner
- ✅ Banner do parceiro com texto correto ("você terá 5 dias…")
- ✅ Plano atualiza em tempo real para o parceiro (realtime em `subscriptions`)
- ✅ Parceiro não pode gerenciar/contratar plano (cards e notas de rodapé ocultos)

## F) Grace period (owner → grátis com parceiro conectado)
- ✅ Grace de 5 dias iniciado em qualquer transição pago/trial → grátis
  (corrigido em `stripe-sync.ts`; antes só existia para expiração de trial)
- ✅ Banner de grace para owner ("parceiro será desconectado em N dias")
- ✅ Banner de grace para parceiro ("você será desconectado em N dias")
- ✅ **Após o grace**: cron `expire-trials` Fase 2 remove o parceiro de `family_members`
- ✅ Fichas de logística do ex-parceiro **permanecem** para o owner
- ✅ **Slot órfão editável**: owner pode reatribuir/liberar chip deixado pelo
  ex-parceiro (corrigido em `LogChip.tsx` — antes travava para sempre)

## G) Notificações de grace via WhatsApp
- ✅ Mensagem do owner ("seu parceiro será desconectado em N dias")
- ✅ Mensagem do parceiro ("sua conexão será encerrada em N dias")
- ✅ Aviso de grace é enviado **mesmo sem atividades** no período
  (corrigido `buildDailySummary`: o early-return só ocorre quando não há
  atividades **nem** aviso de grace)
- ⏳ Entrega real ao vivo — depende de credenciais WhatsApp (ver produção)

## H) Produção (pré-lançamento)
- ⏳ Deploy: variáveis Stripe na Vercel + webhook de produção
- ⏳ WhatsApp: configurar credenciais (Twilio sandbox p/ teste OU Meta Cloud
  API com template aprovado) — sem isso o envio falha com
  "WHATSAPP_TOKEN/WHATSAPP_PHONE_ID não configurados"
