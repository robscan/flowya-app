/**
 * SpotsStrategy: viewport-first + progressive + limit + cursor.
 * Filtros aplicados en la "query" (aquí: sobre la lista ya filtrada por pin).
 * BBox estable (redondeo por zoom). Stage solo avanza en search() inicial; fetchMore mismo stage.
 */

import type { SpotPinStatus } from '@/components/design-system/map-pins';
import type { SearchStrategyParams, SearchStrategyResult } from '@/hooks/search/useSearchControllerV2';
import { distanceKm } from '@/lib/geo-utils';
import { expandBBox, stableBBox, type BBox } from './bbox';

const LIMIT_PER_BATCH = 25;

export type SpotForSearch = {
  id: string;
  title: string;
  description_short: string | null;
  cover_image_url: string | null;
  latitude: number;
  longitude: number;
  pinStatus?: SpotPinStatus;
};

export type CreateSpotsStrategyOptions = {
  getFilteredSpots: () => SpotForSearch[];
  getBbox: () => BBox | null;
  getZoom: () => number;
};

function centerOfBbox(bbox: BBox): { lat: number; lng: number } {
  return {
    lat: (bbox.south + bbox.north) / 2,
    lng: (bbox.west + bbox.east) / 2,
  };
}

export function createSpotsStrategy({
  getFilteredSpots,
  getBbox,
  getZoom,
}: CreateSpotsStrategyOptions): (
  params: SearchStrategyParams
) => Promise<SearchStrategyResult<SpotForSearch>> {
  return async (params: SearchStrategyParams): Promise<SearchStrategyResult<SpotForSearch>> => {
    const { query, stage, bbox, cursor } = params;
    const zoom = getZoom();
    let effectiveBbox: BBox | null = bbox ? stableBBox(bbox, zoom) : null;

    if (stage === 'expanded' && effectiveBbox) {
      effectiveBbox = stableBBox(expandBBox(effectiveBBox, 3), zoom);
    }
    if (stage === 'global') {
      effectiveBbox = null;
    }

    let list = getFilteredSpots();

    if (effectiveBbox) {
      list = list.filter(
        (s) =>
          s.latitude >= effectiveBbox!.south &&
          s.latitude <= effectiveBbox!.north &&
          s.longitude >= effectiveBbox!.west &&
          s.longitude <= effectiveBbox!.east
      );
    }

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((s) => s.title.toLowerCase().includes(q));
    }

    const center = effectiveBbox
      ? centerOfBbox(effectiveBbox)
      : { lat: 0, lng: 0 };
    const sorted = [...list].sort(
      (a, b) =>
        distanceKm(center.lat, center.lng, a.latitude, a.longitude) -
        distanceKm(center.lat, center.lng, b.latitude, b.longitude)
    );

    const offset = cursor ? Math.max(0, parseInt(cursor, 10)) : 0;
    const items = sorted.slice(offset, offset + LIMIT_PER_BATCH);
    const hasMore = sorted.length > offset + LIMIT_PER_BATCH;
    const nextCursor = hasMore ? String(offset + LIMIT_PER_BATCH) : null;

    return { items, nextCursor, hasMore };
  };
}
