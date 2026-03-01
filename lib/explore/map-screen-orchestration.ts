import type { PlaceResult } from "@/lib/places/searchPlaces";
import { distanceKm } from "@/lib/geo-utils";

export type TappedMapFeatureKind = "poi" | "landmark";

type SpotSearchCandidate = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  link_status?: "linked" | "uncertain" | "unlinked" | null;
  linked_place_id?: string | null;
  pinStatus?: string;
};

const LINKED_TAP_FALLBACK_TOLERANCE_KM = 0.012;

const TOURISM_KEYWORDS = [
  "museum",
  "monument",
  "historic",
  "landmark",
  "gallery",
  "castle",
  "church",
  "cathedral",
  "park",
  "theatre",
  "theater",
];

const TOURISM_MAKI_HINTS = [
  "museum",
  "monument",
  "castle",
  "theatre",
  "theater",
  "park",
];

const COMMERCIAL_KEYWORDS = [
  "tour",
  "tours",
  "ferry",
  "restaurant",
  "hotel",
  "bar",
  "cafe",
  "snorkel",
  "buggy",
  "rental",
  "rent",
  "shop",
  "store",
  "taxi",
  "agency",
  "terminal",
];

const NON_GEO_QUERY_HINTS = [
  "hotel",
  "restaurante",
  "restaurant",
  "bar",
  "cafe",
  "cafeteria",
  "tour",
  "ferry",
  "taxi",
  "museo",
  "museum",
  "playa",
  "beach",
];

export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function classifyTappedFeatureKind(
  layerId?: string,
  props?: Record<string, unknown> | null,
): TappedMapFeatureKind {
  const id = (layerId ?? "").toLowerCase();
  if (id.includes("landmark")) return "landmark";

  const cls =
    typeof props?.class === "string"
      ? props.class.toLowerCase()
      : typeof props?.category === "string"
        ? props.category.toLowerCase()
        : "";
  if (cls.includes("landmark")) return "landmark";
  return "poi";
}

export function getTappedFeatureId(
  featureId: unknown,
  props?: Record<string, unknown> | null,
): string | null {
  const candidates: unknown[] = [
    featureId,
    props?.mapbox_id,
    props?.place_id,
    props?.id,
    props?.feature_id,
  ];
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return null;
}

