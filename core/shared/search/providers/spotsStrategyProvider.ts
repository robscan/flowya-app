/**
 * core/shared/search/providers/spotsStrategyProvider.ts — Wrapper SearchProvider para spotsStrategy.
 * Implementa SearchProvider llamando a lib/search/spotsStrategy con la misma lógica.
 */

import type { SearchProvider } from "../effects";
import type { SearchStage, SearchCursor, SearchResult } from "../state";
import type { SpotResult } from "../state";
import { createSpotsStrategy } from "@/lib/search/spotsStrategy";
import type { BBox } from "@/lib/search/bbox";
import type { SpotForSearch } from "@/lib/search/spotsStrategy";
import type {
  SearchStrategyParams,
  SearchStrategyResult,
} from "@/hooks/search/useSearchControllerV2";

export type CreateSpotsStrategyProviderDeps = {
  getFilteredSpots: () => SpotForSearch[];
  getBbox: () => BBox | null;
  getZoom: () => number;
};

export type SpotsStrategyProvider = SearchProvider & {
  /** Ejecuta la strategy con la misma firma que useSearchControllerV2 espera. */
  execute: (
    params: SearchStrategyParams
  ) => Promise<SearchStrategyResult<SpotForSearch>>;
};

/**
 * Crea un provider que implementa SearchProvider y expone execute() para el hook.
 * execute() delega directamente en spotsStrategy (mismo comportamiento).
 */
export function createSpotsStrategyProvider(
  deps: CreateSpotsStrategyProviderDeps
): SpotsStrategyProvider {
  const strategy = createSpotsStrategy(deps);

  const execute: SpotsStrategyProvider["execute"] = (params) =>
    strategy(params);

  return {
    execute,

    async runSearch(args) {
      const { query, stage, context: _context, cursor, viewport } = args;

      if (stage === "idle") {
        return {
          results: [],
          cursor: { kind: "none" },
          hasMore: false,
          stage: "viewport",
        };
      }

      const bbox: BBox | null =
        stage === "global"
          ? null
          : viewport?.bounds
            ? {
                west: viewport.bounds.west,
                south: viewport.bounds.south,
                east: viewport.bounds.east,
                north: viewport.bounds.north,
              }
            : null;

      const cursorStr =
        cursor.kind === "none"
          ? null
          : cursor.kind === "offset"
            ? String(cursor.value)
            : cursor.value;

      const out = await strategy({
        query,
        stage: stage as "viewport" | "expanded" | "global",
        bbox,
        filters: {},
        cursor: cursorStr,
      });

      const results: SearchResult[] = out.items.map((item) => ({
        kind: "spot" as const,
        id: item.id,
        spotId: item.id,
        title: item.title,
        coords: { lat: item.latitude, lng: item.longitude },
        isHidden: false,
        saved: item.pinStatus === "to_visit",
        visited: item.pinStatus === "visited",
      }));

      return {
        results,
        cursor:
          out.nextCursor === null
            ? { kind: "none" }
            : /^\d+$/.test(out.nextCursor)
              ? { kind: "offset" as const, value: parseInt(out.nextCursor, 10) }
              : { kind: "opaque" as const, value: out.nextCursor },
        hasMore: out.hasMore,
        stage: stage as SearchStage,
      };
    },
  };
}
