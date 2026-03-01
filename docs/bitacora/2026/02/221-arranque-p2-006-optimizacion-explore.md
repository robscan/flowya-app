# 221 — Arranque OL-P2-006 optimización Explore

Fecha: 2026-02-28  
Tipo: arranque operativo / OL-P2-006

## Contexto

Con Fase 3 (F3-001/002/003) cerrada en este ciclo, el foco se mueve a `OL-P2-006` para reducir riesgo estructural de Explore sin abrir features nuevas.

## Diagnóstico resumido

- `MapScreenVNext` mantiene alta concentración de lógica (~3054 líneas).
- `SpotSheet` concentra variantes y acciones (~1674 líneas).
- Riesgo principal: regresión por cambios cruzados en contenedor monolítico.

## Plan de ejecución activado

- P0: desacoplar orquestación crítica de `MapScreenVNext`.
- P1: segmentar `SpotSheet` por responsabilidades internas.
- P2: higiene documental y deprecación alineada al runtime actual.

## Referencias

- `docs/ops/plans/PLAN_OL_P2_006_OPTIMIZACION_EXPLORE_2026-02-28.md`
- `docs/ops/OPEN_LOOPS.md`
- `docs/contracts/explore/EXPLORE_STATE.md`

## Estado

- OL-P2-006: **ACTIVO** (P0 en preparación de implementación).
