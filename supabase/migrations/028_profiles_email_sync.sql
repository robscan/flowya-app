-- OL-PROFILE-003: email en `profiles` (copia de auth.users) + triggers de sincronización.
-- Idempotente en lo posible. Requiere que existan `public.profiles` (026) y columna avatar (027).

-- 1) Columna email
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text;

COMMENT ON COLUMN public.profiles.email IS
  'Email copiado desde auth.users; sincronizado por triggers. La app no debe confiar en PATCH manual.';

-- 2) Rellenar desde auth (usuarios ya existentes)
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
  AND (p.email IS DISTINCT FROM u.email OR p.email IS NULL);

-- 3) Al crear usuario: insertar perfil con id + email
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$;

-- 4) Si cambia el email en auth, propagar a profiles
CREATE OR REPLACE FUNCTION public.auth_users_sync_profile_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET email = NEW.email
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_sync_profiles ON auth.users;
CREATE TRIGGER on_auth_user_email_sync_profiles
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.auth_users_sync_profile_email();

-- 5) En cada INSERT/UPDATE de fila en profiles, forzar email = auth.users (evita spoof desde cliente)
CREATE OR REPLACE FUNCTION public.profiles_enforce_email_from_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  SELECT u.email INTO v_email FROM auth.users u WHERE u.id = NEW.id;
  NEW.email := v_email;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_enforce_email_from_auth_trigger ON public.profiles;
CREATE TRIGGER profiles_enforce_email_from_auth_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_enforce_email_from_auth();
