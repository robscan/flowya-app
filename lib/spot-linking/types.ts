export type SpotLinkStatus = 'linked' | 'uncertain' | 'unlinked';

export type LinkedPlaceKind = 'poi' | 'landmark';

export type SpotLinkPayload = {
  linkStatus: SpotLinkStatus;
  linkScore: number | null;
  linkedPlaceId: string | null;
  linkedPlaceKind: LinkedPlaceKind | null;
  linkedMaki: string | null;
  linkedAt: string | null;
  linkVersion: string;
};

export type ResolveSpotLinkInput = {
  title: string;
  lat: number;
  lng: number;
};
