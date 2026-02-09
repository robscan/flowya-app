-- Permite a usuarios autenticados hacer UPDATE en spots (soft delete is_hidden).
-- Si la política actual exige auth.uid() = user_id, los spots con user_id NULL (legacy)
-- fallan con "new row violates row-level security policy". Esta política adicional
-- asegura que cualquier usuario autenticado pueda ejecutar UPDATE (p. ej. soft delete).
-- Las políticas para el mismo comando se combinan con OR.

DROP POLICY IF EXISTS "spots_update_authenticated" ON spots;
CREATE POLICY "spots_update_authenticated" ON spots
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
