import type { GeoSearchResult } from "./types";

export function formatGeoKind(geo: Pick<GeoSearchResult, "entityType">): string {
  if (geo.entityType === "country") return "País";
  if (geo.entityType === "region") return "Región";
  return "Ciudad";
}

export function formatGeoMarkState(geo: Pick<GeoSearchResult, "saved" | "visited">): string {
  if (geo.visited) return "Visitado";
  if (geo.saved) return "Por visitar";
  return "Sin marcar";
}

export function formatGeoMapState(
  geo: Pick<GeoSearchResult, "bbox" | "centroidLatitude" | "centroidLongitude">,
): string {
  if (geo.bbox) return "Mapa con encuadre";
  if (geo.centroidLatitude != null && geo.centroidLongitude != null) return "Mapa con centro";
  return "Mapa pendiente";
}

export function buildGeoSheetSummary(
  geo: Pick<GeoSearchResult, "entityType" | "title" | "subtitle">,
): string {
  if (geo.entityType === "country") {
    return `${geo.title} funciona como destino marco para organizar regiones, ciudades y lugares del viaje.`;
  }
  if (geo.entityType === "region") {
    return `${geo.title} ayuda a agrupar ciudades, rutas y lugares cercanos dentro del mapa.`;
  }
  return `${geo.title} puede usarse como base para explorar lugares, guardar intención y construir recorridos.`;
}

export function buildGeoHierarchyLabel(geo: Pick<GeoSearchResult, "entityType" | "subtitle">): string {
  if (geo.subtitle) return geo.subtitle;
  if (geo.entityType === "country") return "Destino raíz";
  if (geo.entityType === "region") return "Región oficial";
  return "Ciudad oficial";
}
