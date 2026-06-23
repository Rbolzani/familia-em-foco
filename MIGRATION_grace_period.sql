-- Grace period de 5 dias antes de desconectar parceiros ao expirar trial
-- Rodar no Supabase → SQL Editor

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS partner_grace_until timestamptz;

COMMENT ON COLUMN public.subscriptions.partner_grace_until IS
  'Quando o trial expira e há parceiros ativos, esta data marca o fim do período de graça (trial_ends_at + 5 dias). Após esta data o cron expire-trials remove os parceiros da family_members.';
