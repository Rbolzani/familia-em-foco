-- Cadastro inicial de dados pessoais (LGPD / cobrança)
-- Estende public.profiles com os dados pessoais do usuário.
-- RLS já existente cobre as novas colunas (profiles_select_own / profiles_upsert_own).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name            text,
  ADD COLUMN IF NOT EXISTS phone                text,
  ADD COLUMN IF NOT EXISTS birth_date           date,
  ADD COLUMN IF NOT EXISTS cpf                  text,
  ADD COLUMN IF NOT EXISTS profile_completed_at timestamptz;

-- CPF único quando preenchido (evita contas duplicadas com mesmo CPF).
CREATE UNIQUE INDEX IF NOT EXISTS profiles_cpf_unique
  ON public.profiles (cpf) WHERE cpf IS NOT NULL;
