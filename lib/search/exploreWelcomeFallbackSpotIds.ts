/**
 * Sheet inicial Explorar — fallback cuando `get_most_visited_spots` no devuelve filas
 * (poco volumen de visitas / estadísticas vacías).
 *
 * Orden = orden de la lista en UI. Sustituir por UUIDs de spots reales en prod/staging.
 * Si el array está vacío y el RPC falla o viene vacío, el sheet muestra el estado vacío.
 *
 * @see fetchMostVisitedSpots — fuente preferida (agregación visitas).
 */

export const EXPLORE_WELCOME_FALLBACK_SPOT_IDS: string[] = [];
