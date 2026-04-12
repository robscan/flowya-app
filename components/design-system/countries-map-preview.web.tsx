import type { ExpressionSpecification } from "mapbox-gl";
import React, { useEffect, useMemo, useRef } from "react";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

type CountriesMapPreviewProps = {
  countryCodes: string[];
  height?: number;
  highlightColor?: string;
  forceColorScheme?: "light" | "dark";
  baseCountryColor?: string;
  lineCountryColor?: string;
  onSnapshotChange?: (dataUrl: string | null) => void;
  onCountryPress?: (
    countryCode: string,
    bounds: [[number, number], [number, number]],
  ) => void;
};

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "";
const WORLD_SOURCE_ID = "flowya-world-countries-vector";
const WORLD_BASE_LAYER_ID = "flowya-world-base";
const WORLD_HIGHLIGHT_LAYER_ID = "flowya-world-highlight";
const WORLD_LINE_LAYER_ID = "flowya-world-line";
/** Límite sur/norte Web Mercator (incluye Antártida). El encuadre inicial usa un sur menos extremo para recortar el polo. */
const WORLD_BOUNDS: [[number, number], [number, number]] = [
  [-179.99, -85.0511],
  [179.99, 85.0511],
];
/** Encuadre inicial: Antártida parcialmente cortada; el usuario puede desplazar solo hacia el sur hasta verla entera. */
const INITIAL_FIT_BOUNDS: [[number, number], [number, number]] = [
  [-179.99, -58],
  [179.99, 85.0511],
];

function clampVerticalPan(
  map: import("mapbox-gl").Map,
  initialSouthEdge: number,
  floorSouth: number,
) {
  for (let i = 0; i < 10; i++) {
    const b = map.getBounds();
    if (!b) break;
    const s = b.getSouth();
    const c = map.getCenter();
    const z = map.getZoom();
    if (s > initialSouthEdge + 1e-5) {
      map.jumpTo({
        center: [c.lng, c.lat - (s - initialSouthEdge) * 0.52],
        zoom: z,
      });
      continue;
    }
    if (s < floorSouth - 1e-5) {
      map.jumpTo({
        center: [c.lng, c.lat + (floorSouth - s) * 0.52],
        zoom: z,
      });
      continue;
    }
    break;
  }
}

function clampCenterLng(map: import("mapbox-gl").Map, lockedLng: number) {
  const c = map.getCenter();
  if (Math.abs(c.lng - lockedLng) < 1e-5) return;
  map.jumpTo({ center: [lockedLng, c.lat], zoom: map.getZoom() });
}
const CLEAN_WORLD_STYLE = {
  version: 8,
  sources: {},
  layers: [],
} as const;

function hasMapSource(map: import("mapbox-gl").Map, sourceId: string): boolean {
  try {
    return Boolean(map.getSource(sourceId));
  } catch {
    return false;
  }
}

function hasMapLayer(map: import("mapbox-gl").Map, layerId: string): boolean {
  try {
    return Boolean(map.getLayer(layerId));
  } catch {
    return false;
  }
}

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
  baseCountryFill: string,
) {
  return [
    "case",
    ["in", countryIsoExpression(), ["literal", codes]],
    highlightColor,
    baseCountryFill,
  ];
}

function pushCoordIntoBounds(
  coord: unknown,
  bounds: { west: number; south: number; east: number; north: number },
) {
  if (!Array.isArray(coord) || coord.length < 2) return;
  const lng = coord[0];
  const lat = coord[1];
  if (typeof lng !== "number" || typeof lat !== "number") return;
  bounds.west = Math.min(bounds.west, lng);
  bounds.south = Math.min(bounds.south, lat);
  bounds.east = Math.max(bounds.east, lng);
  bounds.north = Math.max(bounds.north, lat);
}

function resolveBoundsFromRingCoords(coords: unknown): {
  west: number;
  south: number;
  east: number;
  north: number;
  centerLng: number;
  centerLat: number;
} | null {
  if (!Array.isArray(coords) || coords.length === 0) return null;
  const bounds = {
    west: Number.POSITIVE_INFINITY,
    south: Number.POSITIVE_INFINITY,
    east: Number.NEGATIVE_INFINITY,
    north: Number.NEGATIVE_INFINITY,
  };
  for (const coord of coords) {
    pushCoordIntoBounds(coord, bounds);
  }
  if (
    !Number.isFinite(bounds.west) ||
    !Number.isFinite(bounds.south) ||
    !Number.isFinite(bounds.east) ||
    !Number.isFinite(bounds.north)
  ) {
    return null;
  }
  return {
    ...bounds,
    centerLng: (bounds.west + bounds.east) / 2,
    centerLat: (bounds.south + bounds.north) / 2,
  };
}

