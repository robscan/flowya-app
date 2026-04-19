import type { SpotPinStatus } from "@/components/design-system/map-pins";
import { onlyVisible } from "@/core/shared/visibility-softdelete";
import { SPOT_SELECT_FOR_MAP } from "@/lib/explore/spots-map-select";
import { getPinsForSpots } from "@/lib/pins";
import { supabase } from "@/lib/supabase";

/** Fila mínima tras merge pins + `onlyVisible` (misma forma que usa Explore en memoria). */
export type VisibleSpotWithPinsRow = {
  id: string;
  title: string;
  description_short: string | null;
  description_long: string | null;
  cover_image_url: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  saved: boolean;
  visited: boolean;
  link_status?: "linked" | "uncertain" | "unlinked" | null;
  linked_place_id?: string | null;
  linked_place_kind?: "poi" | "landmark" | null;
  linked_maki?: string | null;
  mapbox_bbox?: { west: number; south: number; east: number; north: number } | null;
  mapbox_feature_type?: string | null;
  pinStatus: SpotPinStatus;
};

const inflightByUser = new Map<string, Promise<VisibleSpotWithPinsRow[]>>();

/**
 * Carga spots visibles + pins para el usuario de sesión, deduplicando peticiones concurrentes
 * (p. ej. `refetchSpots` en mapa + `useProfileKpis` al abrir `/account`).
 *
 * `expectedUserId` debe coincidir con `session.user.id` o se devuelve `[]` (cambio de cuenta / sesión).
 */
export async function fetchVisibleSpotsWithPinsDeduped(
  expectedUserId: string,
): Promise<VisibleSpotWithPinsRow[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user || user.is_anonymous || user.id !== expectedUserId) {
    return [];
  }

  const hit = inflightByUser.get(expectedUserId);
  if (hit) return hit;

  const run = (async (): Promise<VisibleSpotWithPinsRow[]> => {
    try {
      const { data, error } = await supabase
        .from("spots")
        .select(SPOT_SELECT_FOR_MAP)
        .eq("is_hidden", false);
      if (error || !Array.isArray(data)) return [];

      const list = data as Omit<
        VisibleSpotWithPinsRow,
        "saved" | "visited" | "pinStatus"
      >[];
      const pinMap = await getPinsForSpots(list.map((s) => s.id));
      const withPins: VisibleSpotWithPinsRow[] = list.map((s) => {
        const state = pinMap.get(s.id);
        const saved = state?.saved ?? false;
        const visited = state?.visited ?? false;
        const pinStatus: SpotPinStatus = visited ? "visited" : saved ? "to_visit" : "default";
        return {
          ...s,
          saved,
          visited,
          pinStatus,
        };
      });
      return onlyVisible(withPins as (VisibleSpotWithPinsRow & { isHidden?: boolean })[]);
    } catch {
      return [];
    } finally {
      inflightByUser.delete(expectedUserId);
    }
  })();

  inflightByUser.set(expectedUserId, run);
  return run;
}
