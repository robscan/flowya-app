-- Critical security fix:
-- Restrict writes on spots to the owning authenticated user and
-- enforce ownership in hide_spot() to prevent cross-user soft deletes.

-- 1) Drop permissive INSERT/UPDATE/DELETE policies on spots.
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

-- 2) Recreate owner-scoped write policies.
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

-- 3) Enforce ownership in SECURITY DEFINER soft delete RPC.
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
