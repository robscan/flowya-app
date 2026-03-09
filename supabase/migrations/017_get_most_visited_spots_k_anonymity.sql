-- Añade umbral k-anonymity (HAVING COUNT(*) >= 3) a get_most_visited_spots.
-- Evita inferir visitas individuales cuando count=1..2.
-- Complementa 016 que ya está aplicada en Supabase.

CREATE OR REPLACE FUNCTION public.get_most_visited_spots(p_limit int DEFAULT 10)
RETURNS TABLE (
  id uuid,
  title text,
  description_short text,
  description_long text,
  cover_image_url text,
  address text,
  latitude double precision,
  longitude double precision,
  visit_count bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    s.id,
    s.title,
    s.description_short,
    s.description_long,
    s.cover_image_url,
    s.address,
    s.latitude,
    s.longitude,
    COUNT(*)::bigint AS visit_count
  FROM pins p
  INNER JOIN spots s ON s.id = p.spot_id
  WHERE p.visited = true
    AND (s.is_hidden = false OR s.is_hidden IS NULL)
  GROUP BY s.id, s.title, s.description_short, s.description_long,
    s.cover_image_url, s.address, s.latitude, s.longitude
  HAVING COUNT(*) >= 3
  ORDER BY visit_count DESC
  LIMIT greatest(1, least(coalesce(NULLIF(p_limit, 0), 10), 50));
$$;

COMMENT ON FUNCTION public.get_most_visited_spots(int) IS 'Devuelve spots ordenados por número de visitas (pins.visited=true). Umbral k>=3 para anonimización. Para empty-state de búsqueda.';
