-- OL-CONTENT-003: preferencia de compartir fotos (consentimiento 1a vez).
-- Nullable: null = no decidido (mostrar modal antes de primer upload).

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS share_photos_with_world boolean;

COMMENT ON COLUMN public.profiles.share_photos_with_world IS
  'Preferencia del usuario: true = fotos públicas; false = fotos privadas; null = no decidido (mostrar modal).';

