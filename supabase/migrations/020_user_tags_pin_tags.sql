-- OL-EXPLORE-TAGS-001: tags personales (owner-only) y relación spot–tag.

CREATE TABLE IF NOT EXISTS user_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_tags_user_slug_unique UNIQUE (user_id, slug)
);

CREATE INDEX IF NOT EXISTS user_tags_user_id_idx ON user_tags (user_id);
CREATE INDEX IF NOT EXISTS user_tags_slug_idx ON user_tags (user_id, slug);

CREATE TABLE IF NOT EXISTS pin_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  spot_id uuid NOT NULL REFERENCES spots (id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES user_tags (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pin_tags_user_spot_tag_unique UNIQUE (user_id, spot_id, tag_id)
);

CREATE INDEX IF NOT EXISTS pin_tags_user_id_idx ON pin_tags (user_id);
CREATE INDEX IF NOT EXISTS pin_tags_spot_id_idx ON pin_tags (spot_id);
CREATE INDEX IF NOT EXISTS pin_tags_tag_id_idx ON pin_tags (tag_id);

ALTER TABLE user_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_tags ENABLE ROW LEVEL SECURITY;

-- user_tags: solo el dueño
CREATE POLICY "user_tags_select_own" ON user_tags
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_tags_insert_own" ON user_tags
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_tags_update_own" ON user_tags
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_tags_delete_own" ON user_tags
  FOR DELETE USING (auth.uid() = user_id);

-- pin_tags: solo el dueño; además el spot debe ser del mismo usuario
CREATE POLICY "pin_tags_select_own" ON pin_tags
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "pin_tags_insert_own" ON pin_tags
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM spots s
      WHERE s.id = pin_tags.spot_id AND s.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM user_tags ut
      WHERE ut.id = pin_tags.tag_id AND ut.user_id = auth.uid()
    )
  );

CREATE POLICY "pin_tags_delete_own" ON pin_tags
  FOR DELETE USING (auth.uid() = user_id);

-- Rellenar user_id en INSERT si viene NULL (cliente puede omitirlo).
CREATE OR REPLACE FUNCTION pin_tags_set_user_id_on_insert()
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

DROP TRIGGER IF EXISTS pin_tags_set_user_id_trigger ON pin_tags;
CREATE TRIGGER pin_tags_set_user_id_trigger
  BEFORE INSERT ON pin_tags
  FOR EACH ROW
  EXECUTE FUNCTION pin_tags_set_user_id_on_insert();
