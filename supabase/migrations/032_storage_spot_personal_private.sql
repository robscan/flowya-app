-- OL-CONTENT-003: bucket privado para fotos personales (solo dueño).
-- Nota: lectura NO pública; se accede con URLs firmadas.

INSERT INTO storage.buckets (id, name, public)
VALUES ('spot-personal', 'spot-personal', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Lectura: solo autenticado y dueño del spot (name = {spotId}/gallery/<file>)
DROP POLICY IF EXISTS "spot-personal SELECT owner" ON storage.objects;
CREATE POLICY "spot-personal SELECT owner"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'spot-personal'
    AND split_part(name, '/', 2) = 'gallery'
    AND EXISTS (
      SELECT 1
      FROM public.spots s
      WHERE s.id::text = split_part(name, '/', 1)
        AND s.user_id = auth.uid()
    )
  );

-- Escritura: solo dueño del spot (jpg)
DROP POLICY IF EXISTS "spot-personal INSERT gallery owner" ON storage.objects;
DROP POLICY IF EXISTS "spot-personal UPDATE gallery owner" ON storage.objects;
DROP POLICY IF EXISTS "spot-personal DELETE gallery owner" ON storage.objects;

CREATE POLICY "spot-personal INSERT gallery owner"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'spot-personal'
    AND split_part(name, '/', 2) = 'gallery'
    AND split_part(name, '/', 3) ~ '\.jpe?g$'
    AND coalesce(split_part(name, '/', 4), '') = ''
    AND EXISTS (
      SELECT 1
      FROM public.spots s
      WHERE s.id::text = split_part(name, '/', 1)
        AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "spot-personal UPDATE gallery owner"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'spot-personal'
    AND split_part(name, '/', 2) = 'gallery'
    AND split_part(name, '/', 3) ~ '\.jpe?g$'
    AND coalesce(split_part(name, '/', 4), '') = ''
    AND EXISTS (
      SELECT 1
      FROM public.spots s
      WHERE s.id::text = split_part(name, '/', 1)
        AND s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'spot-personal'
    AND split_part(name, '/', 2) = 'gallery'
    AND split_part(name, '/', 3) ~ '\.jpe?g$'
    AND coalesce(split_part(name, '/', 4), '') = ''
    AND EXISTS (
      SELECT 1
      FROM public.spots s
      WHERE s.id::text = split_part(name, '/', 1)
        AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "spot-personal DELETE gallery owner"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'spot-personal'
    AND split_part(name, '/', 2) = 'gallery'
    AND split_part(name, '/', 3) ~ '\.jpe?g$'
    AND coalesce(split_part(name, '/', 4), '') = ''
    AND EXISTS (
      SELECT 1
      FROM public.spots s
      WHERE s.id::text = split_part(name, '/', 1)
        AND s.user_id = auth.uid()
    )
  );

