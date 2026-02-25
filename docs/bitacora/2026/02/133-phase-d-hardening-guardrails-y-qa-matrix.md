# Bitácora 133 — Phase D: hardening guardrails y matriz QA no-go

**Fecha:** 2026-02-25  
**Rama:** `main` (preparación de cierre Track A)

---

## Objetivo

Completar hardening técnico/documental de `PLAN_SPOT_LINKING_VISIBILITY_SAFE_ROLLOUT` tras Fase C, dejando los guardrails explícitos y una matriz de QA no-go para cierre formal de `OL-P0-004`.

## Cambios aplicados

Archivos:

- `components/explorar/MapScreenVNext.tsx`
- `docs/contracts/MAP_PINS_CONTRACT.md`
- `docs/contracts/MAPBOX_PLACE_ENRICHMENT.md`
- `docs/contracts/DATA_MODEL_CURRENT.md`
- `docs/ops/OPEN_LOOPS.md`
- `docs/ops/plans/CHECKLIST_EXECUTION_LINKING_SEARCH_V2.md`

### 1) Guardrail anti-desaparición (runtime)

- Regla `linked + unsaved` ahora solo aplica ocultamiento cuando `linked_place_id` está presente y no vacío.
- Si `link_status=linked` pero falta `linked_place_id`, el pin FLOWYA no se oculta.
- Esto reduce casos de desaparición visual por data parcial/inconsistente.

### 2) Contratos alineados a implementación real

- Se documentó explícitamente:
  - `uncertain` nunca se oculta automáticamente.
  - `linked` sin `linked_place_id` válido no se oculta.
  - `saved/visited` siempre mantienen pin FLOWYA.

### 3) Estado de ejecución actualizado

- `OPEN_LOOPS` y checklist operativo marcan Fase C como completada.
- Fase D queda enfocada en QA/no-go formal y evidencia de performance/tap->sheet.

## Matriz QA no-go (pendiente de ejecución manual final)

- Zonas densas: nombres repetidos + POIs cercanos.
- Zonas sin POI: confirmar fallback visual con pin FLOWYA.
- Zoom: alto/medio/bajo.
- Tema: light/dark.
- Regresión funcional: tap->sheet en linked/unlinked/uncertain.
- Criterio cuantitativo: `uncertain <= 15%` en muestra QA.

## Sanidad técnica

- `npm run lint` ✅
- `npm run build` ✅

