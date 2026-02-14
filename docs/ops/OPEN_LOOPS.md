# OPEN_LOOPS — Flowya (alcance activo)

**Fecha:** 2026-02-11

> Este archivo define el alcance diario del chat.
> El objetivo es **vaciar esta lista** para dar por cerrada la sesión.
> Los loops cerrados NO permanecen aquí (se registran en bitácora).

---

## Cerrados hoy (OL-056..061 + Create spot E2E)

- **OL-056** — Spot selection state machine: 1º tap MEDIUM, 2º tap mismo spot EXPANDED (no navegar); fix 3er spot invisible (SpotSheet reset solo sin-spot→con-spot). Contrato SPOT_SELECTION_SHEET_SIZING.md.
- **OL-057** — SearchResultCard abre SpotSheet en MEDIUM; confirmado, sin degradar a peek.
- **OL-058** — SpotSheet padding bottom / safe area en collapsed (no cortado).
- **OL-059** — Gap entre items “Vistos recientemente” (web + native).
- **OL-060** — No mostrar empty states cuando no hay recientes/resultados; secciones solo si tienen datos.
- **OL-061** — Contrato SPOT_SELECTION_SHEET_SIZING + docs. Ver bitácora 080.
- **Create spot E2E (map-first)** — Sin resultados → Crear spot nuevo aquí (auth gate) → placing → BORRADOR → Crear spot → sheet expanded → “Editar detalles” → Edit Spot. Insert sin `user_id` (spots no tiene esa columna). Ver bitácora 082.

---

## Loops activos

### OL-021 — Spot edit by section (mini-sheets)

**Estado:** Contrato listo (docs/contracts/SPOT_EDIT_MINI_SHEETS.md). Implementación pendiente.

- Patrón: SpotSheet principal + SubSheet modal (1 nivel max) por sección “Editar”.
- MVP secciones: (1) Detalles (tel/web), (2) Categoría + etiquetas.
- Guardrails: keyboard-safe, 1 nivel max, sin overlays frágiles.

---

### OL-050 — SpotSheet medium open “shrink/glitch”

**Estado:** Investigado/mitigado en ramas Explore Quality, pero requiere verificación final en iOS/Android (gestures + teclado + safe area).

- Síntoma: al abrir en estado “medium” hay un salto/shrink.
- Riesgo: regresión al tocar Search/Spot layering.

---

### OL-051 — SearchSheet: pill enter animation

**Estado:** Diseño/contrato pendiente (no definido en docs/contracts). **OPEN LOOP** de motion.

- Objetivo: animación de entrada de Search pill consistente (web + native) sin afectar performance.

---

### OL-052d — Search web rebuilt as overlay (no sheet)

**Estado:** Implementado (bitácoras 077–078). Falta consolidación: pruebas + cleanup + contract update si aplica.

- Web: Search overlay fijo (anclado a visualViewport) + scroll-lock.
- Native: sigue sheet.

---

### OL-053 — SearchSheet: drag-to-dismiss robustness vs scroll

**Estado:** Pendiente.

- Objetivo: evitar conflicto entre scroll de resultados vs gesto de dismiss.
- Guardrail: no romper “tap-outside”, no romper teclado.

---

### OL-054 — Layering contract (Search vs Spot)

**Estado:** Contrato pendiente (no existe doc/contracts específico). **OPEN LOOP**.

- Definir precedencia y estados cuando SpotSheet y Search conviven.
- Regla: 1 overlay/sheet dominante, sin duplicados.

---

### OL-055 — Deploy: Vercel “ready” pero no “current”

**Estado:** Observación en operación. Falta diagnóstico documentado. **OPEN LOOP**.

- Riesgo: creemos que main está deployado pero el tráfico sigue apuntando a un build anterior.
- Requiere: checklist de verificación + causas comunes (branch, preview/prod, caching, manual redeploy).

---

### Soft delete (is_hidden) — esquema y queries

**Estado:** No cerrado hoy. **OPEN LOOP** para mañana.

- El código filtra `is_hidden = false` en refetchSpots y otras queries; la pantalla de spot hace soft delete con `update({ is_hidden: true })`.
- La columna `is_hidden` **no** aparece en migraciones 001/002 (posible migración posterior o columna añadida fuera del repo).
- Pendiente: verificar esquema real en DB; alinear migraciones y políticas si hace falta; asegurar que listados/mapa/recientes no muestren spots borrados tras refetch. Sin tocar RLS/migraciones hoy.