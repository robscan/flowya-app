-- OL-EXPLORE-TAGS-001: el cliente puede insertar solo { name, slug }; user_id se rellena con auth.uid()
-- para que la política RLS "user_tags_insert_own" (auth.uid() = user_id) se cumpla.

CREATE OR REPLACE FUNCTION user_tags_set_user_id_on_insert()
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

DROP TRIGGER IF EXISTS user_tags_set_user_id_trigger ON user_tags;
CREATE TRIGGER user_tags_set_user_id_trigger
  BEFORE INSERT ON user_tags
  FOR EACH ROW
  EXECUTE FUNCTION user_tags_set_user_id_on_insert();
