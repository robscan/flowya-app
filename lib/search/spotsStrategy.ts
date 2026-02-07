/**
 * SpotsStrategy: viewport-first + progressive + limit + cursor.
 * Filtros aplicados en la "query" (aquí: sobre la lista ya filtrada por pin).
 * BBox estable (redondeo por zoom). Stage solo avanza en search() inicial; fetchMore mismo stage.
 */

import type { SpotPinStatus } from '@/components/design-system/map-pins';
import type { SearchStrategyParams, SearchStrategyResult } from '@/hooks/search/useSearchControllerV2';
import { distanceKm } from '@/lib/geo-utils';
import { expandBBox, stableBBox, type BBox } from './bbox';
import { normalizeQuery } from './normalize';

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
    if (bbox == null && stage !== 'global') {
      return { items: [], nextCursor: null, hasMore: false };
    }
    const zoom = getZoom();
    let bboxFilter: BBox | null = bbox ? stableBBox(bbox, zoom) : null;
    if (stage === 'expanded' && bboxFilter) {
      bboxFilter = stableBBox(expandBBox(bboxFilter, 3), zoom);
    }
    if (stage === 'global') {
      bboxFilter = null;
    }

    let list = getFilteredSpots();
    if (bboxFilter) {
      list = list.filter(
        (s) =>
          s.latitude >= bboxFilter!.south &&
          s.latitude <= bboxFilter!.north &&
          s.longitude >= bboxFilter!.west &&
          s.longitude <= bboxFilter!.east
      );
    }

    const q = normalizeQuery(query);
    if (q) {
      list = list.filter((s) => normalizeQuery(s.title ?? '').includes(q));
    }

    const center = bboxFilter ? centerOfBbox(bboxFilter) : { lat: 0, lng: 0 };
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
