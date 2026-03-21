-- Bloquear hard delete de spots desde clientes (anon/authenticated).
-- Riesgo mitigado: pérdida masiva de datos porque pins tiene FK ON DELETE CASCADE hacia spots.
-- La vía válida de eliminación en producto es soft delete (is_hidden=true), no DELETE real.

ALTER TABLE spots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "spots_delete_all" ON spots;
DROP POLICY IF EXISTS "spots_delete_authenticated" ON spots;

REVOKE DELETE ON TABLE public.spots FROM anon;
REVOKE DELETE ON TABLE public.spots FROM authenticated;
