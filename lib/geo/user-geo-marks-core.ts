import type { GeoEntityType, UserGeoMarkState } from "./types";

export type UserGeoMarkPayload = {
  user_id: string;
  entity_type: GeoEntityType;
  entity_id: string;
  saved: boolean;
  visited: boolean;
};

export function buildUserGeoMarkPayload(
  userId: string,
  entityType: GeoEntityType,
  entityId: string,
  state: UserGeoMarkState,
): UserGeoMarkPayload {
  return {
    user_id: userId,
    entity_type: entityType,
    entity_id: entityId,
    saved: state === "saved",
    visited: state === "visited",
  };
}
