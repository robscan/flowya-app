# 253 — Fix: POI sheet en filtro activo cuando match no pertenece al filtro

Fecha: 2026-03-01
Tipo: bugfix runtime Explore

## Síntoma

En `saved/visited`, al tocar un POI no guardado en el filtro, el sheet parecía intentar abrir pero se cerraba inmediatamente.

## Causa

Durante `map tap`, algunos POI resolvían `match` contra un spot existente fuera del filtro activo.
Se abría ruta de `selectedSpot`, luego los guardrails de filtro lo limpiaban, dejando sheet sin contenido.

## Fix

Archivo: `components/explorar/MapScreenVNext.tsx`

- En `handleMapClick`:
  - si hay `match` y **sí** pertenece al filtro activo -> comportamiento actual (SpotSheet con spot).
  - si hay `match` pero **no** pertenece al filtro activo -> tratar como POI y abrir `POI sheet`.

## Resultado

- En filtros activos, un POI no guardado ya abre su sheet correctamente.
- Se mantiene consistencia del guardrail para spots fuera de filtro.

## Sanidad

- `npm run lint -- --no-cache` OK.
