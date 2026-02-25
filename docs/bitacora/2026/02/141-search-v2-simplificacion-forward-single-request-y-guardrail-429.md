# Bitácora 141 — Search V2 simplificación: Search Box `/forward` (single request) + guardrail `429`

**Fecha:** 2026-02-25  
**Rama:** `main`

---

## Objetivo

Reducir complejidad y degradación por rate-limit en búsqueda externa:

- eliminar flujo `suggest + retrieve` (múltiples requests por query),
- usar Search Box `/forward` como fuente principal (una sola request por query),
- mantener fallback robusto a Geocoding v6.

## Cambios aplicados

Archivo:

- `lib/places/searchPlacesPOI.ts`

### 1) Simplificación de adapter externo

- Search externo principal ahora usa `searchbox/v1/forward`.
- Se conserva clasificación de intents (`landmark`, `geo`, `recommendation`) para parámetros y sesgo.

### 2) Resiliencia ante `429`

- Si Search Box responde `429`, se activa cooldown temporal (30s).
- Durante cooldown, la app usa fallback Geocoding para no romper UX.

### 3) Ranking landmark operativo

- Se mantiene precedencia `landmark > geo > recommendation`.
- Se conserva scoring básico de landmark (match de tokens, normalización de typo `Eifel` -> `Eiffel`, penalización de calle/comercial).

## Sync documental

- `docs/definitions/search/SEARCH_V2.md`
- `docs/contracts/SEARCH_V2.md`

## Sanidad

- `npm run lint` ✅
- `npm run build` ✅
