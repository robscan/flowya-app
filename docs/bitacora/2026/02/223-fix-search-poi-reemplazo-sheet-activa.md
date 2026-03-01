# 223 — Fix: selección de POI desde search reemplaza sheet activa

Fecha: 2026-02-28  
Tipo: fix UX/flujo / OL-P2-006 (P0)

## Contexto

Al seleccionar un POI no guardado desde Search con la sheet de otro spot visible, la selección nueva no persistía y no aparecía la sheet del POI.

## Causa raíz

En `MapScreenVNext`, la restauración al cerrar Search (`shouldRestoreSelectionOnSearchClose`) consideraba solo `selectedSpot` como selección activa, ignorando `poiTapped`.

## Implementación

- Archivo: `components/explorar/MapScreenVNext.tsx`
- Ajuste en efecto de restore al cerrar Search:
  - `hasCurrentSelection` ahora evalúa `selectedSpot != null || poiTapped != null`.
  - Se añadió `poiTapped` en dependencias del `useEffect`.

## Validación

- `npx eslint components/explorar/MapScreenVNext.tsx`: OK.
- Smoke manual reportado por QA:
  - abrir sheet de spot A,
  - abrir Search,
  - seleccionar POI no guardado,
  - Search cierra y se muestra sheet del POI nuevo (medium), sin volver a spot A.

## Nota

El warning de consola `Ignored attempt to cancel a touchmove event with cancelable=false` se mantiene como señal de interacción del browser y no bloquea este flujo de selección.
