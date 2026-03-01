# 214 — Saneamiento ops + arranque seguro F3-001 (MS1)

Fecha: 2026-02-28  
Tipo: saneamiento operativo + ejecución controlada

## Contexto

Se detectaron contradicciones entre `OPEN_LOOPS` y `CURRENT_STATE` después de cierres de Fase 2 (bitácoras 209-213). Para proteger ejecución se aplica secuencia:
- P0 documental (alineación de fuentes de verdad).
- P1 técnico acotado (solo MS1 de F3-001).
- P2 preparación sin activación (F3-002/F3-003).

## Contradicciones detectadas

1. `OPEN_LOOPS` mantenía loops cerrados en alcance activo pese a regla de vaciar cierres.
2. `CURRENT_STATE` mezclaba snapshot vigente con bloques históricos no operativos.
3. F3-002/F3-003 figuraban activos sin bloqueo explícito por P0 único.

## Cambios aplicados

- `docs/ops/OPEN_LOOPS.md`
  - Reducción a loops activos.
  - Definición de `OL-WOW-F3-001` como P0 único.
  - Bloqueo explícito de `OL-WOW-F3-002` y `OL-WOW-F3-003` hasta cierre MS1.

- `docs/ops/CURRENT_STATE.md`
  - Snapshot operativo limpio al 2026-02-28.
  - Foco real P0->P2 y riesgos vigentes.

- `docs/ops/plans/PLAN_OL_WOW_F3_001_RUNTIME_MODULAR.md`
  - Plan decision-complete con MS1/MS2/MS3.
  - DoD, riesgos, rollback y smoke mínimo.
  - Lista documental de eventos para F3-003 (sin instrumentar runtime).

- `core/explore/runtime/*` (MS1 técnico)
  - `state.ts`: `ExploreRuntimeState` y estado inicial.
  - `intents.ts`: `ExploreIntent` runtime (`SET_PIN_FILTER`, `SET_SHEET_STATE`, `RESET`).
  - `reducer.ts`: `ExploreReducer` puro.
  - `invariants.ts`: `ExploreInvariantResult` + validación de `pinFilter/sheetState`.
  - `index.ts`: surface de exports internos.

- `components/explorar/MapScreenVNext.tsx`
  - Integración de `useReducer` con `exploreRuntimeReducer` para `pinFilter/sheetState`.
  - Wrappers compatibles para no romper handlers existentes.
  - Verificación de invariantes en desarrollo (`console.warn` si falla).

## Evidencia de alineación

- `OPEN_LOOPS` y `CURRENT_STATE` quedan consistentes en prioridad única y dependencias.
- Regla activa: no cerrar loops sin evidencia mínima (`bitácora + contrato + smoke`).

## Validación

- `eslint` dirigido sobre archivos tocados: sin errores; 1 warning preexistente en `MapScreenVNext` (`handleOpenCreateSpot` no usado).
- `tsc --noEmit`: falla por errores preexistentes del proyecto fuera del alcance de este ciclo; sin evidencia de error nuevo bloqueante asociado a los archivos de runtime creados.

## Regla operativa vigente

No se ejecuta trabajo paralelo que compita con P0 activo (`OL-WOW-F3-001` MS1).
