/**
 * Lugares populares en Flowya (spots más visitados).
 * Fuente: RPC get_most_visited_spots.
 * Uso: empty-state de búsqueda cuando defaultSpotsForEmpty + landmarks dan pocos/ningún resultado.
 */

import type { SpotPinStatus } from '@/components/design-system/map-pins';
import { supabase } from '@/lib/supabase';
import { getPinsForSpots } from '@/lib/pins';

export type FlowyaPopularSpot = {
  id: string;
  title: string;
  description_short: string | null;
  description_long: string | null;
  cover_image_url: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  saved: boolean;
  visited: boolean;
  pinStatus?: SpotPinStatus;
  link_status?: 'linked' | 'uncertain' | 'unlinked' | null;
  linked_place_id?: string | null;
  linked_place_kind?: 'poi' | 'landmark' | null;
  linked_maki?: string | null;
};

type RpcRow = {
  id: string;
  title: string;
  description_short: string | null;
  description_long: string | null;
  cover_image_url: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  visit_count: number;
};

/**
 * Obtiene spots más visitados en Flowya (agregación entre usuarios).
 * Devuelve [] si falla o no hay datos.
 */
export async function fetchMostVisitedSpots(
  limit: number = 10,
): Promise<FlowyaPopularSpot[]> {
  try {
    const { data, error } = await supabase.rpc('get_most_visited_spots', {
      p_limit: limit,
    });
    if (error || !Array.isArray(data) || data.length === 0) {
      return [];
    }
    const rows = data as RpcRow[];
    const spotIds = rows.map((r) => r.id);
    const pinMap = await getPinsForSpots(spotIds);
    return rows.map((r) => {
      const state = pinMap.get(r.id);
      const saved = state?.saved ?? false;
      const visited = state?.visited ?? false;
      const pinStatus: SpotPinStatus = visited
        ? 'visited'
        : saved
          ? 'to_visit'
          : 'default';
      return {
        id: r.id,
        title: r.title,
        description_short: r.description_short,
        description_long: r.description_long,
        cover_image_url: r.cover_image_url,
        address: r.address,
        latitude: r.latitude,
        longitude: r.longitude,
        saved,
        visited,
        pinStatus,
      };
    });
  } catch {
    return [];
  }
}
