import { getSupabaseClient } from "@/lib/supabase";

import type { GeoEntityType, UserGeoMarkState } from "./types";
import { buildUserGeoMarkPayload, type UserGeoMarkPayload } from "./user-geo-marks-core";

export class GeoMarkAuthRequiredError extends Error {
  constructor() {
    super("AUTH_REQUIRED");
    this.name = "GeoMarkAuthRequiredError";
  }
}

export async function saveUserGeoMark(
  entityType: GeoEntityType,
  entityId: string,
  state: UserGeoMarkState,
): Promise<UserGeoMarkPayload> {
  const client = getSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  if (authError || !user) throw new GeoMarkAuthRequiredError();

  const payload = buildUserGeoMarkPayload(user.id, entityType, entityId, state);
  const { data, error } = await client
    .from("user_geo_marks")
    .upsert(payload, { onConflict: "user_id,entity_type,entity_id" })
    .select("user_id,entity_type,entity_id,saved,visited")
    .single();

  if (error) throw error;
  return (data ?? payload) as UserGeoMarkPayload;
}
