-- Ejecutar en Supabase SQL Editor (Proyecto → SQL).
-- Copia cada bloque o el archivo entero; exporta resultados como CSV/JSON desde la UI si lo necesitas.

-- A) Columnas de public.profiles
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- B) Políticas RLS en profiles
SELECT
  polname AS policy_name,
  polcmd AS command,
  pg_get_expr(polqual, polrelid) AS using_expr,
  pg_get_expr(polwithcheck, polrelid) AS with_check_expr
FROM pg_policy
JOIN pg_class ON pg_class.oid = polrelid
JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
WHERE nspname = 'public'
  AND relname = 'profiles';

-- C) Triggers en public.profiles
SELECT
  tgname AS trigger_name,
  pg_get_triggerdef(oid) AS definition
FROM pg_trigger
WHERE tgrelid = 'public.profiles'::regclass
  AND NOT tgisinternal;

-- D) Triggers en auth.users relacionados con profiles (por nombre)
SELECT
  tgname AS trigger_name,
  pg_get_triggerdef(oid) AS definition
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
  AND NOT tgisinternal
  AND tgname LIKE '%profile%';

-- E) Bucket storage profile-avatars
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'profile-avatars';

-- F) Políticas storage.objects en profile-avatars
SELECT
  policyname,
  cmd AS command,
  qual::text AS using_expr,
  with_check::text AS with_check_expr
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%profile-avatar%';
