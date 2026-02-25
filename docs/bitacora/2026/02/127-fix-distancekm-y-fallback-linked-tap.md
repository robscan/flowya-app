# Bitácora 127 — Fix `distanceKm` + fallback de tap para spots `linked`

**Fecha:** 2026-02-25  
**Rama:** `codex/search-poi-linking-phase-b`

---

## Objetivo

Corregir crash en `MapScreenVNext` y mejorar robustez del tap en POI para abrir sheet Flowya cuando el spot ya está enlazado.

## Cambios aplicados

Archivo:

- `components/explorar/MapScreenVNext.tsx`

Ajustes:

- Se restaura import de `distanceKm` (evita `ReferenceError` en runtime).
- Se mantiene match principal por `linked_place_id` del spot vs id del feature tocado.
- Se agrega fallback de seguridad: si no hay id estable en el feature, permite match solo con spots `link_status = linked` por proximidad estricta (`<= 0.012 km`, ~12 m).

## Impacto esperado

- El mapa deja de crashear por `distanceKm is not defined`.
- Mejora probabilidad de abrir sheet Flowya para spots realmente linked cuando Mapbox no expone id consistente en el tap.
- No se reintroduce el comportamiento previo de proximidad para spots `unlinked`.