export function getTappedFeatureMaki(props?: Record<string, unknown> | null): string | null {
  const candidates: unknown[] = [props?.maki, props?.icon];
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export function resolveTappedSpotMatch<T extends SpotSearchCandidate>(
  spots: T[],
  tapped: { lat: number; lng: number; name: string; placeId: string | null },
): T | null {
  const stableSpots = spots.filter((s) => !s.id.startsWith("draft_"));

  if (tapped.placeId) {
    const linkedById = stableSpots.find(
      (s) =>
        s.link_status === "linked" &&
        typeof s.linked_place_id === "string" &&
        s.linked_place_id === tapped.placeId,
    );
    if (linkedById) return linkedById;
  }

  const linkedByDistance = stableSpots.find(
    (s) =>
      s.link_status === "linked" &&
      distanceKm(s.latitude, s.longitude, tapped.lat, tapped.lng) <=
        LINKED_TAP_FALLBACK_TOLERANCE_KM,
  );
  if (linkedByDistance) return linkedByDistance;

  const tappedName = normalizeText(tapped.name);
  const closestSemantic = stableSpots
    .map((s) => ({
      spot: s,
      km: distanceKm(s.latitude, s.longitude, tapped.lat, tapped.lng),
      sameName: normalizeText(s.title) === tappedName,
    }))
    .filter(({ km, sameName }) => sameName && km <= 0.03)
    .sort((a, b) => a.km - b.km)[0];
  if (closestSemantic) return closestSemantic.spot;

  return null;
}

export function dedupeExternalPlacesAgainstSpots(
  places: PlaceResult[],
  spots: SpotSearchCandidate[],
): PlaceResult[] {
  return places.filter((place) => {
    const placeName = normalizeText(place.name);
    return !spots.some((spot) => {
      if (!spot || spot.id.startsWith("draft_")) return false;
      const byLinkedId =
        spot.linked_place_id != null &&
        spot.linked_place_id.length > 0 &&
        spot.linked_place_id === place.id;
      if (byLinkedId) return true;
      const closeEnough =
        distanceKm(spot.latitude, spot.longitude, place.lat, place.lng) <= 0.02;
      if (!closeEnough) return false;
      const spotName = normalizeText(spot.title ?? "");
      return spotName.length > 0 && placeName.length > 0 && spotName === placeName;
    });
  });
}

function inferExternalIntent(
  place: PlaceResult,
): "poi_landmark" | "poi" | "place" | "address" {
  const featureType = normalizeText(place.featureType ?? "");
  const maki = normalizeText(place.maki ?? "");
  const categories = (place.categories ?? []).map((item) => normalizeText(item));
  const bag = `${featureType} ${maki} ${categories.join(" ")}`.trim();
  const hasTourismSignal =
    TOURISM_KEYWORDS.some((keyword) => bag.includes(keyword)) ||
    TOURISM_MAKI_HINTS.some((hint) => maki.includes(hint));
  if (hasTourismSignal || featureType.includes("landmark")) return "poi_landmark";
  if (featureType.includes("poi") || maki.length > 0 || categories.length > 0)
    return "poi";
  if (featureType.includes("address") || featureType.includes("street"))
    return "address";
  if (
    featureType.includes("place") ||
    featureType.includes("locality") ||
    featureType.includes("district") ||
    featureType.includes("neighborhood") ||
    featureType.includes("postcode") ||
    featureType.includes("region") ||
    featureType.includes("country")
  ) {
    return "place";
  }
  return "place";
}

function isGeoIntentQuery(query: string): boolean {
  const q = normalizeText(query);
  if (!q) return false;
  const parts = q.split(/\s+/).filter(Boolean);
  if (parts.length > 3) return false;
  if (NON_GEO_QUERY_HINTS.some((hint) => q.includes(hint))) return false;
  return true;
}

function isCommercialSuggestion(place: PlaceResult): boolean {
  const bag = normalizeText(
    `${place.name} ${place.fullName ?? ""} ${place.featureType ?? ""} ${(place.categories ?? []).join(" ")}`,
  );
  return COMMERCIAL_KEYWORDS.some((keyword) => bag.includes(keyword));
}

export function rankExternalPlacesByIntent(items: PlaceResult[], query: string): PlaceResult[] {
  const normalizedQuery = normalizeText(query);
  const geoQuery = isGeoIntentQuery(query);
  const hasExactPlace = items.some((item) => {
    const intent = inferExternalIntent(item);
    return intent === "place" && normalizeText(item.name) === normalizedQuery;
  });

  const scoreForIntent = (intent: ReturnType<typeof inferExternalIntent>): number => {
    if (intent === "poi_landmark") return 0;
    if (intent === "place") return 1;
    if (intent === "poi") return 2;
    return 3;
  };

  const ranked = items
    .map((item, idx) => {
      const intent = inferExternalIntent(item);
      let score = scoreForIntent(intent);
      const normalizedName = normalizeText(item.name);
      const exactNameMatch = normalizedName === normalizedQuery;

      if (geoQuery && intent === "place" && exactNameMatch) score -= 2;
      if (intent === "poi" && isCommercialSuggestion(item)) score += geoQuery ? 4 : 2;
      if (geoQuery && intent === "address") score += 2;

      return { item, idx, score };
    })
    .sort((a, b) => (a.score === b.score ? a.idx - b.idx : a.score - b.score))
    .map(({ item }) => item);

  if (geoQuery && hasExactPlace) {
    return ranked.filter((item) => {
      const intent = inferExternalIntent(item);
      if (intent === "place") return true;
      if (intent === "poi_landmark") return true;
      return !isCommercialSuggestion(item);
    });
  }
  return ranked;
}

export function getStablePlaceId(place: PlaceResult): string | null {
  const id = place.id?.trim();
  if (!id) return null;
  if (id.startsWith("place-")) return null;
  return id;
}

export function inferTappedKindFromPlace(place: PlaceResult): TappedMapFeatureKind {
  return inferExternalIntent(place) === "poi_landmark" ? "landmark" : "poi";
}

export function mergeSearchResults<T extends SpotSearchCandidate>(
  spots: T[],
  places: PlaceResult[],
  query: string,
): (T | PlaceResult)[] {
  const deduped = dedupeExternalPlacesAgainstSpots(places, spots);
  const rankedPlaces = rankExternalPlacesByIntent(deduped, query);

  type Entry = { item: T | PlaceResult; score: number };
  const entries: Entry[] = [];

  spots.forEach((spot, idx) => {
    const hasPin = spot.pinStatus === "to_visit" || spot.pinStatus === "visited";
    const base = hasPin ? 0 : 60;
    entries.push({ item: spot, score: base + idx * 0.001 });
  });

  rankedPlaces.forEach((place, idx) => {
    const intent = inferExternalIntent(place);
    const commercial = isCommercialSuggestion(place);
    let base = 40;
    if (intent === "poi_landmark") base = 10;
    else if (intent === "place") base = 20;
    else if (intent === "poi") base = commercial ? 50 : 30;
    entries.push({ item: place, score: base + idx * 0.001 });
  });

  return entries.sort((a, b) => a.score - b.score).map((entry) => entry.item);
}
