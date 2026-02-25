# Bitácora 131 — Iconos `maki` con sprite Mapbox (fallback `marker-15`)

**Fecha:** 2026-02-25  
**Rama:** `codex/track-a-phase-c-link-visibility-maki`

---

## Objetivo

Reemplazar fallback textual (`+`) en pins `saved/visited` por iconografía nativa de Mapbox basada en `linked_maki`.

## Cambios aplicados

Archivo:

- `lib/map-core/spots-layer.ts`

Ajustes:

- La capa `flowya-spots-makis` pasa de `text-field` a `icon-image`.
- Se deriva nombre de ícono desde `linked_maki`:
  - con sufijo existente (`-11`/`-15`) se respeta,
  - sin sufijo se usa `${maki}-11`.
- Fallback robusto en runtime:
  - `coalesce(image(makiIcon), image('marker-15'))`
- Se mantiene render solo para `pinStatus in ['to_visit','visited']`.

## Impacto esperado

- El centro del pin ya no muestra `+`; muestra ícono `maki` cuando existe en sprite.
- Si un `maki` no existe en el style sprite, cae automáticamente a `marker-15` sin romper render.

## Validación

- `eslint` OK.
- `npm run build` (web export) OK.

