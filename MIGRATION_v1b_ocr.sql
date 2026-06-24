-- ============================================================================
-- MIGRATION v1b — OCR de documentos (cofre inteligente)
-- ============================================================================
-- Aplicada em produção (Supabase fawsbgxmrbpgcnlhjoao) em 2026-06-23 via MCP.
-- Aditiva e não-destrutiva.
--
-- Entrega:
--   • documents.ocr_text   — texto do documento extraído por IA no upload
--   • documents.search_tsv — tsvector (português) p/ busca full-text de conteúdo
--   • índice GIN p/ busca rápida
--
-- Nota: tsvector mantido por TRIGGER (não coluna GENERATED) porque a expressão
-- com array_to_string não é aceita como IMMUTABLE em coluna gerada.
-- ============================================================================

ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS ocr_text text;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS search_tsv tsvector;

CREATE OR REPLACE FUNCTION public.documents_search_tsv_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_tsv := to_tsvector('portuguese',
    coalesce(NEW.title,'')      || ' ' ||
    coalesce(NEW.description,'') || ' ' ||
    coalesce(NEW.doc_number,'')  || ' ' ||
    coalesce(NEW.issuer,'')      || ' ' ||
    coalesce(array_to_string(NEW.tags,' '),'') || ' ' ||
    coalesce(NEW.ocr_text,''));
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS documents_search_tsv_trg ON public.documents;
CREATE TRIGGER documents_search_tsv_trg
  BEFORE INSERT OR UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.documents_search_tsv_update();

UPDATE public.documents SET search_tsv = to_tsvector('portuguese',
  coalesce(title,'')      || ' ' ||
  coalesce(description,'') || ' ' ||
  coalesce(doc_number,'')  || ' ' ||
  coalesce(issuer,'')      || ' ' ||
  coalesce(array_to_string(tags,' '),'') || ' ' ||
  coalesce(ocr_text,''));

CREATE INDEX IF NOT EXISTS documents_search_idx
  ON public.documents USING gin(search_tsv);
