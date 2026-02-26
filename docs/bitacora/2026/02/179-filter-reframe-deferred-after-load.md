# 179 — Reencuadre diferido al cambiar filtro (`saved/visited`)

**Fecha:** 2026-02-26  
**Rama:** `codex/next-search-map-iteration`

## Objetivo

Evitar decisiones prematuras de zoom-out al cambiar de filtro cuando el nuevo filtro aún no termina de cargar/renderizar pines en viewport.

## Cambio aplicado

- `MapScreenVNext` ahora separa el cambio de filtro de la decisión de reencuadre:
  - En `handlePinFilterChange` se registra una intención de reencuadre diferido para el filtro destino.
  - Un `useEffect` posterior (con filtro ya aplicado y lista `filteredSpots` actualizada) decide:
    - si hay pines visibles del filtro en viewport: mantener encuadre actual,
    - si no hay visibles: reencuadrar a todos los pines del filtro.
- Se mantiene excepción de continuidad para caso de pendiente (foco en spot pendiente + sheet `medium`).

## Archivo

- `components/explorar/MapScreenVNext.tsx`

## Validación mínima

- Lint OK.
