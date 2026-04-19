-- OL-CONTENT-003: imágenes personales privadas por spot (solo dueño).

CREATE TABLE IF NOT EXISTS public.spot_personal_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id uuid NOT NULL REFERENCES public.spots(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  storage_path text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_spot_personal_images_spot_id ON public.spot_personal_images(spot_id);
CREATE INDEX IF NOT EXISTS idx_spot_personal_images_user_id ON public.spot_personal_images(user_id);

COMMENT ON TABLE public.spot_personal_images IS 'Galería privada por spot (solo dueño). Los archivos viven en bucket spot-personal.';

ALTER TABLE public.spot_personal_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "spot_personal_images_select_owner" ON public.spot_personal_images;
CREATE POLICY "spot_personal_images_select_owner"
  ON public.spot_personal_images FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "spot_personal_images_insert_owner" ON public.spot_personal_images;
CREATE POLICY "spot_personal_images_insert_owner"
  ON public.spot_personal_images FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.spots s
      WHERE s.id = spot_id
        AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "spot_personal_images_update_owner" ON public.spot_personal_images;
CREATE POLICY "spot_personal_images_update_owner"
  ON public.spot_personal_images FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "spot_personal_images_delete_owner" ON public.spot_personal_images;
CREATE POLICY "spot_personal_images_delete_owner"
  ON public.spot_personal_images FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

