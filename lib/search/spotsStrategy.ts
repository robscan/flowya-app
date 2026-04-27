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
import { normalizeSearchText } from './intent-normalize';
import { buildSpotSearchDocument, scoreSpotForQuery } from './intent-scoring';

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
  /** OL-EXPLORE-TAGS-001: ids de user_tags asociados al spot (solo owner). */
  tagIds?: string[];
};

export type CreateSpotsStrategyOptions = {
  getFilteredSpots: () => SpotForSearch[];
  /** Todos los spots del usuario (sin filtrar por pin); segunda pasada de búsqueda con filtro saved/visited. */
  getAllSpotsForSearch?: () => SpotForSearch[];
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

function shouldExpandAcrossAllPins(filters: unknown): boolean {
  if (typeof filters === 'object' && filters !== null && 'expandSearchAcrossAllPins' in filters) {
    return Boolean((filters as { expandSearchAcrossAllPins?: unknown }).expandSearchAcrossAllPins);
  }
  return false;
}

function resolveTagId(filters: unknown): string | null {
  if (typeof filters === 'object' && filters !== null && 'tagId' in filters) {
    const v = (filters as { tagId?: unknown }).tagId;
    if (typeof v === 'string' && v.length > 0) return v;
  }
  return null;
}

function centerOfBbox(bbox: BBox): { lat: number; lng: number } {
  return {
    lat: (bbox.south + bbox.north) / 2,
    lng: (bbox.west + bbox.east) / 2,
  };
}

export function createSpotsStrategy({
  getFilteredSpots,
  getAllSpotsForSearch,
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

    const expandAll = shouldExpandAcrossAllPins(filters);
    const pool =
      expandAll && typeof getAllSpotsForSearch === 'function'
        ? getAllSpotsForSearch()
        : getFilteredSpots();
    const q = normalizeSearchText(query);
    let list = pool;
    if (!q && bboxFilter) {
      list = list.filter(
        (s) =>
          s.latitude >= bboxFilter!.south &&
          s.latitude <= bboxFilter!.north &&
          s.longitude >= bboxFilter!.west &&
          s.longitude <= bboxFilter!.east
      );
    }

    const searchScoreById = new Map<string, number>();
    if (q) {
      const queryAliases = expandCountryQueryAliases(q);
      list = list.filter((s) => {
        const document = buildSpotSearchDocument(s);
        const score = scoreSpotForQuery(document, q, queryAliases);
        if (score.score <= 0) return false;
        searchScoreById.set(s.id, score.score);
        return true;
      });
    }

    const tagId = resolveTagId(filters);
    if (tagId) {
      list = list.filter((s) => {
        const ids = s.tagIds;
        return Array.isArray(ids) && ids.includes(tagId);
      });
    }

    const pinFilter = resolvePinFilter(filters);
    const effectivePinFilterForSort = expandAll ? 'all' : pinFilter;
    const center =
      effectivePinFilterForSort === 'all' && stage === 'global'
        ? { lat: 0, lng: 0 }
        : bbox
          ? centerOfBbox(stableBBox(bbox, zoom))
          : { lat: 0, lng: 0 };
    const sorted = [...list].sort((a, b) => {
      if (q) {
        const scoreDiff = (searchScoreById.get(b.id) ?? 0) - (searchScoreById.get(a.id) ?? 0);
        if (scoreDiff !== 0) return scoreDiff;
      }
      if (effectivePinFilterForSort === 'all') {
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
