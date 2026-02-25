import type { ResolveSpotLinkInput, SpotLinkPayload } from './types';

export const SPOT_LINK_VERSION = 'v1-phase-a-scaffold';

/**
 * Phase A scaffold: deterministic fallback resolver.
 * Real candidate lookup + scoring lands in Phase B/C behind feature flags.
 */
export async function resolveSpotLink(_input: ResolveSpotLinkInput): Promise<SpotLinkPayload> {
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
