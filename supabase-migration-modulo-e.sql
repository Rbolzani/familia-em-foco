-- ══════════════════════════════════════════════════════════════
--  Módulo E — Logística entre Pais  (versão definitiva)
--  Execute INTEIRO no SQL Editor do Supabase
--  Seguro rodar quantas vezes quiser.
-- ══════════════════════════════════════════════════════════════

-- ── PASSO 0: Limpar tudo antes (idempotente) ──────────────────

DROP POLICY IF EXISTS "own"                 ON children;
DROP POLICY IF EXISTS "family_access"       ON children;
DROP POLICY IF EXISTS "own"                 ON activities;
DROP POLICY IF EXISTS "family_access"       ON activities;
DROP POLICY IF EXISTS "family_owner_write"  ON families;
DROP POLICY IF EXISTS "family_member_read"  ON families;
DROP POLICY IF EXISTS "family_member_read"  ON family_members;
DROP POLICY IF EXISTS "family_owner_manage" ON family_members;
DROP POLICY IF EXISTS "self_join"           ON family_members;
DROP POLICY IF EXISTS "invite_creator"      ON family_invites;
DROP POLICY IF EXISTS "invite_public_read"  ON family_invites;
DROP POLICY IF EXISTS "invite_accept"       ON family_invites;

-- ── PASSO 1: Criar tabelas ────────────────────────────────────

CREATE TABLE IF NOT EXISTS families (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL DEFAULT 'Minha Família',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS family_members (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id    UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  role         TEXT NOT NULL DEFAULT 'partner' CHECK (role IN ('owner', 'partner')),
  joined_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id, user_id)
);

CREATE TABLE IF NOT EXISTS family_invites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id   UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  invited_by  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token       UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS family_members_family_idx ON family_members(family_id);
CREATE INDEX IF NOT EXISTS family_members_user_idx   ON family_members(user_id);

ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS takes_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS picks_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- ── PASSO 2: Habilitar RLS ────────────────────────────────────

ALTER TABLE families       ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_invites ENABLE ROW LEVEL SECURITY;

-- ── PASSO 3: Função SECURITY DEFINER (bypassa RLS) ───────────
-- Evita recursão: policies em children/activities chamam esta
-- função que acessa family_members sem acionar outras policies.

CREATE OR REPLACE FUNCTION is_family_partner_of(p_owner_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM family_members fm
    JOIN families f ON f.id = fm.family_id
    WHERE f.created_by = p_owner_id
      AND fm.user_id   = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION get_or_create_family(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE v_id UUID;
BEGIN
  SELECT id INTO v_id FROM families WHERE created_by = p_user_id LIMIT 1;
  IF v_id IS NOT NULL THEN RETURN v_id; END IF;

  SELECT family_id INTO v_id FROM family_members WHERE user_id = p_user_id LIMIT 1;
  IF v_id IS NOT NULL THEN RETURN v_id; END IF;

  INSERT INTO families (created_by) VALUES (p_user_id) RETURNING id INTO v_id;
  INSERT INTO family_members (family_id, user_id, role) VALUES (v_id, p_user_id, 'owner');
  RETURN v_id;
END;
$$;

-- ── PASSO 4: Policies simples e sem recursão ──────────────────

-- families: dono lê/escreve; parceiros só leem
CREATE POLICY "family_owner_write" ON families
  FOR ALL USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "family_member_read" ON families
  FOR SELECT USING (
    auth.uid() = created_by OR is_family_partner_of(created_by)
  );

-- family_members: cada um vê o próprio registro; dono gerencia todos
CREATE POLICY "self_read" ON family_members
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "family_owner_manage" ON family_members
  FOR ALL USING (
    auth.uid() IN (SELECT created_by FROM families WHERE id = family_members.family_id)
  )
  WITH CHECK (
    auth.uid() IN (SELECT created_by FROM families WHERE id = family_members.family_id)
  );

CREATE POLICY "self_join" ON family_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- family_invites
CREATE POLICY "invite_creator" ON family_invites
  FOR ALL USING (auth.uid() = invited_by)
  WITH CHECK (auth.uid() = invited_by);

CREATE POLICY "invite_public_read" ON family_invites
  FOR SELECT USING (status = 'pending' AND expires_at > NOW());

CREATE POLICY "invite_accept" ON family_invites
  FOR UPDATE USING (status = 'pending' AND expires_at > NOW())
  WITH CHECK (status = 'accepted');

-- ── PASSO 5: Policies de children e activities ────────────────
-- Usa is_family_partner_of() para evitar recursão RLS

CREATE POLICY "family_access" ON children
  FOR ALL USING (
    auth.uid() = user_id OR is_family_partner_of(user_id)
  )
  WITH CHECK (
    auth.uid() = user_id OR is_family_partner_of(user_id)
  );

CREATE POLICY "family_access" ON activities
  FOR ALL USING (
    auth.uid() = user_id OR is_family_partner_of(user_id)
  )
  WITH CHECK (
    auth.uid() = user_id OR is_family_partner_of(user_id)
  );

-- ── VERIFICAÇÃO ───────────────────────────────────────────────
-- Após rodar, execute para confirmar:
-- SELECT tablename, policyname
-- FROM pg_policies
-- WHERE tablename IN ('children','activities','families','family_members','family_invites')
-- ORDER BY tablename, policyname;
