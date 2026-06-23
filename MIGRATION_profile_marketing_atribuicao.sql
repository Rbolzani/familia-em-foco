-- Consentimento de marketing (LGPD) + atribuição de aquisição.
-- RLS existente (profiles_select_own / profiles_upsert_own) cobre as colunas.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS marketing_consent     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_consent_at  timestamptz,
  ADD COLUMN IF NOT EXISTS acquisition_source    text,      -- "como conheceu" (escolha do usuário)
  ADD COLUMN IF NOT EXISTS signup_attribution    jsonb;     -- utm_* + referrer capturados no signup
