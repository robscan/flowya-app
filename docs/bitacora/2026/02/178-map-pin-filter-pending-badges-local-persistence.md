# 178 — Persistencia local de badges pendientes en MapPinFilter

**Fecha:** 2026-02-26  
**Rama:** `codex/next-search-map-iteration`

## Objetivo

Hacer que los badges de "pendiente de lectura" en filtros de mapa sobrevivan recarga/cierre de sesión local hasta que el usuario consulte ese filtro o el conteo llegue a cero.

## Cambios aplicados

- Nuevo storage local:
  - `lib/storage/mapPinPendingBadges.ts`
  - Key: `flowya_map_pin_pending_badges`
  - API:
    - `getMapPinPendingBadges()`
    - `setMapPinPendingBadges(...)`
- `MapScreenVNext`:
  - Inicializa `pendingFilterBadges` desde storage local.
  - Persiste `pendingFilterBadges` en cada cambio (effect).
  - Mantiene limpieza por reglas existentes:
    - tap en filtro consultado,
    - count del filtro = 0.

## Alcance y guardrails

- Persistencia local por navegador/dispositivo (`localStorage`).
- No se usa cookie ni backend.
- En entornos sin `localStorage`, fallback seguro en memoria.

## Validación mínima

- Lint OK:
  - `lib/storage/mapPinPendingBadges.ts`
  - `components/explorar/MapScreenVNext.tsx`
