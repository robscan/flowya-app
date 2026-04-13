-- OL-PROFILE-002: avatar en Storage (ruta en DB), sin URL libre en texto.
-- Reemplaza `avatar_url` por `avatar_storage_path` (objeto en bucket `profile-avatars`).

ALTER TABLE public.profiles DROP COLUMN IF EXISTS avatar_url;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_storage_path text;
COMMENT ON COLUMN public.profiles.avatar_storage_path IS 'Clave en bucket profile-avatars (p. ej. {user_id}/avatar.jpg).';

INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-avatars', 'profile-avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "profile-avatars SELECT public" ON storage.objects;
CREATE POLICY "profile-avatars SELECT public"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'profile-avatars');

DROP POLICY IF EXISTS "profile-avatars INSERT own" ON storage.objects;
CREATE POLICY "profile-avatars INSERT own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-avatars'
    AND split_part(name, '/', 1) = auth.uid()::text
    AND split_part(name, '/', 2) = 'avatar.jpg'
    AND coalesce(split_part(name, '/', 3), '') = ''
  );

DROP POLICY IF EXISTS "profile-avatars UPDATE own" ON storage.objects;
CREATE POLICY "profile-avatars UPDATE own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-avatars'
    AND split_part(name, '/', 1) = auth.uid()::text
    AND split_part(name, '/', 2) = 'avatar.jpg'
    AND coalesce(split_part(name, '/', 3), '') = ''
  )
  WITH CHECK (
    bucket_id = 'profile-avatars'
    AND split_part(name, '/', 1) = auth.uid()::text
    AND split_part(name, '/', 2) = 'avatar.jpg'
    AND coalesce(split_part(name, '/', 3), '') = ''
  );

DROP POLICY IF EXISTS "profile-avatars DELETE own" ON storage.objects;
CREATE POLICY "profile-avatars DELETE own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-avatars'
    AND split_part(name, '/', 1) = auth.uid()::text
    AND split_part(name, '/', 2) = 'avatar.jpg'
    AND coalesce(split_part(name, '/', 3), '') = ''
  );
