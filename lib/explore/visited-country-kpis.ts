/**
 * KPIs de países visitados / flows — misma semántica que `MapScreenVNext`
 * (`pinStatus === "visited"`, `buildCountryBuckets`, `computeTravelerPoints`).
 */

import type { SpotPinStatus } from "@/components/design-system/map-pins";
import { buildCountryBuckets } from "@/lib/explore/country-bucket-metrics";
import { computeTravelerPoints, resolveTravelerLevelByPoints } from "@/lib/traveler-levels";

export function mergePinsIntoSpotsForKpi<T extends { id: string; address: string | null }>(
  rows: T[],
  pinMap: Map<string, { saved: boolean; visited: boolean }>,
): Array<T & { saved: boolean; visited: boolean; pinStatus: SpotPinStatus }> {
  return rows.map((s) => {
    const state = pinMap.get(s.id);
    const saved = state?.saved ?? false;
    const visited = state?.visited ?? false;
    const pinStatus: SpotPinStatus = visited ? "visited" : saved ? "to_visit" : "default";
    return { ...s, saved, visited, pinStatus };
  });
}

export function computeVisitedCountryKpisFromSpots(
  spots: Array<{ address: string | null; pinStatus?: SpotPinStatus }>,
): {
  visitedCountriesCount: number;
  visitedPlacesCount: number;
  visitedSpotsTotal: number;
  flowsPoints: number;
  visitedWorldPercent: number;
  currentTravelerLevel: ReturnType<typeof resolveTravelerLevelByPoints>;
} {
  const visitedPool = spots.filter((s) => s.pinStatus === "visited");
  const visitedSpotsTotal = visitedPool.length;
  const buckets = buildCountryBuckets(visitedPool);
  const visitedCountriesCount = buckets.length;
  /**
   * «Lugares» en perfil / sheet con filtro visitados = cardinal de spots con pin visitado,
   * igual que `exploreMapKpiPlacesCount` cuando `pinFilter` es saved|visited (sin etiquetas / sin país en lista).
   * No usar la suma de `buildCountryBuckets`: excluye visitados sin país deducible en `address`.
   */
  const visitedPlacesCount = visitedSpotsTotal;
  const flowsPoints = computeTravelerPoints(visitedCountriesCount, visitedSpotsTotal);
  const visitedWorldPercent = Math.round((visitedCountriesCount / 195) * 100);
  const currentTravelerLevel = resolveTravelerLevelByPoints(flowsPoints);
  return {
    visitedCountriesCount,
    visitedPlacesCount,
    visitedSpotsTotal,
    flowsPoints,
    visitedWorldPercent,
    currentTravelerLevel,
  };
}
