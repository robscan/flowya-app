import { CountriesMapPreview } from "@/components/design-system/countries-map-preview";
import { Colors } from "@/constants/theme";
import {
  COUNTRIES_SHEET_MAP_PREVIEW_HEIGHT_PX,
  COUNTRIES_SHEET_MAP_PREVIEW_INNER_WIDTH_DESKTOP_PX,
  getCountriesSheetMapPreviewCaptureSizePx,
} from "@/lib/explore/countries-sheet-map-preview-dimensions";
import { createRoot, type Root } from "react-dom/client";
import React from "react";

export type CaptureVisitedCountriesMapSnapshotParams = {
  countryCodes: string[];
  colorScheme: "light" | "dark";
};

/**
 * Monta `CountriesMapPreview` fuera de pantalla (web) y devuelve el primer PNG en data URL.
 * Misma pieza DS que usa cualquier preview de mapa de países visitados.
 */
export function captureVisitedCountriesMapDataUrlWeb(
  params: CaptureVisitedCountriesMapSnapshotParams,
): Promise<string | null> {
  if (typeof document === "undefined") return Promise.resolve(null);

  const { width: captureW, height: captureH } =
    typeof window !== "undefined"
      ? getCountriesSheetMapPreviewCaptureSizePx(window.innerWidth)
      : {
          width: COUNTRIES_SHEET_MAP_PREVIEW_INNER_WIDTH_DESKTOP_PX,
          height: COUNTRIES_SHEET_MAP_PREVIEW_HEIGHT_PX,
        };

  const container = document.createElement("div");
  container.setAttribute("aria-hidden", "true");
  container.style.cssText = [
    "position:fixed",
    "left:-32000px",
    "top:0",
    `width:${captureW}px`,
    `height:${captureH}px`,
    "opacity:0.01",
    "pointer-events:none",
    "overflow:hidden",
  ].join(";");

  document.body.appendChild(container);

  return new Promise((resolve) => {
    let settled = false;
    let root: Root | null = null;

    const finish = (url: string | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      requestAnimationFrame(() => {
        try {
          root?.unmount();
        } catch {
          /* ignore */
        }
        container.remove();
        resolve(url && url.startsWith("data:image") ? url : null);
      });
    };

    const timer = window.setTimeout(() => finish(null), 22_000);

    const colors = Colors[params.colorScheme];
    const scheme = params.colorScheme;

    root = createRoot(container);
    root.render(
      <CountriesMapPreview
        countryCodes={params.countryCodes}
        height={captureH}
        highlightColor={colors.stateSuccess}
        forceColorScheme={scheme}
        baseCountryColor={colors.countriesMapCountryBaseVisited}
        lineCountryColor={colors.countriesMapCountryLineVisited}
        onSnapshotChange={(url) => {
          if (!url || !url.startsWith("data:image")) return;
          finish(url);
        }}
      />,
    );
  });
}
