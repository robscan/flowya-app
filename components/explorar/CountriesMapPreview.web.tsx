import React, { useEffect, useMemo, useRef } from "react";

type CountriesMapPreviewProps = {
  countryCodes: string[];
  height?: number;
  highlightColor?: string;
  onSnapshotChange?: (dataUrl: string | null) => void;
};

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "";
const WORLD_SOURCE_ID = "flowya-world-countries-vector";
const WORLD_BASE_LAYER_ID = "flowya-world-base";
const WORLD_HIGHLIGHT_LAYER_ID = "flowya-world-highlight";
const WORLD_LINE_LAYER_ID = "flowya-world-line";
const WORLD_BOUNDS: [[number, number], [number, number]] = [[-179, -58], [179, 84]];
const BASE_COUNTRY_FILL = "#6A7087";
const BASE_COUNTRY_LINE = "#7A8098";

const CLEAN_WORLD_STYLE = {
  version: 8,
  sources: {},
  layers: [],
} as const;

function countryIsoExpression() {
  return [
    "upcase",
    [
      "coalesce",
      ["get", "iso_3166_1_alpha_2"],
      ["get", "iso_3166_1"],
      "",
    ],
  ];
}

function highlightedColorExpression(
  codes: string[],
  highlightColor: string,
) {
  return [
    "case",
    ["in", countryIsoExpression(), ["literal", codes]],
    highlightColor,
    BASE_COUNTRY_FILL,
  ];
}

export function CountriesMapPreview({
  countryCodes,
  height = 120,
  highlightColor = "#2E8CFF",
  onSnapshotChange,
}: CountriesMapPreviewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("mapbox-gl").Map | null>(null);
  const worldLayerReadyRef = useRef(false);
  const normalizedCodesRef = useRef<string[]>([]);

  const emitSnapshot = useMemo(
    () => () => {
      if (!onSnapshotChange) return;
      const map = mapRef.current;
      if (!map) return;
      try {
        const canvas = map.getCanvas();
        const dataUrl = canvas.toDataURL("image/png");
        onSnapshotChange(dataUrl);
      } catch {
        onSnapshotChange(null);
      }
    },
    [onSnapshotChange],
  );

  const normalizedCodes = useMemo(
    () =>
      countryCodes
        .map((code) => code.trim().toUpperCase())
        .filter((code) => /^[A-Z]{2}$/.test(code)),
    [countryCodes],
  );
  useEffect(() => {
    normalizedCodesRef.current = normalizedCodes;
  }, [normalizedCodes]);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (!MAPBOX_TOKEN) return;
    let isCancelled = false;

    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (isCancelled || !mapContainerRef.current) return;

      mapboxgl.accessToken = MAPBOX_TOKEN;
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: CLEAN_WORLD_STYLE as unknown as mapboxgl.StyleSpecification,
        center: [0, 16],
        zoom: 0,
        minZoom: -1,
        maxZoom: 1,
        interactive: false,
        attributionControl: false,
        preserveDrawingBuffer: true,
        renderWorldCopies: false,
      });
      mapRef.current = map;

      map.on("load", async () => {
        if (isCancelled) return;
        try {
          map.setProjection("naturalEarth");
          map.resize();
          map.fitBounds(WORLD_BOUNDS, {
            padding: { top: 0, bottom: 0, left: 0, right: 0 },
            duration: 0,
            maxZoom: 0.15,
          });
          if (!map.getSource(WORLD_SOURCE_ID)) {
            map.addSource(WORLD_SOURCE_ID, {
              type: "vector",
              url: "mapbox://mapbox.country-boundaries-v1",
            });
          }
          if (!map.getLayer(WORLD_BASE_LAYER_ID)) {
            map.addLayer({
              id: WORLD_BASE_LAYER_ID,
              type: "fill",
              source: WORLD_SOURCE_ID,
              "source-layer": "country_boundaries",
              layout: {
                "fill-sort-key": 0,
              },
              paint: {
                "fill-color": highlightedColorExpression(
                  normalizedCodesRef.current,
                  highlightColor,
                ),
                "fill-opacity": 1,
                "fill-antialias": true,
              },
            });
          }
          if (!map.getLayer(WORLD_HIGHLIGHT_LAYER_ID)) {
            map.addLayer({
              id: WORLD_HIGHLIGHT_LAYER_ID,
              type: "line",
              source: WORLD_SOURCE_ID,
              "source-layer": "country_boundaries",
              paint: {
                "line-color": [
                  "case",
                  ["in", countryIsoExpression(), ["literal", normalizedCodesRef.current]],
                  highlightColor,
                  "rgba(0,0,0,0)",
                ],
                "line-width": 0.6,
                "line-opacity": 0.9,
              },
            });
          }
          if (!map.getLayer(WORLD_LINE_LAYER_ID)) {
            map.addLayer({
              id: WORLD_LINE_LAYER_ID,
              type: "line",
              source: WORLD_SOURCE_ID,
              "source-layer": "country_boundaries",
              paint: {
                "line-color": BASE_COUNTRY_LINE,
                "line-width": 0.15,
                "line-opacity": 0.12,
              },
            });
          }
          worldLayerReadyRef.current = true;
          map.setPaintProperty(
            WORLD_BASE_LAYER_ID,
            "fill-color",
            highlightedColorExpression(
              normalizedCodesRef.current,
              highlightColor,
            ) as never,
          );
          map.setPaintProperty(
            WORLD_HIGHLIGHT_LAYER_ID,
            "line-color",
            [
              "case",
              ["in", countryIsoExpression(), ["literal", normalizedCodesRef.current]],
              highlightColor,
              "rgba(0,0,0,0)",
            ] as never,
          );
          requestAnimationFrame(() => {
            map.resize();
            map.fitBounds(WORLD_BOUNDS, {
              padding: { top: 0, bottom: 0, left: 0, right: 0 },
              duration: 0,
              maxZoom: 0.15,
            });
            map.once("idle", emitSnapshot);
          });
        } catch {
          // silent fallback: base map without custom highlight
          onSnapshotChange?.(null);
        }
      });
    })();

    return () => {
      isCancelled = true;
      worldLayerReadyRef.current = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      onSnapshotChange?.(null);
    };
  }, [highlightColor, emitSnapshot, onSnapshotChange]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!worldLayerReadyRef.current) return;
    if (!map.getLayer(WORLD_BASE_LAYER_ID)) return;
    map.setPaintProperty(
      WORLD_BASE_LAYER_ID,
      "fill-color",
      highlightedColorExpression(normalizedCodes, highlightColor) as never,
    );
    if (map.getLayer(WORLD_HIGHLIGHT_LAYER_ID)) {
      map.setPaintProperty(
        WORLD_HIGHLIGHT_LAYER_ID,
        "line-color",
        [
          "case",
          ["in", countryIsoExpression(), ["literal", normalizedCodes]],
          highlightColor,
          "rgba(0,0,0,0)",
        ] as never,
      );
    }
    map.once("idle", emitSnapshot);
  }, [normalizedCodes, highlightColor, emitSnapshot]);

  return (
    <div
      style={{
        width: "100%",
        height,
        overflow: "hidden",
        borderRadius: 16,
        background: "transparent",
        position: "relative",
      }}
    >
      <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