function resolveCountryBoundsNearTap(
  geometry: { type?: string; coordinates?: unknown } | undefined,
  tapLng: number,
  tapLat: number,
): [[number, number], [number, number]] | null {
  if (!geometry?.coordinates) return null;
  const candidates: {
    west: number;
    south: number;
    east: number;
    north: number;
    centerLng: number;
    centerLat: number;
  }[] = [];

  if (geometry.type === "Polygon") {
    const polygon = geometry.coordinates;
    if (Array.isArray(polygon) && polygon.length > 0) {
      const ringBounds = resolveBoundsFromRingCoords(polygon[0]);
      if (ringBounds) candidates.push(ringBounds);
    }
  } else if (geometry.type === "MultiPolygon") {
    const multi = geometry.coordinates;
    if (Array.isArray(multi)) {
      for (const polygon of multi) {
        if (!Array.isArray(polygon) || polygon.length === 0) continue;
        const ringBounds = resolveBoundsFromRingCoords(polygon[0]);
        if (ringBounds) candidates.push(ringBounds);
      }
    }
  } else {
    const ringBounds = resolveBoundsFromRingCoords(geometry.coordinates);
    if (ringBounds) candidates.push(ringBounds);
  }

  if (candidates.length === 0) return null;
  const closest = candidates.reduce((best, current) => {
    const bestDistSq = (best.centerLng - tapLng) ** 2 + (best.centerLat - tapLat) ** 2;
    const currentDistSq = (current.centerLng - tapLng) ** 2 + (current.centerLat - tapLat) ** 2;
    return currentDistSq < bestDistSq ? current : best;
  });
  return [
    [closest.west, closest.south],
    [closest.east, closest.north],
  ];
}

