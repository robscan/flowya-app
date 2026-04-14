/**
 * Criterio compartido: listados Por visitar / Visitados en buscador vacío, resultados con query,
 * y sheet de lugares (CountriesSheet). «Lugares en la zona» = radio fijo alrededor del **centro del mapa**;
 * solo tiene sentido si el mapa está alineado con el punto de referencia del usuario (o fallback),
 * p. ej. no recién recargado con cámara lejos de la ref.
 */

import { SPOTS_ZONA_RADIUS_KM } from "@/lib/map-core/constants";
import { distanceKm } from "@/lib/geo-utils";

/** Si el centro del mapa está más lejos que esto de ref (usuario o FALLBACK_VIEW), no se parte en dos secciones. */
export const EXPLORE_PLACES_ZONA_SPLIT_MAX_CENTER_DRIFT_KM = 80;

export type SavedVisitedPlaceSection<T> = {
  id: string;
  title: string;
  items: T[];
};

function latLngOf<T extends { latitude?: number; longitude?: number; lat?: number; lng?: number }>(
  row: T,
): { lat: number; lng: number } {
  if (row.latitude != null && row.longitude != null) {
    return { lat: row.latitude, lng: row.longitude };
  }
  return { lat: row.lat as number, lng: row.lng as number };
}

function sortByRefDistance<T extends { latitude?: number; longitude?: number; lat?: number; lng?: number }>(
  items: T[],
  refLat: number,
  refLng: number,
): T[] {
  return [...items].sort((a, b) => {
    const pa = latLngOf(a);
    const pb = latLngOf(b);
    return (
      distanceKm(refLat, refLng, pa.lat, pa.lng) - distanceKm(refLat, refLng, pb.lat, pb.lng)
    );
  });
}

/**
 * @param forceSingleSection — p. ej. `isSearchColdStartBootstrapActive`: evita «Lugares en la zona» engañoso tras reload.
 */
export function buildSavedVisitedPlaceSections<
  T extends { latitude?: number; longitude?: number; lat?: number; lng?: number },
>(
  spots: T[],
  options: {
    mapCenter: { lat: number; lng: number } | null;
    refLatitude: number;
    refLongitude: number;
    forceSingleSection: boolean;
    zonaRadiusKm?: number;
    maxCenterDriftKm?: number;
  },
): SavedVisitedPlaceSection<T>[] {
  const zonaKm = options.zonaRadiusKm ?? SPOTS_ZONA_RADIUS_KM;
  const maxDrift = options.maxCenterDriftKm ?? EXPLORE_PLACES_ZONA_SPLIT_MAX_CENTER_DRIFT_KM;
  const { refLatitude, refLongitude } = options;
  const sortByRef = (xs: T[]) => sortByRefDistance(xs, refLatitude, refLongitude);

  if (spots.length === 0) return [];

  const center = options.mapCenter;
  const alignedWithRef =
    center != null &&
    distanceKm(center.lat, center.lng, refLatitude, refLongitude) <= maxDrift;
  const shouldSplit = !options.forceSingleSection && alignedWithRef && center != null;

  if (!shouldSplit) {
    return [{ id: "map-all", title: "Lugares en el mapa", items: sortByRef(spots) }];
  }

  const nearby = spots.filter((s) => {
    const p = latLngOf(s);
    return distanceKm(center.lat, center.lng, p.lat, p.lng) <= zonaKm;
  });
  const inWorld = spots.filter((s) => {
    const p = latLngOf(s);
    return distanceKm(center.lat, center.lng, p.lat, p.lng) > zonaKm;
  });

  const sections: SavedVisitedPlaceSection<T>[] = [];
  if (nearby.length > 0) {
    sections.push({ id: "nearby", title: "Lugares en la zona", items: sortByRef(nearby) });
  }
  if (inWorld.length > 0) {
    sections.push({ id: "world", title: "Lugares en el mapa", items: sortByRef(inWorld) });
  }
  return sections;
}
