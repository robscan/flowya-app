/**
 * Strategy de búsqueda para Create Spot (mode="places").
 * Mapbox forward; sin etapas; un solo batch (sin infinite scroll en S4).
 */

import type { SearchStrategyParams, SearchStrategyResult } from '@/hooks/search/useSearchControllerV2';
import { searchPlaces, type PlaceResult } from './searchPlaces';

export type CreatePlacesStrategyOptions = {
  getProximity?: () => { lat: number; lng: number } | null;
  getBbox?: () => { west: number; south: number; east: number; north: number } | null;
};

/**
 * Strategy para useSearchControllerV2 con mode="places".
 * Ignora stage/cursor; devuelve un batch de lugares (limit 12).
 */
export function createPlacesStrategy(
  opts: CreatePlacesStrategyOptions = {}
): (params: SearchStrategyParams) => Promise<SearchStrategyResult<PlaceResult>> {
  return async (
    params: SearchStrategyParams
  ): Promise<SearchStrategyResult<PlaceResult>> => {
    const { query } = params;
    const q = query.trim();
    if (!q) return { items: [], nextCursor: null, hasMore: false };

    const proximity = opts.getProximity?.() ?? null;
    const bbox = opts.getBbox?.() ?? null;

    const items = await searchPlaces(q, {
      limit: 12,
      ...(proximity && { proximity: { lat: proximity.lat, lng: proximity.lng } }),
      ...(bbox && { bbox: { west: bbox.west, south: bbox.south, east: bbox.east, north: bbox.north } }),
    });

    return {
      items,
      nextCursor: null,
      hasMore: false,
    };
  };
}
