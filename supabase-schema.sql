-- ══════════════════════════════════════════════════════════════
--  Gestão de Filhos — Schema adicional para Supabase
--  Execute no SQL Editor do Supabase (mesmo projeto do Vault).
--  As tabelas do Vault (repositories, document_types, documents) já existem.
-- ══════════════════════════════════════════════════════════════

-- ── Filhos ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS children (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  birth_date   DATE,
  school_name  TEXT,
  avatar_color TEXT NOT NULL DEFAULT '#4f46e5',
  sort_order   INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE children ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own" ON children
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Atividades (Escola / Saúde / Extracurricular) ──────────────

CREATE TABLE IF NOT EXISTS activities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id      UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  category      TEXT NOT NULL CHECK (category IN ('escola', 'saude', 'extracurricular')),
  title         TEXT NOT NULL,
  description   TEXT,
  date          DATE NOT NULL,
  time          TIME,
  alert_days    INTEGER NOT NULL DEFAULT 3,
  status        TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'concluido', 'cancelado')),
  location      TEXT,
  recurrence    TEXT,
  ai_generated  BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own" ON activities
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS activities_child_id_idx  ON activities(child_id);
CREATE INDEX IF NOT EXISTS activities_date_idx       ON activities(date);
CREATE INDEX IF NOT EXISTS activities_category_idx   ON activities(category);
CREATE INDEX IF NOT EXISTS activities_user_date_idx  ON activities(user_id, date);

-- ── Inputs de IA (histórico de fotos/textos processados) ───────

CREATE TABLE IF NOT EXISTS ai_inputs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id             UUID REFERENCES children(id) ON DELETE SET NULL,
  raw_text             TEXT,
  image_url            TEXT,
  extracted_activities JSONB,
  status               TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'confirmed')),
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_inputs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own" ON ai_inputs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Storage: bucket "ai-inputs" para fotos enviadas ────────────
-- Crie manualmente: Storage → New bucket → "ai-inputs" → Private
-- Depois adicione as policies abaixo:

CREATE POLICY "User reads own ai files"
ON storage.objects FOR SELECT USING (
  bucket_id = 'ai-inputs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "User uploads own ai files"
ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'ai-inputs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "User deletes own ai files"
ON storage.objects FOR DELETE USING (
  bucket_id = 'ai-inputs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ── Função: atualizar updated_at automaticamente ───────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER activities_updated_at
  BEFORE UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
