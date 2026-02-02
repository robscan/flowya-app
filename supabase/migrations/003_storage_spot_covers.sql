-- Scope C: bucket para imágenes de portada de spots.
-- Una imagen por spot (cover_image_url). Público para lectura.

-- Crear bucket público para que getPublicUrl() sirva las imágenes sin auth
INSERT INTO storage.buckets (id, name, public)
VALUES ('spot-covers', 'spot-covers', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Permitir a cualquiera (anon) subir: necesario para flujo Create Spot sin auth
CREATE POLICY "spot-covers INSERT anon"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'spot-covers');

-- Permitir a authenticated subir
CREATE POLICY "spot-covers INSERT authenticated"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'spot-covers');

-- Lectura pública (bucket ya es public)
CREATE POLICY "spot-covers SELECT public"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'spot-covers');
