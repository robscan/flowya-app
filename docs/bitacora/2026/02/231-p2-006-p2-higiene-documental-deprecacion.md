# 231 — OL-P2-006 P2: higiene documental y deprecación

Fecha: 2026-02-28  
Tipo: avance documental / OL-P2-006 (P2)

## Alcance

Saneamiento de documentación activa para eliminar referencias obsoletas y alinear estado operativo real.

## Cambios aplicados

1. `docs/ops/governance/GUARDRAILS_DEPRECACION.md`
- Actualizada fecha de mantenimiento.
- Corrección de estado deprecated:
  - `Modal POI` marcado como eliminado con sustitución real a `SpotSheet` modo POI.
  - `/mapaV0` marcado como eliminado (bitácora `200`).
- Retiro de `onOpenDetail` del registro deprecated por seguir activo por contrato y runtime.
- Referencia de OPEN_LOOPS generalizada al loop vigente (sin `OL-DEPREC-001` stale).

2. `docs/ops/plans/PLAN_EXPLORE_V1_STRANGLER.md`
- Rutas de contratos corregidas a prefijo `docs/contracts/...`.

3. `core/shared/search/{state,intents,effects}.ts`
- Comentarios `Fuente:` alineados con rutas reales `docs/contracts/shared/...`.

4. `docs/ops/OPEN_LOOPS.md`
- Limpieza de duplicidad en referencias de bitácoras (`221`-`230`).

5. `docs/ops/templates/CURSOR_PROMPT_FOOTER.md`
- Referencias de contratos corregidas a rutas con prefijo `docs/`.

## Validación

- `eslint` en archivos técnicos tocados: OK.
- Auditoría de referencias activas sin `OL-DEPREC-001` ni rutas `contracts/shared/...` en documentos operativos principales.

## Resultado

- P2 documental/deprecación: **COMPLETADO**.
- Base documental activa alineada con estado real de runtime y loops.
