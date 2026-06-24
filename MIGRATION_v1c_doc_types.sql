-- ============================================================================
-- MIGRATION v1c — Natureza do documento + campos específicos (cofre inteligente)
-- ============================================================================
-- Aplicada em produção (Supabase fawsbgxmrbpgcnlhjoao) em 2026-06-24 via MCP.
-- Aditiva e não-destrutiva.
--
-- Entrega:
--   • documents.doc_type text   — natureza detectada (identidade, contrato,
--     boleto, exame_medico, receita_medica, carteirinha_saude, vacinacao,
--     boletim_escolar, autorizacao, outro). Ver src/lib/docTypes.ts.
--   • documents.metadata jsonb  — campos específicos do tipo (chave→valor).
--   • trigger de busca passa a indexar os valores do metadata (acha por nome de
--     médico, parte de contrato, beneficiário, vacina, etc.).
-- ============================================================================

ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS doc_type text;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.documents_search_tsv_update()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE combined text; meta_text text;
BEGIN
  meta_text := coalesce((
    SELECT string_agg(v.value, ' ')
    FROM jsonb_each_text(coalesce(NEW.metadata, '{}'::jsonb)) v
  ), '');
  combined :=
    coalesce(NEW.title,'')      || ' ' ||
    coalesce(NEW.description,'') || ' ' ||
    coalesce(NEW.doc_number,'')  || ' ' ||
    coalesce(NEW.issuer,'')      || ' ' ||
    coalesce(array_to_string(NEW.tags,' '),'') || ' ' ||
    coalesce(NEW.ocr_text,'')    || ' ' ||
    meta_text;
  NEW.search_tsv     := to_tsvector('portuguese', combined);
  NEW.content_digits := regexp_replace(combined, '\D', '', 'g');
  RETURN NEW;
END $$;

-- Reindexa as linhas existentes (dispara o BEFORE UPDATE).
UPDATE public.documents SET metadata = metadata;
