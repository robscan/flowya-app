import type { SearchSection } from '@/components/search/SearchResultsListV2';
import type { PlaceResult } from '@/lib/places/searchPlaces';

type WorldSeed = {
  id: string;
  name: string;
  fullName: string;
  lat: number;
  lng: number;
};

const WORLD_SEED_COUNTRIES: WorldSeed[] = [
  { id: 'world-seed:country:japan', name: 'Japón', fullName: 'País popular · Tokio, Japón', lat: 35.6764, lng: 139.65 },
  { id: 'world-seed:country:france', name: 'Francia', fullName: 'País popular · París, Francia', lat: 48.8566, lng: 2.3522 },
  { id: 'world-seed:country:italy', name: 'Italia', fullName: 'País popular · Roma, Italia', lat: 41.9028, lng: 12.4964 },
  { id: 'world-seed:country:mexico', name: 'México', fullName: 'País popular · Ciudad de México, México', lat: 19.4326, lng: -99.1332 },
  { id: 'world-seed:country:spain', name: 'España', fullName: 'País popular · Madrid, España', lat: 40.4168, lng: -3.7038 },
  { id: 'world-seed:country:uk', name: 'Reino Unido', fullName: 'País popular · Londres, Reino Unido', lat: 51.5074, lng: -0.1278 },
  { id: 'world-seed:country:thailand', name: 'Tailandia', fullName: 'País popular · Bangkok, Tailandia', lat: 13.7563, lng: 100.5018 },
  { id: 'world-seed:country:uae', name: 'Emiratos Árabes', fullName: 'País popular · Dubái, Emiratos Árabes', lat: 25.2048, lng: 55.2708 },
];

const WORLD_SEED_PLACES: WorldSeed[] = [
  { id: 'world-seed:place:eiffel-tower', name: 'Torre Eiffel', fullName: 'París, Francia', lat: 48.8584, lng: 2.2945 },
  { id: 'world-seed:place:statue-of-liberty', name: 'Estatua de la Libertad', fullName: 'Nueva York, Estados Unidos', lat: 40.6892, lng: -74.0445 },
  { id: 'world-seed:place:colosseum', name: 'Coliseo', fullName: 'Roma, Italia', lat: 41.8902, lng: 12.4922 },
  { id: 'world-seed:place:machu-picchu', name: 'Machu Picchu', fullName: 'Cusco, Perú', lat: -13.1631, lng: -72.545 },
  { id: 'world-seed:place:chichen-itza', name: 'Chichén Itzá', fullName: 'Yucatán, México', lat: 20.6843, lng: -88.5678 },
  { id: 'world-seed:place:taj-mahal', name: 'Taj Mahal', fullName: 'Agra, India', lat: 27.175015, lng: 78.042155 },
  { id: 'world-seed:place:christ-redeemer', name: 'Cristo Redentor', fullName: 'Río de Janeiro, Brasil', lat: -22.9519, lng: -43.2105 },
  { id: 'world-seed:place:sydney-opera-house', name: 'Ópera de Sídney', fullName: 'Sídney, Australia', lat: -33.8568, lng: 151.2153 },
];

function toPlaceResult(seed: WorldSeed): PlaceResult {
  return {
    id: seed.id,
    name: seed.name,
    fullName: seed.fullName,
    lat: seed.lat,
    lng: seed.lng,
    source: 'mapbox',
    featureType: seed.id.includes(':country:') ? 'country' : 'poi',
  };
}

function isFiniteCoord(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithSeed<T>(items: T[], seed: number): T[] {
  const out = [...items];
  const random = mulberry32(seed);
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

/** Umbral en grados (~1 km). Si un spot visitado está más cerca, el seed se excluye. */
const NEAR_VISITED_THRESHOLD_DEG = 0.01;

function isNearVisited(
  lat: number,
  lng: number,
  visitedCoords: { lat: number; lng: number }[],
): boolean {
  for (const v of visitedCoords) {
    const dLat = Math.abs(lat - v.lat);
    const dLng = Math.abs(lng - v.lng);
    if (dLat <= NEAR_VISITED_THRESHOLD_DEG && dLng <= NEAR_VISITED_THRESHOLD_DEG) return true;
  }
  return false;
}

export function isWorldSeedPlace(place: PlaceResult): boolean {
  return typeof place.id === 'string' && place.id.startsWith('world-seed:');
}

export function buildColdStartWorldSections(
  seed: number,
  options?: { excludeNearVisitedSpots?: { lat: number; lng: number }[] },
): SearchSection<PlaceResult>[] {
  const visited = options?.excludeNearVisitedSpots ?? [];
  const excludeIfVisited = (p: PlaceResult) =>
    isFiniteCoord(p.lat, p.lng) && !isNearVisited(p.lat, p.lng, visited);

  const countries = shuffleWithSeed(WORLD_SEED_COUNTRIES, seed)
    .map(toPlaceResult)
    .filter(excludeIfVisited);
  const places = shuffleWithSeed(WORLD_SEED_PLACES, seed + 97)
    .map(toPlaceResult)
    .filter(excludeIfVisited);

  const sections: SearchSection<PlaceResult>[] = [];
  if (countries.length > 0) {
    sections.push({
      id: 'cold-start-countries',
      title: 'Países populares',
      items: countries,
    });
  }
  if (places.length > 0) {
    sections.push({
      id: 'cold-start-places',
      title: 'Lugares populares',
      items: places,
    });
  }
  return sections;
}
