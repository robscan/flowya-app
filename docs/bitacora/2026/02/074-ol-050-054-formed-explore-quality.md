# 074 — OL-050..054 formados (Explore quality hardening)

**Fecha:** 2026-02-09  
**Rama:** chore/explore-quality-2026-02-09  
**Alcance:** Docs only (sin código)

## Contexto
Hoy decidimos **no ejecutar** OL-021 (mini-sheets) ni OL-023 (categorías internas), porque aún no estamos listos y queremos pensarlo mejor.
En su lugar, formamos una serie de loops de “hardening” para Explore (interacciones, motion y keyboard-safe).

## Loops formados
- **OL-050 — SpotSheet medium shrink/glitch:** evitar que el sheet abra grande y “encoga” al medir contenido; entrada desde abajo sin relayout visible.
- **OL-051 — Search pill enter animation:** animación de entrada del pill (al cargar / y al cerrar Search).
- **OL-052 — SearchSheet keyboard-safe (mobile):** input + lista visibles con teclado, sin empalme.
- **OL-053 — SearchSheet drag-to-dismiss vs scroll:** drag solo en handle/header; scroll de lista sin conflicto; thresholds/velocity según MOTION_SHEET.
- **OL-054 — Layering contract (Search vs Spot):** Search abierto no debe tener capas que bloqueen taps; SpotSheet unmount/pointerEvents según estado.

## Guardrails
- Solo docs hoy.
- Sin inventar UI fuera de contratos existentes.
