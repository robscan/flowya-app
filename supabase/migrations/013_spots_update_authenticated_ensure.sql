-- Asegura que usuarios autenticados puedan hacer UPDATE en spots (soft delete).
-- Si en BD existe solo una política que exige auth.uid() = user_id, los spots con user_id NULL
-- fallan con "new row violates row-level security policy" (403). Esta migración elimina
-- TODAS las políticas UPDATE actuales en spots y crea una única política permissiva para
-- authenticated, de modo que soft delete (is_hidden=true) funcione también en filas legacy.

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'spots' AND cmd = 'UPDATE')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON spots', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "spots_update_authenticated" ON spots
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Si el bloque DO falla (p. ej. pg_policies no existe o distinto), ejecuta solo esto en SQL Editor:
--   DROP POLICY IF EXISTS "spots_update_all" ON spots;
--   DROP POLICY IF EXISTS "spots_update_authenticated" ON spots;
--   CREATE POLICY "spots_update_authenticated" ON spots FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
