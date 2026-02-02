-- Permitir al usuario eliminar su propio pin (desactivar)
DROP POLICY IF EXISTS "pins DELETE own" ON pins;
CREATE POLICY "pins DELETE own" ON pins
  FOR DELETE USING (auth.uid() = user_id);
