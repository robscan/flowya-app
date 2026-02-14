-- Soft delete por RPC: evita depender de políticas UPDATE en spots.
-- La función se ejecuta con SECURITY DEFINER y hace el UPDATE directamente;
-- solo usuarios autenticados pueden llamarla (GRANT EXECUTE TO authenticated).

CREATE OR REPLACE FUNCTION public.hide_spot(p_spot_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result_row jsonb;
BEGIN
  UPDATE spots
  SET is_hidden = true, updated_at = now()
  WHERE id = p_spot_id
  RETURNING jsonb_build_object('id', id, 'is_hidden', is_hidden, 'updated_at', updated_at) INTO result_row;

  IF result_row IS NULL THEN
    RAISE EXCEPTION 'Spot no encontrado o sin filas actualizadas' USING errcode = 'P0002';
  END IF;

  RETURN result_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.hide_spot(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hide_spot(uuid) TO service_role;

COMMENT ON FUNCTION public.hide_spot(uuid) IS 'Marca un spot como oculto (is_hidden=true). Solo usuarios autenticados. Bypasea RLS para evitar políticas restrictivas en UPDATE.';
