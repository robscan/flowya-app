# 191 — Ajuste roadmap: cámara con mini QA secuencial + Search Mapbox-first

**Fecha:** 2026-02-26  
**Rama:** `codex/next-search-map-iteration`

## Objetivo

Incorporar feedback de UX para reducir subjetividad y riesgo en Fase 2 antes de implementación.

## Cambios

- `docs/ops/analysis/JTBD.md`
  - Separación explícita entre JTBD de usuario y objetivos de sistema (S1..S4).

- `docs/ops/plans/PLAN_WOW_ROADMAP_3_FASES.md`
  - Se agrega glosario con definición de `smoke`.
  - Se refuerza principio `Mapbox-first` para Search.
  - Se establece que cámara/foco por intención se valida por mini QA secuencial.

- `docs/ops/OPEN_LOOPS.md`
  - `OL-WOW-F2-001` actualizado con criterio Mapbox-first.
  - Nuevo `OL-WOW-F2-005` para cámara/foco (`discover/inspect/act`) con aceptación UX 1x1.
  - Gate Fase 2 actualizado a `F2-001..005`.

## Resultado

- Se elimina ambigüedad sobre validación de cámara.
- Se protege alcance Search contra sobre-customización innecesaria.
