import type { Map as MapboxMap } from "mapbox-gl";

import { distanceKm } from "@/lib/geo-utils";
import type { PlaceResult } from "@/lib/places/searchPlaces";
import {
  dedupeExternalPlacesAgainstSpots,
  getTappedFeatureId,
  getTappedFeatureMaki,
  rankExternalPlacesByIntent,
} from "@/lib/explore/map-screen-orchestration";

type SpotCandidate = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  linked_place_id?: string | null;
};

type GeoFeature = {
  id?: unknown;
  layer?: { id?: string };
  geometry?: { type?: string; coordinates?: unknown };
  properties?: Record<string, unknown>;
};

export const EMPTY_LANDMARK_MIN_RESULTS = 4;
const EMPTY_LANDMARK_MAX_VISIBLE = 10;
const LANDMARK_HINTS = [
  "landmark",
  "monument",
  "museum",
  "religious",
  "historic",
  "cathedral",
  "church",
  "basilica",
  "castle",
  "theatre",
  "theater",
  "gallery",
  "memorial",
  "archaeological",
  "attraction",
  "tourism",
  "university",
  "park",
];
const EXCLUDED_HINTS = [
  "road",
  "street",
  "highway",
  "motorway",
  "bus",
  "train",
  "station",
  "airport",
  "terminal",
  "taxi",
];

function pickName(props?: Record<string, unknown>): string | null {
  const raw =
    (typeof props?.name === "string" && props.name.trim()) ||
    (typeof props?.name_en === "string" && props.name_en.trim()) ||
    (typeof props?.title === "string" && props.title.trim()) ||
    null;
  return raw;
}

function pickFeatureType(props?: Record<string, unknown>): string | undefined {
  const featureType = props?.feature_type;
  if (typeof featureType === "string" && featureType.trim()) return featureType.trim();
  const cls = props?.class;
  if (typeof cls === "string" && cls.trim()) return cls.trim();
  const category = props?.category;
  if (typeof category === "string" && category.trim()) return category.trim();
  return undefined;
}

function pickCategories(props?: Record<string, unknown>): string[] | undefined {
  const poiCategoryIds = props?.poi_category_ids;
  if (Array.isArray(poiCategoryIds)) {
    const out = poiCategoryIds.filter(
      (item): item is string => typeof item === "string" && item.trim().length > 0,
    );
    if (out.length > 0) return out;
  }
  const poiCategory = props?.poi_category;
  if (Array.isArray(poiCategory)) {
    const out = poiCategory.filter(
      (item): item is string => typeof item === "string" && item.trim().length > 0,
    );
    if (out.length > 0) return out;
  }
  if (typeof poiCategory === "string" && poiCategory.trim().length > 0) {
    return [poiCategory.trim()];
  }
  return undefined;
}

function buildBag(feature: GeoFeature, props?: Record<string, unknown>): string {
  const layerId = feature.layer?.id ?? "";
  const cls = typeof props?.class === "string" ? props.class : "";
  const category = typeof props?.category === "string" ? props.category : "";
  const featureType = pickFeatureType(props) ?? "";
  const maki = getTappedFeatureMaki(props) ?? "";
  const categories = (pickCategories(props) ?? []).join(" ");
  return `${layerId} ${cls} ${category} ${featureType} ${maki} ${categories}`
    .toLowerCase()
    .trim();
}

function isInterestingVisibleFeature(feature: GeoFeature, props?: Record<string, unknown>): boolean {
  const bag = buildBag(feature, props);
  if (!bag) return false;
  if (EXCLUDED_HINTS.some((hint) => bag.includes(hint))) return false;
  return LANDMARK_HINTS.some((hint) => bag.includes(hint));
}

export function collectVisibleLandmarks(map: MapboxMap, maxItems = EMPTY_LANDMARK_MAX_VISIBLE): PlaceResult[] {
  let features: GeoFeature[];
  try {
    features = map.queryRenderedFeatures() as GeoFeature[];
  } catch {
    return [];
  }
  if (!Array.isArray(features) || features.length === 0) return [];

  let centerLat = 0;
  let centerLng = 0;
  try {
    const center = map.getCenter();
    centerLat = center.lat;
    centerLng = center.lng;
  } catch {
    centerLat = 0;
    centerLng = 0;
  }

  const seen = new Set<string>();
  const out: PlaceResult[] = [];

  for (const feature of features) {
    const props = feature.properties ?? undefined;
    const name = pickName(props);
    if (!name) continue;
    if (!isInterestingVisibleFeature(feature, props)) continue;

    const geometry = feature.geometry;
    if (geometry?.type !== "Point" || !Array.isArray(geometry.coordinates)) continue;
    const [lngRaw, latRaw] = geometry.coordinates as [unknown, unknown];
    if (typeof latRaw !== "number" || typeof lngRaw !== "number") continue;
    if (!Number.isFinite(latRaw) || !Number.isFinite(lngRaw)) continue;

    const stableId =
      getTappedFeatureId(feature.id, props) ?? `visible:${name.toLowerCase()}:${latRaw.toFixed(5)}:${lngRaw.toFixed(5)}`;
    if (seen.has(stableId)) continue;
    seen.add(stableId);

    out.push({
      id: stableId,
      name,
      lat: latRaw,
      lng: lngRaw,
      source: "mapbox",
      maki: getTappedFeatureMaki(props) ?? undefined,
      featureType: pickFeatureType(props),
      categories: pickCategories(props),
      fullName:
        (typeof props?.full_address === "string" && props.full_address.trim()) ||
        (typeof props?.place_formatted === "string" && props.place_formatted.trim()) ||
        undefined,
    });
  }

  return out
    .sort(
      (a, b) =>
        distanceKm(centerLat, centerLng, a.lat, a.lng) - distanceKm(centerLat, centerLng, b.lat, b.lng),
    )
    .slice(0, maxItems);
}

export function shouldFetchEmptyFallback(visibleLandmarks: PlaceResult[], minResults = EMPTY_LANDMARK_MIN_RESULTS) {
  return visibleLandmarks.length < minResults;
}

export function mergeEmptyExternalPlaces(
  visibleLandmarks: PlaceResult[],
  fallbackPlaces: PlaceResult[],
  spots: SpotCandidate[],
): PlaceResult[] {
  const byId = new Set<string>();
  const merged: PlaceResult[] = [];
  for (const item of [...visibleLandmarks, ...fallbackPlaces]) {
    if (byId.has(item.id)) continue;
    byId.add(item.id);
    merged.push(item);
  }
  const dedupedAgainstSpots = dedupeExternalPlacesAgainstSpots(merged, spots);
  return rankExternalPlacesByIntent(dedupedAgainstSpots, "");
}
