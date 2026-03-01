# Bitácora 235 (2026/03) — OL-P3-002 arranque operativo y scope Fase A

**Fecha:** 2026-03-01
**Loop:** `OL-P3-002` — Países interactivo + mapa mundial shareable

## Objetivo

Activar formalmente `OL-P3-002` y definir estrategia de ejecución por fases para reducir riesgo de regresión en Explore.

## Decisión operativa

- `OL-P3-002` se ejecuta en 3 fases:
  - `P3-002.A`: MVP de países interactivo (sin share).
  - `P3-002.B`: vista/mapa mundial de países.
  - `P3-002.C`: capa shareable del mapa mundial.

- Se prioriza `P3-002.A` como siguiente implementación para validar utilidad antes de ampliar superficie de UI.

## Alcance inicial (P3-002.A)

- Interacción desde contador de países hacia lista/vista por país.
- Sin introducir flujo de compartido en esta fase.
- Sin mezclar cambios de arquitectura mayor fuera de Explore.

## Riesgos y mitigación

- Riesgo: scope bundling (interactividad + mapa global + share en un solo PR).
  - Mitigación: un PR por fase, criterios de aceptación explícitos por milestone.

- Riesgo: regresión UX en overlays de mapa.
  - Mitigación: smoke manual guiado en filtros `all/saved/visited` y estados de sheet.

## Estado

- `OL-P3-002` queda **activo** en estado de arranque/scoping.
- Implementación pendiente: abrir rama técnica de `P3-002.A` con contrato y checklist QA.
