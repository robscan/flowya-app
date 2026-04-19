import type { CountryBucket } from "@/lib/explore/country-bucket-metrics";

/** Entrada canónica para compartir + caché warm (mapa opcional hasta captura web). */
export type VisitedCountriesSharePayload = {
  items: CountryBucket[];
  countriesCount: number;
  spotsCount: number;
  worldPercentage: number;
  mapSnapshotDataUrl?: string | null;
};
