-- RPC: spots más visitados en Flowya (agregación entre usuarios).
-- Índice para acelerar agregación por visited + spot_id.
CREATE INDEX IF NOT EXISTS idx_pins_visited_spot_id ON pins (visited, spot_id) WHERE visited = true;
-- Uso: empty-state de búsqueda (Lugares populares en Flowya).
-- SECURITY DEFINER: permite leer pins de todos los usuarios para agregar visit_count.
-- No expone user_id; solo spot_id + visit_count + columnas públicas de spots.
-- HAVING COUNT(*) >= 3: k-anonymity, evita inferir visitas individuales con count=1..2.

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

GRANT EXECUTE ON FUNCTION public.get_most_visited_spots(int) TO anon;
GRANT EXECUTE ON FUNCTION public.get_most_visited_spots(int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_most_visited_spots(int) TO service_role;

COMMENT ON FUNCTION public.get_most_visited_spots(int) IS 'Devuelve spots ordenados por número de visitas (pins.visited=true). Para empty-state de búsqueda. SECURITY DEFINER para agregar entre usuarios.';
