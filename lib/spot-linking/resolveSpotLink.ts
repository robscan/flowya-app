import { distanceKm } from '@/lib/geo-utils';
import { searchPlaces } from '@/lib/places/searchPlaces';
import { normalizeQuery } from '@/lib/search/normalize';
import { recordSpotLinkMetric } from './metrics';
import type { ResolveSpotLinkInput, SpotLinkPayload } from './types';

export const SPOT_LINK_VERSION = 'v1-phase-c-calibrated';

const SEARCH_RADIUS_KM = 0.45;
const HARD_DISTANCE_CUTOFF_KM = 0.6;
const LINKED_THRESHOLD = 0.82;
const UNCERTAIN_THRESHOLD = 0.58;
const DISTANCE_WEIGHT = 0.35;
const NAME_WEIGHT = 0.65;
const LINKED_MAX_DISTANCE_KM = 0.18;
const UNCERTAIN_MAX_DISTANCE_KM = 0.35;
const MIN_LINKED_NAME_SCORE = 0.72;
const AMBIGUITY_DELTA = 0.06;

const LANDMARK_TOKENS = [
  'cathedral',
  'church',
  'basilica',
  'museum',
  'museo',
  'plaza',
  'park',
  'parque',
  'mirador',
  'monument',
  'monumento',
  'ruins',
  'ruinas',
  'cenote',
  'temple',
  'templo',
];

function scoreNameSimilarity(sourceTitle: string, candidateName: string): number {
  const a = normalizeQuery(sourceTitle);
  const b = normalizeQuery(candidateName);
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.9;

  const tokensA = a.split(/\s+/).filter(Boolean);
  const tokensB = b.split(/\s+/).filter(Boolean);
  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection += 1;
  }
  const union = new Set([...setA, ...setB]).size;
  if (union === 0) return 0;
  return intersection / union;
}

function scoreDistance(km: number): number {
  if (!Number.isFinite(km)) return 0;
  if (km <= 0) return 1;
  if (km >= SEARCH_RADIUS_KM) return 0;
  return 1 - km / SEARCH_RADIUS_KM;
}

function classifyPlaceKind(candidate: {
  featureType?: string;
  maki?: string;
  categories?: string[];
  name: string;
}): 'poi' | 'landmark' {
  const f = (candidate.featureType ?? '').toLowerCase();
  const maki = (candidate.maki ?? '').toLowerCase();
  const categories = (candidate.categories ?? []).map((c) => c.toLowerCase());
  const name = normalizeQuery(candidate.name);

  if (f.includes('landmark')) return 'landmark';
  if (maki.includes('monument') || maki.includes('museum') || maki.includes('religious')) {
    return 'landmark';
  }
  if (categories.some((c) => LANDMARK_TOKENS.some((t) => c.includes(t)))) {
    return 'landmark';
  }
  if (LANDMARK_TOKENS.some((t) => name.includes(t))) {
    return 'landmark';
  }
  return 'poi';
}

function fallbackUnlinked(): SpotLinkPayload {
  return {
    linkStatus: 'unlinked',
    linkScore: null,
    linkedPlaceId: null,
    linkedPlaceKind: null,
    linkedMaki: null,
    linkedAt: null,
    linkVersion: SPOT_LINK_VERSION,
  };
}

/**
 * Phase B resolver: nearest-candidate scoring with safe thresholds.
 * If confidence is low or lookup fails, returns `unlinked`.
 */
