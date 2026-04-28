import type { GeoSearchResult } from "./types";

export function formatGeoKind(geo: Pick<GeoSearchResult, "entityType">): string {
  if (geo.entityType === "country") return "País";
  if (geo.entityType === "region") return "Región";
  return "Ciudad";
}
