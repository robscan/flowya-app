-- Pins V1: status is legacy and derived from saved/visited.
-- Non destructive:
-- - preserves existing pins;
-- - normalizes any saved+visited ambiguity to visited-only;
-- - accepts legacy writes that only send status;
-- - rejects rows that would have neither saved nor visited.

CREATE TABLE IF NOT EXISTS public.pins_status_guard_037_backup AS
SELECT *
FROM public.pins
WHERE
  (visited = true AND saved = true)
  OR (visited = true AND status IS DISTINCT FROM 'visited')
  OR (visited = false AND saved = true AND status IS DISTINCT FROM 'to_visit')
  OR (visited = false AND saved = false);

CREATE OR REPLACE FUNCTION public.normalize_pin_status_from_flags()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.saved := COALESCE(NEW.saved, false);
  NEW.visited := COALESCE(NEW.visited, false);

  -- Compatibility with older callers that still write only legacy status.
  IF NEW.saved = false AND NEW.visited = false THEN
    IF NEW.status = 'visited' THEN
      NEW.visited := true;
    ELSIF NEW.status = 'to_visit' THEN
      NEW.saved := true;
    END IF;
  END IF;

  IF NEW.visited = true THEN
    NEW.saved := false;
    NEW.status := 'visited';
  ELSIF NEW.saved = true THEN
    NEW.status := 'to_visit';
  ELSE
    RAISE EXCEPTION 'pins rows must have saved=true or visited=true';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pins_status_derived_guard ON public.pins;

CREATE TRIGGER pins_status_derived_guard
BEFORE INSERT OR UPDATE OF saved, visited, status
ON public.pins
FOR EACH ROW
EXECUTE FUNCTION public.normalize_pin_status_from_flags();

UPDATE public.pins
SET
  saved = CASE WHEN visited = true THEN false ELSE saved END,
  status = CASE
    WHEN visited = true THEN 'visited'
    WHEN saved = true THEN 'to_visit'
    ELSE status
  END
WHERE
  (visited = true AND saved = true)
  OR (visited = true AND status IS DISTINCT FROM 'visited')
  OR (visited = false AND saved = true AND status IS DISTINCT FROM 'to_visit')
  OR (visited = false AND saved = false);

COMMENT ON COLUMN public.pins.status IS
  'LEGACY: derived by trigger from saved/visited. V1 source of truth: saved, visited. States are exclusive; visited wins.';

COMMENT ON FUNCTION public.normalize_pin_status_from_flags() IS
  'Keeps pins.status as legacy derived data from saved/visited and prevents rows without a real pin state.';
