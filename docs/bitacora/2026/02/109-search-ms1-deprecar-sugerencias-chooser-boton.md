# Bitácora 109 (2026/02) — Search MS-1: Deprecar sugerencias, chooser como botón

**Fecha:** 2026-02-22  
**Objetivo:** MS-1 del plan Search POI + UX sin resultados: deprecar sugerencias ES↔EN, ajustar UX no-results.

---

## Cambios

### 1. Sugerencias ES↔EN — deprecated y ocultas

- `SearchOverlayWeb.tsx` y `SearchFloatingNative.tsx`: bloque de sugerencias envuelto en `{false && ...}` con comentario `@deprecated`.
- Entrada en `docs/ops/governance/GUARDRAILS_DEPRECACION.md`.
- Contratos `SEARCH_NO_RESULTS_CREATE_CHOOSER` y `SEARCH_V2` actualizados. Reemplazo previsto: `mapPoiResults` (MS-2).

### 2. "No hay spots" condicional

- El mensaje introductorio "No hay spots con ese nombre. Puedes crearlo en Flowya:" se muestra solo cuando `placeSuggestions.length === 0`.
- Texto centrado (`textAlign: 'center'`).

### 3. CTA "Crear spot aquí" como botón

- Estilo pill (tint) similar a `detailButton` de SpotSheet, en lugar de `suggestionRow`.
- Subtítulo: "Centro del mapa o tu ubicación" debajo del título, en blanco semitransparente.

---

## Fuentes de verdad

- `components/search/SearchOverlayWeb.tsx`
- `components/search/SearchFloatingNative.tsx`
- `docs/ops/governance/GUARDRAILS_DEPRECACION.md`
- `docs/contracts/SEARCH_NO_RESULTS_CREATE_CHOOSER.md`
- `docs/definitions/search/SEARCH_V2.md`
