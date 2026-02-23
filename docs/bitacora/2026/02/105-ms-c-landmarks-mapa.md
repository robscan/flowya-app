# Bitácora 105 (2026/02) — MS-C: Landmarks visibles en mapa

**Fecha:** 2026-02-14

**Objetivo:** Mostrar museos, plazas, parques, edificios relevantes para orientación; ocultar POIs comerciales (restaurantes, McDonald's, etc.).

---

## Decisión JTBD

- **Mostrar:** Landmarks — museos, plazas públicas, edificios notables, parques.
- **Ocultar:** POIs comerciales — no alineados con el estilo de vida del usuario.

## Cambios realizados

- **`lib/map-core/constants.ts`**
  - Nueva función `showLandmarkLabels(map)`: llama `setConfigProperty('basemap', 'showLandmarkIcons', true)` y `showLandmarkIconLabels`, true. Try/catch por compatibilidad con estilos sin basemap.

- **`hooks/useMapCore.ts`**
  - Nueva opción `enableLandmarkLabels?: boolean`.
  - En `onMapLoad`, si `enableLandmarkLabels === true`, llama `showLandmarkLabels(map)`.

- **`components/explorar/MapScreenVNext.tsx`**
  - Pasa `enableLandmarkLabels: true` a `useMapCore`.

FLOWYA mantiene `showPointOfInterestLabels: false`, por lo que POIs comerciales siguen ocultos.
