# Bitácora 117 — FlyTo con pitch 3D y padding para sheet

**Fecha:** 2026-02-22

## Objetivo

Al seleccionar una card de búsqueda o usar el control "encuadrar spot", la cámara debe usar perspectiva 3D (pitch) y padding inferior para que el spot quede visible sobre el sheet, respetando la preferencia del usuario: solo pitch cuando 3D está activado.

## Cambios

### 1. Nueva constante

- **Archivo:** [lib/map-core/constants.ts](../lib/map-core/constants.ts)
- `SPOT_FOCUS_PADDING_BOTTOM = 220` — padding inferior (px) al flyTo cuando sheet medium/expanded.

### 2. useMapCore

- **Archivo:** [hooks/useMapCore.ts](../hooks/useMapCore.ts)
- Nueva opción `is3DEnabled?: boolean`.
- `flyToOptions` useMemo: cuando `is3DEnabled`, incluye `pitch: INITIAL_PITCH` y `padding: { bottom: SPOT_FOCUS_PADDING_BOTTOM }`.
- `handleReframeSpot`, `handleReframeSpotAndUser` (caso 1 punto), `programmaticFlyTo`: usan pitch + padding solo si 3D activado.

### 3. MapScreenVNext

- Pasa `is3DEnabled` a `useMapCore`.
- `is3DEnabled` movido antes de la llamada a useMapCore para poder pasarlo.

### 4. MapScreenV0

- No pasa `is3DEnabled`; por defecto 2D sin pitch. Sin cambios.

## Regla de protección

Nunca activar 3D contra la preferencia del usuario. Solo pitch cuando `is3DEnabled === true`.
