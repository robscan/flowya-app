# Bitácora 062 (2026/02) — OL-037: Motion spec for ExploreSheet

**Rama:** `chore/explore-quality-2026-02-09`  
**Objetivo:** Especificación canónica de motion para sheets (duraciones, easing, snap, reduced motion, guardrails).

---

## Cambios

- **Creado docs/contracts/MOTION_SHEET.md:**
  - Principios: predecible, no bouncy random, consistente, respetar preferencias.
  - Duraciones: 280 ms (collapsed↔medium), 320 ms (medium↔expanded), 300 ms (programático).
  - Easing: ease-in-out / cubic-bezier(0.4, 0, 0.2, 1); equivalentes RN/CSS.
  - Drag snapping: threshold ≥25% o ~80px; regla por velocity para snap en dirección del gesto.
  - Reduced motion: duración 0 o mínima (80–100 ms).
  - Guardrails: preferir translateY sobre height; keyboard-safe; un solo driver por transición.

- **docs/contracts/EXPLORE_SHEET.md:** Añadido principio 7 con referencia a MOTION_SHEET.md como spec canónico de motion.

- **docs/contracts/INDEX.md:** Añadida entrada MOTION_SHEET.md al índice canónico.

- OPEN_LOOPS: OL-037 marcado DONE (docs-only).
