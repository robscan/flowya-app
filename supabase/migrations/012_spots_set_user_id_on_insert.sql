-- A partir de ahora, los nuevos spots tienen user_id asignado si el insert viene de un usuario autenticado.
-- Spots legacy con user_id NULL no se modifican; la política spots_update_authenticated (010) permite
-- a cualquier usuario autenticado hacer soft delete (UPDATE is_hidden) sobre cualquier fila.

-- Columna user_id en spots si no existe (p. ej. en proyectos donde se creó manualmente o en prod).
ALTER TABLE spots
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Trigger: en INSERT, si user_id es NULL y hay usuario autenticado, asignar auth.uid().
CREATE OR REPLACE FUNCTION spots_set_user_id_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NULL AND auth.uid() IS NOT NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS spots_set_user_id_trigger ON spots;
CREATE TRIGGER spots_set_user_id_trigger
  BEFORE INSERT ON spots
  FOR EACH ROW
  EXECUTE FUNCTION spots_set_user_id_on_insert();
