import { Platform } from "react-native";
import { Colors } from "@/constants/theme";
import { readVisitedCountriesShareCache, warmVisitedCountriesShareCache } from "@/lib/explore/visited-countries-share/cache";
import { buildVisitedCountriesShareBaselineFromSpots } from "@/lib/explore/visited-countries-share/baseline";
import type { VisitedCountriesSharePayload } from "./types";
import { fetchVisibleSpotsWithPinsDeduped } from "@/lib/explore/fetch-visible-spots-with-pins";
import { supabase } from "@/lib/supabase";
import {
  notifyShareCountriesCardOutcome,
  shareCountriesCard,
  type ShareCountriesCardResult,
  type ShareCountriesToastShow,
} from "@/lib/share-countries-card";

export type ShareVisitedCountriesProgressParams = {
  show: ShareCountriesToastShow;
  colorScheme: "light" | "dark";
  suppressToasts?: boolean;
  /**
   * Datos ya listos (p. ej. snapshot generado en UI de Explorar). Si `mapSnapshotDataUrl` viene
   * relleno, no se vuelve a capturar ni a fetchear spots.
   */
  precomposed?: VisitedCountriesSharePayload | null;
};

async function shareVisitedCountriesFromPayload(
  show: ShareCountriesToastShow,
  opts: { colorScheme: "light" | "dark"; suppressToasts?: boolean },
  payload: VisitedCountriesSharePayload,
): Promise<ShareCountriesCardResult> {
  const accent = Colors[opts.colorScheme].stateSuccess;
  const result = await shareCountriesCard({
    title: "Países visitados",
    countriesCount: payload.countriesCount,
    spotsCount: payload.spotsCount,
    worldPercentage: payload.worldPercentage,
    accentColor: accent,
    mapSnapshotDataUrl: payload.mapSnapshotDataUrl ?? null,
    items: payload.items,
  });
  if (payload.mapSnapshotDataUrl?.trim()) {
    warmVisitedCountriesShareCache({
      items: payload.items,
      countriesCount: payload.countriesCount,
      spotsCount: payload.spotsCount,
      worldPercentage: payload.worldPercentage,
      mapSnapshotDataUrl: payload.mapSnapshotDataUrl,
    });
  }
  notifyShareCountriesCardOutcome(result, show, { suppress: opts.suppressToasts });
  return result;
}

/**
 * Flujo único «compartir avance / países visitados» (PNG + Web Share / descarga / portapapeles).
 * No depende del sheet de países: puede partir de `precomposed`, de la caché warm, o de spots+foto mapa (web).
 */
export async function shareVisitedCountriesProgress(
  params: ShareVisitedCountriesProgressParams,
): Promise<ShareCountriesCardResult | null> {
  const { show, colorScheme, suppressToasts, precomposed } = params;

  if (precomposed?.mapSnapshotDataUrl?.trim()) {
    return shareVisitedCountriesFromPayload(show, { colorScheme, suppressToasts }, precomposed);
  }

  const cached = readVisitedCountriesShareCache();
  if (cached?.mapSnapshotDataUrl?.trim()) {
    return shareVisitedCountriesFromPayload(show, { colorScheme, suppressToasts }, cached);
  }

  const {
    data: { session: auth },
  } = await supabase.auth.getSession();
  const user = auth?.user;
  if (!user || user.is_anonymous) {
    if (!suppressToasts) {
      show("Inicia sesión para compartir tu avance.", { type: "default", replaceVisible: true });
    }
    return null;
  }

  const spots = await fetchVisibleSpotsWithPinsDeduped(user.id);
  const baseline = buildVisitedCountriesShareBaselineFromSpots(spots);
  if (baseline == null) {
    if (!suppressToasts) {
      show("Aún no tienes lugares visitados para compartir.", { type: "default", replaceVisible: true });
    }
    return null;
  }

  let mapSnapshotDataUrl: string | null = null;
  if (Platform.OS === "web") {
    const { captureVisitedCountriesMapDataUrlWeb } = await import("./capture-map.web");
    mapSnapshotDataUrl = await captureVisitedCountriesMapDataUrlWeb({
      countryCodes: baseline.countryCodes,
      colorScheme,
    });
    if (!mapSnapshotDataUrl?.trim()) {
      if (!suppressToasts) {
        show("No se pudo generar la vista del mapa. Revisa tu conexión o inténtalo más tarde.", {
          type: "default",
          replaceVisible: true,
        });
      }
      return null;
    }
  }

  return shareVisitedCountriesFromPayload(
    show,
    { colorScheme, suppressToasts },
    {
      items: baseline.items,
      countriesCount: baseline.countriesCount,
      spotsCount: baseline.spotsCount,
      worldPercentage: baseline.worldPercentage,
      mapSnapshotDataUrl: mapSnapshotDataUrl ?? "",
    },
  );
}
