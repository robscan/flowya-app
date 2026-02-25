# Bitácora 135 — Search V2 Fase C (secciones mixtas + dedupe interno/externo)

**Fecha:** 2026-02-25  
**Rama:** `main`

---

## Objetivo

Avanzar Fase C de `PLAN_SEARCH_V2_POI_FIRST_SAFE_MIGRATION` con un rollout seguro:

- presentar resultados mixtos por secciones (interno + externo),
- evitar duplicados visibles entre spots y POIs externos.

## Cambios aplicados

Archivos:

- `components/explorar/MapScreenVNext.tsx`
- `components/search/SearchOverlayWeb.tsx`
- `components/search/SearchFloatingNative.tsx`
- `docs/contracts/SEARCH_V2.md`
- `docs/definitions/search/SEARCH_V2.md`
- `docs/ops/plans/CHECKLIST_EXECUTION_LINKING_SEARCH_V2.md`

### 1) Sección mixta en Search

- Cuando `EXPO_PUBLIC_FF_SEARCH_MIXED_RANKING=true` y hay query activa:
  - Search mantiene spots internos como sección principal.
  - Se añade sección externa complementaria: “También en POI y direcciones”.

### 2) Dedupe interno/externo

- En suggestions externas:
  - dedupe por `linked_place_id` (spot ya enlazado al POI),
  - fallback de dedupe por proximidad + nombre normalizado.
- Dedupe extra por clave estable de place (`id+name+coords`) para evitar repeticiones.

## Resultado

- UX de búsqueda muestra opciones externas relevantes sin desplazar spots internos.
- Menos duplicados en zonas densas cuando existe spot enlazado.
- Queda pendiente de Fase C: ranking taxonómico fino de intents.
