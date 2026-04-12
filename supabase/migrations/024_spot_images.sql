-- OL-CONTENT-002: imágenes adicionales por spot (galería ordenada).
-- Portada canónica sigue en spots.cover_image_url; primera imagen de la galería puede sincronizarse allí en app.

CREATE TABLE IF NOT EXISTS public.spot_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id uuid NOT NULL REFERENCES public.spots(id) ON DELETE CASCADE,
  url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_spot_images_spot_id ON public.spot_images(spot_id);

COMMENT ON TABLE public.spot_images IS 'Galería ordenada por spot (OL-CONTENT-002). URLs públicas Storage bucket spot-covers.';

ALTER TABLE public.spot_images ENABLE ROW LEVEL SECURITY;

-- Lectura: alineada a spots (exploración pública).
DROP POLICY IF EXISTS "spot_images_select_all" ON public.spot_images;
CREATE POLICY "spot_images_select_all"
  ON public.spot_images FOR SELECT
  USING (true);

-- Escritura: solo el dueño del spot (misma regla que spots).
DROP POLICY IF EXISTS "spot_images_insert_owner" ON public.spot_images;
CREATE POLICY "spot_images_insert_owner"
  ON public.spot_images FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.spots s
      WHERE s.id = spot_id
        AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "spot_images_update_owner" ON public.spot_images;
CREATE POLICY "spot_images_update_owner"
  ON public.spot_images FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.spots s
      WHERE s.id = spot_id
        AND s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.spots s
      WHERE s.id = spot_id
        AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "spot_images_delete_owner" ON public.spot_images;
CREATE POLICY "spot_images_delete_owner"
  ON public.spot_images FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.spots s
      WHERE s.id = spot_id
        AND s.user_id = auth.uid()
    )
  );
