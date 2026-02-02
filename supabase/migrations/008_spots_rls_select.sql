-- Permitir lectura de spots para validación de duplicados (Scope G).
-- Si RLS está activo en spots, anon debe poder SELECT; si no hay políticas, la consulta falla.

ALTER TABLE spots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "spots_select_all" ON spots;
CREATE POLICY "spots_select_all" ON spots FOR SELECT USING (true);

DROP POLICY IF EXISTS "spots_insert_all" ON spots;
CREATE POLICY "spots_insert_all" ON spots FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "spots_update_all" ON spots;
CREATE POLICY "spots_update_all" ON spots FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "spots_delete_all" ON spots;
CREATE POLICY "spots_delete_all" ON spots FOR DELETE USING (true);
