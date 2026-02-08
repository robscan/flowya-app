# OPEN_LOOPS — FLOWYA (source of truth)

**Última actualización:** 2026-02-07  
**Propósito:** Lista única de pendientes activos (bugs, decisiones abiertas, deuda técnica, faltantes de documentación) que bloquean o impactan UX/estabilidad.  
**Regla:** Si algo “vive en la mente”, aquí no existe. Todo loop debe estar aquí o cerrado en DECISIONS.

---

## Cómo usar este documento

- **Oscar (Negocio / Puente):** abre loops (problema + contexto + prioridad).
- **Arquitecto (ChatGPT):** define criterio, opción recomendada, y “next action” claro.
- **Cursor (Ejecución):** implementa y deja evidencia (PR/commit + notas), luego cambia el loop a **DONE**.

### Estados

- **OPEN** → identificado, falta decisión o ejecución
- **READY** → definido, listo para que Cursor ejecute
- **IN_PROGRESS** → Cursor ejecutando
- **BLOCKED** → esperando info o dependencia
- **DONE** → cerrado, referenciado en bitácora + (si aplica) DECISIONS

### Prioridades

- **P0** rompe core UX / bloquea release
- **P1** fricción alta o deuda peligrosa
- **P2** mejora, nice-to-have
- **P3** ideas futuras (evitar meter IA aquí si no hay intención real)

---

## 0) Estado actual de ejecución (snapshot rápido)

> Cursor debe actualizar esta sección **al final de cada sesión**.

- **Branch activo:** main
- **Último commit/PR:** main al día; OL-002 (Flow gates) y OL-003 (Recordar gates) cerrados; merge de gates-flow (gates-recordar ya estaba en main).
- **Scope actual:** Siguiente loop abierto (no hay OL OPEN; elegir nuevo o prep).
- **Target platform:** Web mobile (primero); prod Vercel desde main
- **Riesgos activos:**
  - Commits parciales sin regla pueden volver a desalinear prod.
  - OPEN_LOOPS desactualizado hace que pendientes vivan solo en memoria.
- **Próximo entregable (24h):** Escoger 1 siguiente loop (si existe OL-XXX OPEN) y ejecutar micro-scope docs-only o prep.

---

## 1) Loops activos (lista única)

### Loop OL-001 — Estado operativo vacío (proyecto no retomable sin memoria)

- **Estado:** DONE
- **Prioridad:** P0
- **Área:** Ops / Data (fuente de verdad)
- **Síntoma / problema (1–2 líneas):** No hay un único lugar que describa “en qué estamos” y “qué está abierto” sin depender de memoria o historial de chat. CURRENT_STATE y OPEN_LOOPS tenían placeholders.
- **Contexto (link a bitácora/PR):** docs/ops/CURRENT_STATE.md, docs/ops/OPEN_LOOPS.md; PR/sesión de restauración de retomabilidad.
- **Impacto UX/negocio:** Cualquier retomo requiere redescubrir estado; riesgo de duplicar trabajo o omitir dependencias.
- **Criterio de cierre (testable):** CURRENT_STATE.md “Ahora mismo” sin placeholders; OPEN_LOOPS.md con snapshot rápido lleno y ≥3 loops reales con prioridad + DoD + owner; ambos consistentes entre sí. Commit + push realizados.
- **Next action (Cursor):** Completar CURRENT_STATE y OPEN_LOOPS (este PR); commit + push. Cerrar loop a DONE con evidencia en bitácora o nota de PR.
- **Bloqueos / info faltante (Oscar):** Ninguno.
- **Owner:** Cursor
- **Fecha:** 2026-02-07

---

### Loop OL-002 — Gates para abrir Flow (no documentados)

- **Estado:** DONE
- **Prioridad:** P2
- **Área:** Ops / Proceso
- **Síntoma / problema (1–2 líneas):** No existen criterios documentados que indiquen cuándo está listo para abrir la herramienta/sesión “Flow”. Sin gates, se abre por inercia o no se abre.
- **Contexto (link a bitácora/PR):** Criterio registrado como loop; no se abre Flow en este PR.
- **Impacto UX/negocio:** Uso subóptimo de Flow (abrir cuando no toca o no abrir cuando sí).
- **Criterio de cierre (testable):** `docs/ops/GUARDRAILS.md` incluye Flow-lite + gates testables; `docs/ops/DECISIONS.md` registra DEC-005. Loop marcado DONE con evidencia.
- **Next action (Cursor):** N/A (cerrado).
- **Evidencia:** `docs/ops/GUARDRAILS.md` (Flow-lite + gates) + `docs/ops/DECISIONS.md` (DEC-005).
- **Bloqueos / info faltante (Oscar):** Ninguno.
- **Owner:** Arquitecto / Oscar (definición); Cursor (documentar cuando esté definido)
- **Fecha:** 2026-02-07

---

### Loop OL-003 — Gates para abrir Recordar (no documentados)

