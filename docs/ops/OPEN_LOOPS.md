# OPEN_LOOPS — Flowya (alcance activo)

**Fecha:** 2026-02-26 (higiene final de foco operativo)

> Este archivo define el alcance diario del chat.
> El objetivo es **vaciar esta lista** para dar por cerrada la sesión.
> Los loops cerrados no deben permanecer aquí (ver bitácoras).

---

## Foco inmediato (P2/P3 activos)

### OL-P2-001 — Filtros “Todos / Guardados / Visitados” en buscador (layout)

**Estado:** ACTIVO

**DoD / AC**
- Primera línea: filtros + cerrar buscador.
- Segunda línea: input de búsqueda ancho completo.
- No introducir Radix/shadcn (Gate C pausado): usar componentes existentes.

**Pruebas mínimas**
- Smoke: cambiar filtro afecta resultados/pins según contrato Search/Explore.

---

### OL-P2-002 — En buscador: teclado desaparece al hacer scroll o interactuar

**Estado:** ACTIVO

**DoD / AC**
- Scroll/tap fuera del input cierra teclado (sin cerrar Search).
- No rompe overlay/sheet ni causa jumps.

**Pruebas mínimas**
- Smoke: abrir search + teclado → scroll results → teclado se oculta.

---

### OL-P2-003 — Color de pines cuando filtro “Guardados” está activo

**Estado:** ACTIVO

**Problema**
- Con filtro Guardados, pines visitados conservan color de visitados y confunden.

**DoD / AC**
- Si filtro = Guardados: todos los pines visibles usan color Guardados.
- Si filtro = Visitados: todos los pines visibles usan color Visitados.
- Si filtro = Todos: color por estado real.

**Pruebas mínimas**
- Smoke: alternar filtros y validar consistencia visual.

---

### OL-P2-004 — KEYBOARD_AND_TEXT_INPUTS Fase 9 (autoFocus) pendiente de verificación

**Estado:** ACTIVO

**DoD / AC**
- Verificar y documentar autoFocus en flows acordados (web/native) sin romper keyboard-safe.
- Actualizar plan/bitácora con resultado.

**Pruebas mínimas**
- Smoke: foco inicial correcto en flujos acordados.
- Smoke: sin regresiones en CTA sticky y dismiss keyboard.

**Referencia**
- `docs/ops/plans/PLAN_KEYBOARD_CTA_CONTRACT.md`

---

### OL-P2-005 — Inventario DS canónico de Explore no cerrado

**Estado:** ACTIVO

**DoD / AC**
- Definir inventario mínimo canónico (componentes + variantes permitidas).
- Publicar fuente de verdad y referenciarla desde contratos.

**Pruebas mínimas**
- Checklist de componentes en uso vs inventario definido.

**Referencia**
- `docs/contracts/DESIGN_SYSTEM_USAGE.md`

---

### OL-P2-006 — Optimización integral de pantalla Explorar (análisis + reestructura)

**Estado:** ACTIVO (solo definición de actividad; no ejecutar implementación aún)

**Entregable esperado**
- Diagnóstico por áreas (estado actual, deuda, riesgos, impacto).
- Recomendaciones priorizadas (P0/P1/P2).
- Matriz de deprecación.
- Matriz DS.
- Plan de ejecución en micro-scopes.

**Referencias base**
- `docs/ops/CURRENT_STATE.md`
- `docs/ops/governance/GUARDRAILS_DEPRECACION.md`
- `docs/ops/plans/PLAN_EXPLORE_V1_STRANGLER.md`
- `docs/contracts/explore/EXPLORE_STATE.md`
- `docs/contracts/explore/EXPLORE_INTENTS.md`
- `docs/contracts/explore/EXPLORE_EFFECTS.md`

---

### OL-P3-001 — Web sheets `max-width: 720px` + alineación derecha (postergado)

**Estado:** ACTIVO (prioridad baja; no ejecutar ahora)

**DoD / AC (cuando se retome)**
- Sheets web con `max-width: 720px`.
- Alineación derecha con gutter consistente.
- Sin regresión en backdrop/interacción mapa/breakpoints.

---

## Postergados estratégicos (no ejecutar ahora)

### OL-P0-002 — Create Spot canónico
**Estado:** ACTIVO (POSTERGADO)

### OL-P1-003 — System Status Bar
**Estado:** ACTIVO (POSTERGADO)

### OL-P1-006 — Migración POI DB (maki/categorías)
**Estado:** ACTIVO (POSTERGADO)

### OL-P1-007 — Pipeline turístico sin Google
**Estado:** ACTIVO (POSTERGADO)

---

## Cierres recientes (trazabilidad)

- `OL-P0-004`, `OL-P1-004`, `OL-P1-008`, `OL-P1-009`, `OL-P1-010`, `OL-P1-011`, `OL-P1-012`, `OL-P1-002`: ver bitácoras 143–180 y cierres de sesión 2026-02-26.
