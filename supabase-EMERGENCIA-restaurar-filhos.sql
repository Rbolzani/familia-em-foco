-- ══════════════════════════════════════════════════════════════
--  EMERGÊNCIA — Restaurar acesso aos filhos
--  Execute ESTE arquivo PRIMEIRO no SQL Editor do Supabase
--  Apenas 3 comandos, sem dependências.
-- ══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "own"           ON children;
DROP POLICY IF EXISTS "family_access" ON children;

CREATE POLICY "own" ON children
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
