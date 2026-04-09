-- Endurece escrituras en spot-covers: solo el dueño del spot puede crear/reemplazar/borrar su portada.
-- Mitiga sobrescritura cruzada por ruta predecible {spot_id}/cover.jpg.

DROP POLICY IF EXISTS "spot-covers INSERT anon" ON storage.objects;
DROP POLICY IF EXISTS "spot-covers INSERT authenticated" ON storage.objects;
DROP POLICY IF EXISTS "spot-covers UPDATE anon" ON storage.objects;
DROP POLICY IF EXISTS "spot-covers UPDATE authenticated" ON storage.objects;

DROP POLICY IF EXISTS "spot-covers INSERT owner" ON storage.objects;
DROP POLICY IF EXISTS "spot-covers UPDATE owner" ON storage.objects;
DROP POLICY IF EXISTS "spot-covers DELETE owner" ON storage.objects;

CREATE POLICY "spot-covers INSERT owner"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'spot-covers'
  AND split_part(name, '/', 2) = 'cover.jpg'
  AND split_part(name, '/', 3) = ''
  AND EXISTS (
    SELECT 1
    FROM public.spots s
    WHERE s.id::text = split_part(name, '/', 1)
      AND s.user_id = auth.uid()
  )
);

CREATE POLICY "spot-covers UPDATE owner"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'spot-covers'
  AND split_part(name, '/', 2) = 'cover.jpg'
  AND split_part(name, '/', 3) = ''
  AND EXISTS (
    SELECT 1
    FROM public.spots s
    WHERE s.id::text = split_part(name, '/', 1)
      AND s.user_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'spot-covers'
  AND split_part(name, '/', 2) = 'cover.jpg'
  AND split_part(name, '/', 3) = ''
  AND EXISTS (
    SELECT 1
    FROM public.spots s
    WHERE s.id::text = split_part(name, '/', 1)
      AND s.user_id = auth.uid()
  )
);

CREATE POLICY "spot-covers DELETE owner"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'spot-covers'
  AND split_part(name, '/', 2) = 'cover.jpg'
  AND split_part(name, '/', 3) = ''
  AND EXISTS (
    SELECT 1
    FROM public.spots s
    WHERE s.id::text = split_part(name, '/', 1)
      AND s.user_id = auth.uid()
  )
);
