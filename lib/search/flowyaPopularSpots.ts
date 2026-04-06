/**
 * Lugares populares en Flowya (spots más visitados).
 * Fuente: RPC get_most_visited_spots.
 * Uso: empty-state de búsqueda cuando defaultSpotsForEmpty + landmarks dan pocos/ningún resultado;
 * sheet inicial Explorar: RPC primero, si vacío IDs curados (`fetchSpotsByIdsForExploreWelcome`).
 */

import type { SpotPinStatus } from '@/components/design-system/map-pins';
import type { PinState } from '@/lib/pins';
import { getPinsForSpots } from '@/lib/pins';
import { supabase } from '@/lib/supabase';

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

type SpotRow = {
  id: string;
  title: string;
  description_short: string | null;
  description_long: string | null;
  cover_image_url: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  link_status: 'linked' | 'uncertain' | 'unlinked' | null;
  linked_place_id: string | null;
  linked_place_kind: 'poi' | 'landmark' | null;
  linked_maki: string | null;
};

function rowToFlowyaPopular(
  r: Pick<
    SpotRow,
    | 'id'
    | 'title'
    | 'description_short'
    | 'description_long'
    | 'cover_image_url'
    | 'address'
    | 'latitude'
    | 'longitude'
    | 'link_status'
    | 'linked_place_id'
    | 'linked_place_kind'
    | 'linked_maki'
  >,
  pinMap: Map<string, PinState>,
): FlowyaPopularSpot {
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
    link_status: r.link_status,
    linked_place_id: r.linked_place_id,
    linked_place_kind: r.linked_place_kind,
    linked_maki: r.linked_maki,
  };
}

/**
 * Carga spots por IDs en el orden indicado (sheet inicial / fallback manual).
 * Omite IDs inexistentes. Devuelve [] si falla o no hay filas.
 */
export async function fetchSpotsByIdsForExploreWelcome(
  orderedIds: string[],
): Promise<FlowyaPopularSpot[]> {
  const raw = orderedIds.filter((id) => typeof id === 'string' && id.trim().length > 0);
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const id of raw) {
    if (seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  if (ids.length === 0) return [];
  try {
    const { data, error } = await supabase
      .from('spots')
      .select(
        'id, title, description_short, description_long, cover_image_url, address, latitude, longitude, link_status, linked_place_id, linked_place_kind, linked_maki',
      )
      .in('id', ids);
    if (error || !Array.isArray(data) || data.length === 0) {
      return [];
    }
    const byId = new Map((data as SpotRow[]).map((r) => [r.id, r]));
    const pinMap = await getPinsForSpots(ids);
    const out: FlowyaPopularSpot[] = [];
    for (const id of ids) {
      const r = byId.get(id);
      if (r) out.push(rowToFlowyaPopular(r, pinMap));
    }
    return out;
  } catch {
    return [];
  }
}

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
    return rows.map((r) =>
      rowToFlowyaPopular(
        {
          id: r.id,
          title: r.title,
          description_short: r.description_short,
          description_long: r.description_long,
          cover_image_url: r.cover_image_url,
          address: r.address,
          latitude: r.latitude,
          longitude: r.longitude,
          link_status: null,
          linked_place_id: null,
          linked_place_kind: null,
          linked_maki: null,
        },
        pinMap,
      ),
    );
  } catch {
    return [];
  }
}
