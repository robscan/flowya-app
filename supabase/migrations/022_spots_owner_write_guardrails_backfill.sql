-- Backfill crítico de seguridad:
-- En el historial existe un prefijo duplicado `018_*`, y Supabase compara/aplica
-- migraciones por versión. Esta migración con versión nueva garantiza aplicar
-- guardrails owner-only aunque la 018 original se haya omitido en algún entorno.

-- 1) Limpiar políticas de escritura actuales (INSERT/UPDATE/DELETE) en spots.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'spots'
      AND cmd IN ('INSERT', 'UPDATE', 'DELETE')
  )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON spots', r.policyname);
  END LOOP;
END $$;

-- 2) Reaplicar políticas owner-only para escritura.
CREATE POLICY "spots_insert_authenticated_owner" ON spots
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "spots_update_authenticated_owner" ON spots
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid())
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "spots_delete_authenticated_owner" ON spots
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- 3) Endurecer RPC SECURITY DEFINER para soft delete con validación de owner.
CREATE OR REPLACE FUNCTION public.hide_spot(p_spot_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result_row jsonb;
  caller_uid uuid;
BEGIN
  caller_uid := auth.uid();

  IF caller_uid IS NULL AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'No autenticado' USING errcode = '42501';
  END IF;

  UPDATE spots
  SET is_hidden = true, updated_at = now()
  WHERE id = p_spot_id
    AND (
      auth.role() = 'service_role'
      OR user_id = caller_uid
    )
  RETURNING jsonb_build_object('id', id, 'is_hidden', is_hidden, 'updated_at', updated_at) INTO result_row;

  IF result_row IS NULL THEN
    RAISE EXCEPTION 'Spot no encontrado o sin permisos' USING errcode = '42501';
  END IF;

  RETURN result_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.hide_spot(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hide_spot(uuid) TO service_role;
