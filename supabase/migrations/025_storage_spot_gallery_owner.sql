-- Escrituras en spot-covers bajo {spotId}/gallery/*.jpg — solo dueño del spot (complementa 022).

DROP POLICY IF EXISTS "spot-covers INSERT gallery owner" ON storage.objects;
DROP POLICY IF EXISTS "spot-covers UPDATE gallery owner" ON storage.objects;
DROP POLICY IF EXISTS "spot-covers DELETE gallery owner" ON storage.objects;

CREATE POLICY "spot-covers INSERT gallery owner"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'spot-covers'
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

CREATE POLICY "spot-covers UPDATE gallery owner"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'spot-covers'
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
    bucket_id = 'spot-covers'
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

CREATE POLICY "spot-covers DELETE gallery owner"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'spot-covers'
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