export async function resolveSpotLink(input: ResolveSpotLinkInput): Promise<SpotLinkPayload> {
  const startedAt = Date.now();
  const title = input.title?.trim() ?? '';
  if (!title) {
    const output = fallbackUnlinked();
    recordSpotLinkMetric({
      status: output.linkStatus,
      score: null,
      durationMs: Date.now() - startedAt,
      reason: 'empty_title',
    });
    return output;
  }

  const latDelta = 0.008;
  const lngDelta = 0.008;
  try {
    const candidates = await searchPlaces(title, {
      limit: 8,
      proximity: { lat: input.lat, lng: input.lng },
      bbox: {
        west: input.lng - lngDelta,
        south: input.lat - latDelta,
        east: input.lng + lngDelta,
        north: input.lat + latDelta,
      },
    });
    if (candidates.length === 0) {
      const output = fallbackUnlinked();
      recordSpotLinkMetric({
        status: output.linkStatus,
        score: null,
        durationMs: Date.now() - startedAt,
        reason: 'no_candidates',
      });
      return output;
    }

    const ranked: {
      id: string;
      name: string;
      maki?: string;
      featureType?: string;
      categories?: string[];
      score: number;
      distance: number;
      nameScore: number;
    }[] = [];

    for (const c of candidates) {
      const km = distanceKm(input.lat, input.lng, c.lat, c.lng);
      if (km > HARD_DISTANCE_CUTOFF_KM) continue;
      const nameScore = scoreNameSimilarity(title, c.name);
      const distScore = scoreDistance(km);
      const totalScore = nameScore * NAME_WEIGHT + distScore * DISTANCE_WEIGHT;
      ranked.push({
        id: c.id,
        name: c.name,
        maki: c.maki,
        featureType: c.featureType,
        categories: c.categories,
        score: totalScore,
        distance: km,
        nameScore,
      });
    }

    ranked.sort((a, b) => b.score - a.score);
    const best = ranked[0];
    if (!best) {
      const output = fallbackUnlinked();
      recordSpotLinkMetric({
        status: output.linkStatus,
        score: null,
        durationMs: Date.now() - startedAt,
        reason: 'no_candidates_after_distance_cutoff',
      });
      return output;
    }
    const second = ranked[1];
    const isAmbiguous =
      second != null &&
      best.score >= UNCERTAIN_THRESHOLD &&
      best.score - second.score <= AMBIGUITY_DELTA;

    const kind = classifyPlaceKind({
      featureType: best.featureType,
      maki: best.maki,
      categories: best.categories,
      name: best.name,
    });
    const linkedAt = new Date().toISOString();
    const roundedScore = Number(best.score.toFixed(4));

    if (
      !isAmbiguous &&
      best.score >= LINKED_THRESHOLD &&
      best.distance <= LINKED_MAX_DISTANCE_KM &&
      best.nameScore >= MIN_LINKED_NAME_SCORE
    ) {
      const output: SpotLinkPayload = {
        linkStatus: 'linked',
        linkScore: roundedScore,
        linkedPlaceId: best.id,
        linkedPlaceKind: kind,
        linkedMaki: best.maki ?? null,
        linkedAt,
        linkVersion: SPOT_LINK_VERSION,
      };
      recordSpotLinkMetric({
        status: output.linkStatus,
        score: roundedScore,
        durationMs: Date.now() - startedAt,
        reason: 'linked_high_confidence',
      });
      return output;
    }

    if (best.score >= UNCERTAIN_THRESHOLD && best.distance <= UNCERTAIN_MAX_DISTANCE_KM) {
      const output: SpotLinkPayload = {
        linkStatus: 'uncertain',
        linkScore: roundedScore,
        linkedPlaceId: best.id,
        linkedPlaceKind: kind,
        linkedMaki: best.maki ?? null,
        linkedAt,
        linkVersion: SPOT_LINK_VERSION,
      };
      recordSpotLinkMetric({
        status: output.linkStatus,
        score: roundedScore,
        durationMs: Date.now() - startedAt,
        reason: isAmbiguous ? 'uncertain_ambiguous_top_candidates' : 'uncertain_low_confidence',
      });
      return output;
    }

    const output = fallbackUnlinked();
    recordSpotLinkMetric({
      status: output.linkStatus,
      score: roundedScore,
      durationMs: Date.now() - startedAt,
      reason: 'unlinked_below_threshold',
    });
    return output;
  } catch {
    const output = fallbackUnlinked();
    recordSpotLinkMetric({
      status: output.linkStatus,
      score: null,
      durationMs: Date.now() - startedAt,
      reason: 'resolver_error',
      isError: true,
    });
    return output;
  }
}
