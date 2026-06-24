-- ============================================================================
-- MIGRATION v1b — OCR de documentos (cofre inteligente)
-- ============================================================================
-- Aplicada em produção (Supabase fawsbgxmrbpgcnlhjoao) em 2026-06-23/24 via MCP.
-- Aditiva e não-destrutiva.
--
-- Entrega:
--   • documents.ocr_text       — texto do documento extraído por IA no upload
--   • documents.search_tsv     — tsvector (português) p/ busca por palavras
--   • documents.content_digits — só os dígitos do conteúdo, p/ busca de número
--                                de documento à prova de formatação
--   • índice GIN p/ o tsvector
--
-- Notas:
--   - tsvector/content_digits mantidos por TRIGGER (não coluna GENERATED) porque
--     a expressão com array_to_string não é aceita como IMMUTABLE em coluna gerada.
--   - A BUSCA da UI usa ILIKE (substring) em ocr_text/doc_number/title/description/
--     issuer + content_digits (dígitos). Full-text/tsvector falha com nº de
--     documento (tokeniza por palavra); ILIKE acha pedaços e números parciais.
--     O search_tsv fica disponível para uso futuro (busca por palavras com stem).
-- ============================================================================

ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS ocr_text text;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS search_tsv tsvector;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS content_digits text;

CREATE OR REPLACE FUNCTION public.documents_search_tsv_update()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE combined text;
BEGIN
  combined :=
    coalesce(NEW.title,'')      || ' ' ||
    coalesce(NEW.description,'') || ' ' ||
    coalesce(NEW.doc_number,'')  || ' ' ||
    coalesce(NEW.issuer,'')      || ' ' ||
    coalesce(array_to_string(NEW.tags,' '),'') || ' ' ||
    coalesce(NEW.ocr_text,'');
  NEW.search_tsv     := to_tsvector('portuguese', combined);
  NEW.content_digits := regexp_replace(combined, '\D', '', 'g');
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS documents_search_tsv_trg ON public.documents;
CREATE TRIGGER documents_search_tsv_trg
  BEFORE INSERT OR UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.documents_search_tsv_update();

-- Backfill das linhas existentes
UPDATE public.documents SET
  search_tsv = to_tsvector('portuguese',
    coalesce(title,'')      || ' ' || coalesce(description,'') || ' ' ||
    coalesce(doc_number,'')  || ' ' || coalesce(issuer,'')     || ' ' ||
    coalesce(array_to_string(tags,' '),'') || ' ' || coalesce(ocr_text,'')),
  content_digits = regexp_replace(
    coalesce(title,'')      || ' ' || coalesce(description,'') || ' ' ||
    coalesce(doc_number,'')  || ' ' || coalesce(issuer,'')     || ' ' ||
    coalesce(array_to_string(tags,' '),'') || ' ' || coalesce(ocr_text,''),
    '\D', '', 'g');

CREATE INDEX IF NOT EXISTS documents_search_idx
  ON public.documents USING gin(search_tsv);
