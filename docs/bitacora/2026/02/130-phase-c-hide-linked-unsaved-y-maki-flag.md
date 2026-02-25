# Bitácora 130 — Phase C: hide linked-unsaved + maki icon por flag

**Fecha:** 2026-02-25  
**Rama:** `codex/track-a-phase-c-link-visibility-maki`

---

## Objetivo

Iniciar cierre de Fase C del plan de linking visual: ocultar pins FLOWYA en spots `linked` sin estado y habilitar iconografía derivada de `maki` para `saved/visited` detrás de feature flags.

## Cambios aplicados

Archivos:

- `components/explorar/MapScreenVNext.tsx`
- `hooks/useMapCore.ts`
- `lib/map-core/spots-layer.ts`

### 1) Regla `linked + unsaved` (feature-flag)

- Se agregó filtro de visibilidad en mapa:
  - con `EXPO_PUBLIC_FF_HIDE_LINKED_UNSAVED=true`, spots `link_status=linked` y `saved=false` y `visited=false` no se renderizan como pin FLOWYA.
- Guardrail:
  - spots `uncertain` o `unlinked` permanecen visibles.
  - no se reinyecta `selectedSpot` oculto por esta regla.

### 2) Iconografía `maki` (feature-flag)

- `useMapCore` ahora recibe `showMakiIcon`.
- `spots-layer` agrega capa `flowya-spots-makis` (symbol) opcional cuando `EXPO_PUBLIC_FF_FLOWYA_PIN_MAKI_ICON=true`.
- Se usa `linked_maki` para derivar un glyph seguro (con fallback) y se muestra solo en `to_visit|visited`.

### 3) Consistencia en create-from-POI/Search

- Insert de spots desde POI ahora incluye `link_*` en `select`, para reflejar visibilidad/ícono de forma consistente desde el momento de creación.

## Validación técnica

- `eslint` en archivos tocados: sin errores (solo warning preexistente en hook deps de `useMapCore`).

## Riesgo residual

- El glyph de `maki` actual es fallback textual (seguro de render) y no sprite de ícono nativo Mapbox; se puede evolucionar en iteración posterior si se aprueba costo de mantenimiento de sprites/íconos.