- **Estado:** DONE
- **Prioridad:** P2
- **Área:** Ops / Proceso
- **Síntoma / problema (1–2 líneas):** No existen criterios documentados que indiquen cuándo está listo para abrir la herramienta/sesión “Recordar”. Sin gates, igual que Flow.
- **Contexto (link a bitácora/PR):** Criterio registrado como loop; no se abre Recordar en este PR.
- **Impacto UX/negocio:** Uso subóptimo de Recordar.
- **Criterio de cierre (testable):** `docs/ops/GUARDRAILS.md` incluye sección “Recordar” con alcance permitido + gates (criterios) para abrir Recordar. `docs/ops/DECISIONS.md` registra decisión temporal “Recordar-lite = metadata en Spot”. Snapshot actualizado.
- **Next action (Cursor):** N/A (cerrado).
- **Evidencia:** `docs/ops/GUARDRAILS.md` (Recordar-lite + gates) + `docs/ops/DECISIONS.md` (DEC-004).
- **Bloqueos / info faltante (Oscar):** Ninguno (se define como docs-only gate; implementación queda fuera).
- **Owner:** Arquitecto / Oscar (definición); Cursor (documentar cuando esté definido)
- **Fecha:** 2026-02-07

---

### Loop OL-004 — SEARCH_V2.md desalineado con código (cambios locales no commiteados)

- **Estado:** DONE
- **Prioridad:** P2
- **Área:** Search / Data (docs)
- **Síntoma / problema (1–2 líneas):** `docs/definitions/search/SEARCH_V2.md` tenía modificaciones locales no subidas a main. Riesgo de que la doc de referencia no reflejara el comportamiento actual.
- **Contexto (link a bitácora/PR):** PR `chore/search-v2-doc-alignment` y PR `chore/ops-update-after-searchv2-docs` mergeados en main. SEARCH_V2.md alineado con código; .cursor/ en .gitignore según corresponda.
- **Impacto UX/negocio:** Quien lea SEARCH_V2 en repo puede tomar decisiones sobre datos correctos.
- **Criterio de cierre (testable):** Doc en main alineada con comportamiento de Search V2 actual. **Evidencia:** PRs mergeados (branch `chore/search-v2-doc-alignment` + `chore/ops-update-after-searchv2-docs`).
- **Next action (Cursor):** N/A (cerrado).
- **Bloqueos / info faltante (Oscar):** Ninguno.
- **Owner:** Cursor
- **Fecha:** 2026-02-07

---

### Loop OL-005 — Contratos y bitácoras ops sin track en PR/bitácora única

- **Estado:** DONE
- **Prioridad:** P2
- **Área:** Ops / Docs
- **Síntoma / problema (1–2 líneas):** Se generaron DATA_MODEL_CURRENT y PROFILE_AUTH_CONTRACT_CURRENT y bitácora 041 (prevención commits parciales); pueden no estar referenciados en PR_INDEX o bitácora INDEX, lo que dificulta descubrirlos.
- **Contexto (link a bitácora/PR):** `docs/definitions/contracts/INDEX.md` + `docs/bitacora/INDEX.md` (incluye 041).
- **Impacto UX/negocio:** Contratos y lecciones aprendidas menos descubribles.
- **Criterio de cierre (testable):** PR_INDEX o índice de bitácoras (si existe) incluye referencia a contratos y a 041; o se documenta en OPEN_LOOPS/DECISIONS que los contratos viven en definitions/contracts.
- **Next action (Cursor):** N/A (cerrado).
- **Bloqueos / info faltante (Oscar):** Ninguno.
- **Owner:** Cursor
- **Fecha:** 2026-02-07

### Loop OL-006 — Contratos "CURRENT" faltaban en repo (ahora placeholders)

- **Estado:** DONE
- **Prioridad:** P1
- **Área:** Ops / Contracts
- **Síntoma / problema (1–2 líneas):** `docs/definitions/contracts/INDEX.md` listaba contratos CURRENT sin archivos.
- **Contexto (link a bitácora/PR):** `docs/definitions/contracts/INDEX.md`
- **Impacto UX/negocio:** Sin contratos, el equipo no puede verificar supuestos; proyecto menos retomable.
- **Criterio de cierre (testable):** Existen los 2 archivos `DATA_MODEL_CURRENT.md` y `PROFILE_AUTH_CONTRACT_CURRENT.md` en `docs/definitions/contracts/`.
- **Next action:** (futuro) Completar contenido real desde Supabase/migraciones cuando toque.
- **Evidencia:** PR = #15
- **Owner:** Oscar
- **Fecha:** 2026-02-08

---

## 2) Template para agregar loops (copiar/pegar)

```md
### Loop OL-XXX — (título corto)

- **Estado:** OPEN
- **Prioridad:** P?
- **Área:**
- **Síntoma / problema:**
- **Contexto (bitácora/PR):**
- **Impacto UX/negocio:**
- **Criterio de cierre:**
- **Next action (Cursor):**
- **Bloqueos / info faltante (Oscar):**
- **Owner:**
- **Fecha:** 2026-02-07
```

---

## 3) Reglas de higiene (para que esto funcione)

1. **No hay “pendientes invisibles”.** Si se menciona en chat, se crea loop.
2. **Criterio de cierre obligatorio.** Sin criterio = no se ejecuta.
3. **Un loop = una cosa.** Si crece, se divide.
4. **DONE requiere evidencia:** PR/commit + bitácora (o nota en PR) + si cambió criterio, registrar en DECISIONS.
