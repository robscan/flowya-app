# 154 — Search con filtros: secciones `Spots cercanos` y `En todo el mapa`

Fecha: 2026-02-25

## Contexto

Se pidió separar resultados de búsqueda cuando el usuario aplica filtros (`Por visitar` / `Visitados`) para distinguir:

- resultados en viewport actual (`Spots cercanos`)
- resultados fuera de viewport (`En todo el mapa`)

Objetivo: lectura más clara sin complejizar el motor.

## Implementación

Archivos:

- `components/explorar/MapScreenVNext.tsx`
- `components/search/types.ts`
- `components/search/SearchOverlayWeb.tsx`
- `components/search/SearchFloatingNative.tsx`

Cambio:

1. `MapScreenVNext` calcula `resultSections` usando bounds actuales del mapa:
   - `nearby`: spots dentro de viewport.
   - `world`: spots fuera de viewport.
2. Esta separación se activa para filtros `saved`/`visited`; en `all` se mantiene flujo actual.
3. Overlays web/native consumen `resultSections`:
   - si hay secciones, renderizan headers por sección.
   - si no hay secciones, mantienen `stageLabel` único.

## Resultado esperado

- En filtros de estado, la lista de resultados se presenta en dos bloques claros (cercanos vs resto del mapa).
- Menor ambigüedad para QA al validar disponibilidad local y global.

## Validación mínima

- `npm run lint` OK.

