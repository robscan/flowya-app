-- OL-PROFILE-004: marca de última actividad en app (Explorar, etc.).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_activity_at timestamptz;

COMMENT ON COLUMN public.profiles.last_activity_at IS
  'Última vez que la app registró actividad del usuario (p. ej. foco en Explorar).';

-- Opcional: alinear filas existentes con updated_at (solo si aún null)
UPDATE public.profiles
SET last_activity_at = updated_at
WHERE last_activity_at IS NULL;
