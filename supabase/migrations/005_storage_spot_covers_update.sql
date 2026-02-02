-- Permitir upsert (reemplazar) en spot-covers: necesario al "Cambiar foto" tras haber subido antes.
CREATE POLICY "spot-covers UPDATE anon"
ON storage.objects FOR UPDATE
TO anon
USING (bucket_id = 'spot-covers')
WITH CHECK (bucket_id = 'spot-covers');

CREATE POLICY "spot-covers UPDATE authenticated"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'spot-covers')
WITH CHECK (bucket_id = 'spot-covers');
