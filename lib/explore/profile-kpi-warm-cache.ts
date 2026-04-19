import { computeVisitedCountryKpisFromSpots } from "@/lib/explore/visited-country-kpis";
import type { SpotPinStatus } from "@/components/design-system/map-pins";
import type { TravelerLevel } from "@/lib/traveler-levels";

export type ProfileKpiWarmSnapshot = {
  userId: string;
  visitedPlacesCount: number;
  visitedCountriesCount: number;
  visitedSpotsTotal: number;
  flowsPoints: number;
  visitedWorldPercent: number;
  currentTravelerLevel: TravelerLevel;
};

let warm: ProfileKpiWarmSnapshot | null = null;

/**
 * Explorar (mapa) mantiene esta instantánea cuando cambia `spots` visible + usuario autenticado.
 * Perfil puede leerla para pintar KPI sin esperar red (stale-while-revalidate).
 */
export function commitProfileKpiWarmSnapshotFromExploreSpots(
  userId: string,
  spots: Array<{ address: string | null; pinStatus?: SpotPinStatus }>,
): void {
  const k = computeVisitedCountryKpisFromSpots(spots);
  warm = {
    userId,
    visitedPlacesCount: k.visitedPlacesCount,
    visitedCountriesCount: k.visitedCountriesCount,
    visitedSpotsTotal: k.visitedSpotsTotal,
    flowsPoints: k.flowsPoints,
    visitedWorldPercent: k.visitedWorldPercent,
    currentTravelerLevel: k.currentTravelerLevel,
  };
}

export function readProfileKpiWarmSnapshot(userId: string): ProfileKpiWarmSnapshot | null {
  if (!warm || warm.userId !== userId) return null;
  return warm;
}

export function clearProfileKpiWarmSnapshot(): void {
  warm = null;
}