export function CountriesMapPreview({
  countryCodes,
  height = 120,
  highlightColor = "#2E8CFF",
  forceColorScheme,
  baseCountryColor,
  lineCountryColor,
  onSnapshotChange,
  onCountryPress,
}: CountriesMapPreviewProps) {
  const colorScheme = useColorScheme();
  const activeScheme = forceColorScheme ?? (colorScheme === "dark" ? "dark" : "light");
  const colors = Colors[activeScheme];
  const resolvedBaseCountryColor = baseCountryColor ?? colors.mapPreviewCountryBase;
  const resolvedLineCountryColor = lineCountryColor ?? colors.mapPreviewCountryLine;
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("mapbox-gl").Map | null>(null);
  const worldLayerReadyRef = useRef(false);
  const normalizedCodesRef = useRef<string[]>([]);
  /** Borde sur del viewport tras el primer fit (no se puede desplazar “hacia arriba” más allá de esto). */
  const initialSouthEdgeRef = useRef<number | null>(null);
  /** Longitud bloqueada: solo pan vertical (no desplazar el mapamundi horizontalmente). */
  const initialLngRef = useRef<number | null>(null);
  const wheelCleanupRef = useRef<(() => void) | null>(null);
  /** Evita reentrada: `jumpTo` dispara `moveend` síncrono y recalaba el stack sin fin. */
  const isApplyingClampRef = useRef(false);

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
        maxZoom: 4,
        /** Clicks + pan vertical (Antártida); zoom por rueda desactivado (scroll = pan). */
        interactive: true,
        attributionControl: false,
        preserveDrawingBuffer: true,
        renderWorldCopies: false,
        maxBounds: WORLD_BOUNDS,
      });
      mapRef.current = map;

      map.on("load", async () => {
        if (isCancelled) return;
        try {
          map.setProjection("naturalEarth");
          map.dragPan.enable();
          map.scrollZoom.disable();
          map.doubleClickZoom.disable();
          map.touchZoomRotate.disable();
          map.dragRotate.disable();
          map.boxZoom.disable();
          map.keyboard.disable();
          map.resize();
          if (!hasMapSource(map, WORLD_SOURCE_ID)) {
            map.addSource(WORLD_SOURCE_ID, {
              type: "vector",
              url: "mapbox://mapbox.country-boundaries-v1",
            });
          }
          if (!hasMapLayer(map, WORLD_BASE_LAYER_ID)) {
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
                  resolvedBaseCountryColor,
                ) as ExpressionSpecification,
                "fill-outline-color": resolvedBaseCountryColor,
                "fill-opacity": 1,
                "fill-antialias": true,
              },
            });
          }
          if (!hasMapLayer(map, WORLD_HIGHLIGHT_LAYER_ID)) {
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
                "line-width": [
                  "case",
                  ["in", countryIsoExpression(), ["literal", normalizedCodesRef.current]],
                  0.35,
                  0,
                ],
                "line-opacity": 0.7,
              },
              layout: {
                "line-cap": "round",
                "line-join": "round",
              },
            });
          }
          if (!hasMapLayer(map, WORLD_LINE_LAYER_ID)) {
            map.addLayer({
              id: WORLD_LINE_LAYER_ID,
              type: "line",
              source: WORLD_SOURCE_ID,
              "source-layer": "country_boundaries",
              paint: {
                "line-color": resolvedLineCountryColor,
                "line-width": 0.12,
                "line-opacity": 0.07,
              },
            });
          }
          worldLayerReadyRef.current = true;
          if (hasMapLayer(map, WORLD_BASE_LAYER_ID)) {
            map.setPaintProperty(
              WORLD_BASE_LAYER_ID,
              "fill-color",
              highlightedColorExpression(
                normalizedCodesRef.current,
                highlightColor,
                resolvedBaseCountryColor,
              ) as never,
            );
          }
          if (hasMapLayer(map, WORLD_HIGHLIGHT_LAYER_ID)) {
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
          }
          requestAnimationFrame(() => {
            if (isCancelled || mapRef.current !== map) return;
            map.resize();
            map.fitBounds(INITIAL_FIT_BOUNDS, {
              padding: { top: 4, bottom: 4, left: 0, right: 0 },
              duration: 0,
              maxZoom: 4,
            });
            const b = map.getBounds();
            if (!b) {
              map.once("idle", emitSnapshot);
              return;
            }
            initialSouthEdgeRef.current = b.getSouth();
            initialLngRef.current = map.getCenter().lng;

            const floorSouth = WORLD_BOUNDS[0][1];
            const applyClampAndSnapshot = () => {
              if (
                isCancelled ||
                initialSouthEdgeRef.current == null ||
                initialLngRef.current == null
              ) {
                return;
              }
              if (isApplyingClampRef.current) return;
              isApplyingClampRef.current = true;
              try {
                clampVerticalPan(map, initialSouthEdgeRef.current, floorSouth);
                clampCenterLng(map, initialLngRef.current);
                map.once("idle", emitSnapshot);
              } finally {
                queueMicrotask(() => {
                  isApplyingClampRef.current = false;
                });
              }
            };
            const onMoveEnd = () => {
              applyClampAndSnapshot();
            };
            map.on("moveend", onMoveEnd);

            const containerEl = mapContainerRef.current;
            if (containerEl) {
              const onWheel = (e: WheelEvent) => {
                if (
                  isCancelled ||
                  initialSouthEdgeRef.current == null ||
                  initialLngRef.current == null
                ) {
                  return;
                }
                e.preventDefault();
                map.panBy([0, -e.deltaY * 0.42], { animate: false });
                applyClampAndSnapshot();
              };
              containerEl.addEventListener("wheel", onWheel, { passive: false });
              wheelCleanupRef.current = () => {
                containerEl.removeEventListener("wheel", onWheel);
                wheelCleanupRef.current = null;
              };
            }

            map.once("idle", emitSnapshot);
          });

          map.on("click", (event) => {
            if (!onCountryPress) return;
            const features = map.queryRenderedFeatures(event.point, {
              layers: [WORLD_BASE_LAYER_ID],
            });
            const feature = features.find((f) => {
              const props = (f.properties ?? {}) as Record<string, unknown>;
              const code = String(props.iso_3166_1_alpha_2 ?? props.iso_3166_1 ?? "")
                .trim()
                .toUpperCase();
              return /^[A-Z]{2}$/.test(code);
            });
            if (!feature) return;
            const props = (feature.properties ?? {}) as Record<string, unknown>;
            const code = String(props.iso_3166_1_alpha_2 ?? props.iso_3166_1 ?? "")
              .trim()
              .toUpperCase();
            if (!code) return;

            const selectedBounds = resolveCountryBoundsNearTap(
              feature.geometry as { type?: string; coordinates?: unknown } | undefined,
              event.lngLat.lng,
              event.lngLat.lat,
            );
            if (!selectedBounds) return;
            onCountryPress(code, selectedBounds);
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
      wheelCleanupRef.current?.();
      initialSouthEdgeRef.current = null;
      initialLngRef.current = null;
      isApplyingClampRef.current = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      onSnapshotChange?.(null);
    };
  }, [highlightColor, emitSnapshot, onSnapshotChange, onCountryPress, resolvedBaseCountryColor, resolvedLineCountryColor]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!worldLayerReadyRef.current) return;
    if (!hasMapLayer(map, WORLD_BASE_LAYER_ID)) return;
    try {
      map.setPaintProperty(
        WORLD_BASE_LAYER_ID,
        "fill-color",
        highlightedColorExpression(normalizedCodes, highlightColor, resolvedBaseCountryColor) as never,
      );
      if (hasMapLayer(map, WORLD_HIGHLIGHT_LAYER_ID)) {
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
        map.setPaintProperty(
          WORLD_HIGHLIGHT_LAYER_ID,
          "line-width",
          [
            "case",
            ["in", countryIsoExpression(), ["literal", normalizedCodes]],
            0.35,
            0,
          ] as never,
        );
      }
      if (hasMapLayer(map, WORLD_LINE_LAYER_ID)) {
        map.setPaintProperty(WORLD_LINE_LAYER_ID, "line-color", resolvedLineCountryColor);
      }
      map.once("idle", emitSnapshot);
    } catch {
      // ignore style lifecycle races (style reloading / map destroyed)
    }
  }, [normalizedCodes, highlightColor, emitSnapshot, resolvedBaseCountryColor, resolvedLineCountryColor]);

  return (
    <div
      ref={hostRef}
      style={{
        width: "100%",
        height,
        overflow: "hidden",
        borderRadius: 16,
        background: "transparent",
        position: "relative",
        touchAction: "pan-y",
        userSelect: "none",
      }}
    >
      <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
