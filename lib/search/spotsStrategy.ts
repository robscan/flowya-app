/**
 * SpotsStrategy: viewport-first + progressive + limit + cursor.
 * Filtros aplicados en la "query" (aquí: sobre la lista ya filtrada por pin).
 * BBox estable (redondeo por zoom). Stage solo avanza en search() inicial; fetchMore mismo stage.
 */

import type { SpotPinStatus } from '@/components/design-system/map-pins';
import type { SearchStrategyParams, SearchStrategyResult } from '@/hooks/search/useSearchControllerV2';
import { distanceKm } from '@/lib/geo-utils';
import { expandBBox, stableBBox, type BBox } from './bbox';
import { expandCountryQueryAliases } from './country-query-aliases';
import { normalizeQuery } from './normalize';

const LIMIT_PER_BATCH = 25;

export type SpotForSearch = {
  id: string;
  title: string;
  description_short: string | null;
  address?: string | null;
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

function isPinnedStatus(pinStatus: SpotPinStatus | undefined): boolean {
  return pinStatus === 'to_visit' || pinStatus === 'visited';
}

function resolvePinFilter(filters: unknown): 'all' | 'saved' | 'visited' {
  if (filters === 'saved' || filters === 'visited' || filters === 'all') return filters;
  if (
    typeof filters === 'object' &&
    filters !== null &&
    'pinFilter' in filters &&
    ((filters as { pinFilter?: unknown }).pinFilter === 'saved' ||
      (filters as { pinFilter?: unknown }).pinFilter === 'visited' ||
      (filters as { pinFilter?: unknown }).pinFilter === 'all')
  ) {
    return (filters as { pinFilter: 'all' | 'saved' | 'visited' }).pinFilter;
  }
  return 'all';
}

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
    const { query, stage, bbox, filters, cursor } = params;
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
      const queryAliases = expandCountryQueryAliases(q);
      list = list.filter((s) => {
        const title = normalizeQuery(s.title ?? '');
        const desc = normalizeQuery(s.description_short ?? '');
        const address = normalizeQuery(s.address ?? '');
        const titleMatch = queryAliases.some((alias) => title.includes(alias));
        if (titleMatch) return true;
        const descMatch = queryAliases.some((alias) => desc.includes(alias));
        if (descMatch) return true;
        const addressMatch = queryAliases.some((alias) => address.includes(alias));
        return addressMatch;
      });
    }

    const pinFilter = resolvePinFilter(filters);
    const center =
      pinFilter === 'all' && stage === 'global'
        ? { lat: 0, lng: 0 }
        : bbox
          ? centerOfBbox(stableBBox(bbox, zoom))
          : { lat: 0, lng: 0 };
    const sorted = [...list].sort((a, b) => {
      if (pinFilter === 'all') {
        const rankA = isPinnedStatus(a.pinStatus) ? 0 : 1;
        const rankB = isPinnedStatus(b.pinStatus) ? 0 : 1;
        if (rankA !== rankB) return rankA - rankB;
      }
      return (
        distanceKm(center.lat, center.lng, a.latitude, a.longitude) -
        distanceKm(center.lat, center.lng, b.latitude, b.longitude)
      );
    });

    const offset = cursor ? Math.max(0, parseInt(cursor, 10)) : 0;
    const items = sorted.slice(offset, offset + LIMIT_PER_BATCH);
    const hasMore = sorted.length > offset + LIMIT_PER_BATCH;
    const nextCursor = hasMore ? String(offset + LIMIT_PER_BATCH) : null;

    return { items, nextCursor, hasMore };
  };
}
