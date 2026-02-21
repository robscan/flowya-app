/**
 * core/shared/search/providers/geocodingProvider.ts — Wrapper GeocodingProvider para Mapbox.
 */

import type { GeocodingProvider } from "../effects";
import { resolvePlaceForCreate } from "@/lib/mapbox-geocoding";

/**
 * Crea un GeocodingProvider que delega en lib/mapbox-geocoding.
 */
export function createMapboxGeocodingProvider(): GeocodingProvider {
  return {
    async resolvePlaceForCreate(args) {
      const opts =
        args.viewport && args.viewport.bounds
          ? {
              proximity: args.viewport.center,
              bbox: {
                west: args.viewport.bounds.west,
                south: args.viewport.bounds.south,
                east: args.viewport.bounds.east,
                north: args.viewport.bounds.north,
              },
            }
          : args.viewport
            ? { proximity: args.viewport.center }
            : undefined;

      const result = await resolvePlaceForCreate(args.query, opts);
      if (!result) return null;

      return {
        placeId: `geo:${result.latitude},${result.longitude}`,
        coords: { lat: result.latitude, lng: result.longitude },
        title: result.name,
      };
    },
  };
}
