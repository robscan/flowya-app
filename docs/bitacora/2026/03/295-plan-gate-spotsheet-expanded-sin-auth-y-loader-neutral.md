# 295 — Plan: gate SpotSheet expanded sin auth prematuro + loader neutral

Fecha: 2026-03-06  
Tipo: Plan operativo / saneamiento de activación

## Contexto QA

Se detectó fricción crítica en Explore: usuario sin sesión abre SpotSheet en `medium`, al pasar a `expanded` aparece auth aunque solo quiere consultar información.

Esto contradice el objetivo de activación sin fricción y bloquea descubrimiento temprano de valor.

## Decisiones tomadas

1. `medium -> expanded` se considera lectura y no debe disparar auth.
2. Auth se mantiene únicamente en mutaciones explícitas (`guardar`, `visitar`, `editar`, `crear`).
3. Copy de carga para este tramo: `Cargando información...`.
4. Se define gate operativo `OL-SPOTSHEET-EXPANDED-AUTH-GATE-001` antes de abrir nuevas features.

## Impacto esperado

- Menor fricción en onboarding sin cuenta.
- Mayor claridad del modelo de permisos (lectura libre, mutación autenticada).
- Reducción de abandono temprano por modal de auth prematuro.

## Evidencia documental

- Fuente operativa actualizada: `docs/ops/OPEN_LOOPS.md`
- Snapshot estratégico actualizado: `docs/ops/CURRENT_STATE.md`
- Plan detallado del gate: `docs/ops/plans/PLAN_OL_SPOTSHEET_EXPANDED_AUTH_GATE_001_2026-03-06.md`

## Validación mínima requerida para cierre

1. Usuario sin sesión puede abrir `expanded` sin auth modal.
2. Auth modal aparece solo en acciones mutantes.
3. Loader visible en transición con texto `Cargando información...`.
4. Sin regresión de snap/gestos del SpotSheet.

## Rollback documental

- Eliminar referencia del loop `OL-SPOTSHEET-EXPANDED-AUTH-GATE-001` en `OPEN_LOOPS` si se cancela.
- Actualizar `CURRENT_STATE` retirando el gate de activación.
- Registrar bitácora de rollback con motivo y fecha.
