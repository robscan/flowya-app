# Bitácora 132 — Fallback `styleimagemissing` para `maki-*` y `marker-15`

**Fecha:** 2026-02-25  
**Rama:** `codex/track-a-phase-c-link-visibility-maki`

---

## Problema

En estilos FLOWYA sin sprite completo, Mapbox lanzaba:

- `Image "marker-15" could not be loaded`

al resolver `icon-image` en capa de `maki`.

## Solución aplicada

Se agregó fallback runtime con `styleimagemissing`:

- archivo nuevo: `lib/map-core/style-image-fallback.ts`
- integración: `hooks/useMapCore.ts`

Comportamiento:

- cuando falta una imagen `maki-*` o `marker-15`, se registra una imagen fallback generada en canvas vía `map.addImage`.
- elimina dependencia dura de sprite publicado en el style para estos casos.

## Validación

- `eslint` OK (solo warning preexistente de deps en `useMapCore`).
- `npm run build` web export OK.

