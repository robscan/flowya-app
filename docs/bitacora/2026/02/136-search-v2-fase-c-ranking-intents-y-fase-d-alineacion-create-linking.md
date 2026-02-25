# Bitácora 136 — Search V2 Fase C (ranking intents) + Fase D parcial (create/linking)

**Fecha:** 2026-02-25  
**Rama:** `main`

---

## Objetivo

Cerrar pendientes operativos de Track B en Search V2:

- completar ranking taxonómico de intents en resultados externos,
- alinear create-from-search con linking existente sin duplicar ni introducir enlaces falsos.

## Cambios aplicados

Archivo principal:

- `components/explorar/MapScreenVNext.tsx`

### 1) Ranking taxonómico de intents (Fase C)

En sugerencias externas de Search:

- se incorporó clasificación por intent,
- orden aplicado: `poi_landmark > poi > place > address`,
- se mantiene estabilidad de orden entre resultados con misma prioridad.

Resultado:

- POIs/landmarks relevantes quedan por encima de place/address cuando coexisten.

### 2) Alineación create-from-search con linking (Fase D parcial)

En selección de sugerencia externa para create:

- `linked_place_kind` deja de forzarse siempre a `poi` y pasa a inferirse por intent (`landmark` cuando corresponde),
- `linked_place_id` solo se persiste cuando el ID externo es estable,
- guardrail agregado: IDs sintéticos de fallback (`place-*`) no se usan para linking persistente.

Resultado:

- menor riesgo de falsos positivos de enlace,
- create-from-search reutiliza el pipeline de create-from-POI sin bifurcar lógica.

## Documentación actualizada

- `docs/contracts/SEARCH_V2.md`
- `docs/definitions/search/SEARCH_V2.md`
- `docs/ops/plans/CHECKLIST_EXECUTION_LINKING_SEARCH_V2.md`
- `docs/ops/OPEN_LOOPS.md`

## Pendiente posterior

- Fase E de Track B: rollout/hardening con métricas y no-go formal.
