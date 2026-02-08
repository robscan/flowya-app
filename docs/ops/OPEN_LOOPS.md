# OPEN_LOOPS — FLOWYA (source of truth)

**Última actualización:** 2026-02-08
**Propósito:** Lista única de pendientes activos (bugs, decisiones abiertas, deuda técnica, faltantes de documentación) que bloquean o impactan UX/estabilidad.
**Regla:** Si algo “vive en la mente”, aquí no existe. Todo loop debe estar aquí o cerrado en DECISIONS.

---

## Cómo usar este documento

- **Oscar (Negocio / Puente):** abre loops (problema + contexto + prioridad).
- **Arquitecto (ChatGPT):** define criterio, opción recomendada, y “next action” claro.
- **Cursor (Ejecución):** implementa y deja evidencia (PR/commit + notas), luego cambia el loop a **DONE**.

### Estados

- **OPEN** → identificado, falta decisión o ejecución
- **READY** → definido, listo para ejecutar
- **IN_PROGRESS** → ejecutando
- **BLOCKED** → esperando info o dependencia
- **DONE** → cerrado, referenciado en bitácora + (si aplica) DECISIONS

### Prioridades

- **P0** rompe core UX / bloquea release
- **P1** fricción alta o deuda peligrosa
- **P2** mejora, nice-to-have
- **P3** ideas futuras (evitar meter IA aquí si no hay intención real)

---

## 0) Estado actual de ejecución (snapshot rápido)

> Se actualiza **al final de cada sesión**.

- **Branch activo:** main
- **Último commit/PR:** main al día; contratos CURRENT verificados (introspección SQL); prompt opening actualizado; limpieza de ramas hecha.
- **Scope actual:** definir siguiente loop OPEN (si aplica) y ejecutar micro-scope.
- **Target platform:** Web mobile (primero); prod Vercel desde main
- **Riesgos activos:**
  - Pendientes de seguridad (RLS/Auth) pueden volverse deuda peligrosa si se ignoran demasiado.
  - Si OPEN_LOOPS se desactualiza, pendientes vuelven a “vivir en memoria”.

- **Próximo entregable (24h):** elegir 1 loop OPEN y convertirlo a READY con decisión clara (o cerrar si no aplica).

---

## 1) Loops (lista única)

### Loop OL-001 — Estado operativo vacío (proyecto no retomable sin memoria)

- **Estado:** DONE
- **Prioridad:** P0
- **Área:** Ops / Data (fuente de verdad)
- **Síntoma / problema (1–2 líneas):** No había un único lugar que describa “en qué estamos” y “qué está abierto” sin depender de memoria o historial de chat.
- **Contexto (link a bitácora/PR):** docs/ops/CURRENT_STATE.md, docs/ops/OPEN_LOOPS.md; PR de restauración de retomabilidad.
- **Impacto UX/negocio:** Retomar requiere redescubrir estado; riesgo de duplicar trabajo u omitir dependencias.
- **Criterio de cierre (testable):** CURRENT_STATE sin placeholders; OPEN_LOOPS con snapshot + loops; consistente y en main.
- **Next action:** N/A
- **Owner:** Cursor
- **Fecha:** 2026-02-07

---

### Loop OL-002 — Gates para abrir Flow (no documentados)

- **Estado:** DONE
- **Prioridad:** P2
- **Área:** Ops / Proceso
- **Síntoma / problema (1–2 líneas):** No existían criterios documentados para saber cuándo abrir “Flow”.
- **Contexto (link a bitácora/PR):** Documentado como gate, sin abrir Flow.
- **Impacto UX/negocio:** Uso subóptimo (abrir cuando no toca / no abrir cuando sí).
- **Criterio de cierre (testable):** GUARDRAILS incluye Flow-lite + gates; DECISIONS registra DEC-005.
- **Evidencia:** docs/ops/GUARDRAILS.md + docs/ops/DECISIONS.md
- **Next action:** N/A
- **Owner:** Arquitecto / Oscar (definición); Cursor (documentar)
- **Fecha:** 2026-02-07

---

### Loop OL-003 — Gates para abrir Recordar (no documentados)

- **Estado:** DONE
- **Prioridad:** P2
- **Área:** Ops / Proceso
- **Síntoma / problema (1–2 líneas):** No existían criterios documentados para saber cuándo abrir “Recordar”.
- **Contexto (link a bitácora/PR):** Documentado como gate, sin abrir Recordar.
- **Impacto UX/negocio:** Uso subóptimo.
- **Criterio de cierre (testable):** GUARDRAILS incluye Recordar-lite + gates; DECISIONS registra DEC-004.
- **Evidencia:** docs/ops/GUARDRAILS.md + docs/ops/DECISIONS.md
- **Next action:** N/A
- **Owner:** Arquitecto / Oscar (definición); Cursor (documentar)
- **Fecha:** 2026-02-07

---

### Loop OL-004 — SEARCH_V2.md desalineado con código (cambios locales no commiteados)

- **Estado:** DONE
- **Prioridad:** P2
- **Área:** Search / Data (docs)
- **Síntoma / problema (1–2 líneas):** SEARCH_V2 tenía cambios locales no subidos; doc podía no reflejar comportamiento real.
- **Contexto (link a bitácora/PR):** PRs `chore/search-v2-doc-alignment` + `chore/ops-update-after-searchv2-docs` mergeados.
- **Impacto UX/negocio:** Lectores toman decisiones incorrectas.
- **Criterio de cierre (testable):** Doc en main alineada al comportamiento actual.
- **Next action:** N/A
- **Owner:** Cursor
- **Fecha:** 2026-02-07

---

### Loop OL-005 — Contratos y bitácoras ops sin track en índice

- **Estado:** DONE
- **Prioridad:** P2
- **Área:** Ops / Docs
- **Síntoma / problema (1–2 líneas):** Contratos CURRENT y bitácora podían no ser descubribles (sin index).
- **Contexto (link a bitácora/PR):** contracts/INDEX + bitacora/INDEX actualizados.
- **Impacto UX/negocio:** Menos retomable.
- **Criterio de cierre (testable):** Índices referencian contratos y bitácoras relevantes.
- **Next action:** N/A
- **Owner:** Cursor
- **Fecha:** 2026-02-07

---

### Loop OL-006 — Contratos "CURRENT" faltaban en repo

- **Estado:** DONE
- **Prioridad:** P1
- **Área:** Ops / Contracts
- **Síntoma / problema (1–2 líneas):** INDEX listaba contratos CURRENT sin archivos.
- **Contexto (link a bitácora/PR):** docs/definitions/contracts/INDEX.md
- **Impacto UX/negocio:** Supuestos no verificables.
- **Criterio de cierre (testable):** Existen `DATA_MODEL_CURRENT.md` y `PROFILE_AUTH_CONTRACT_CURRENT.md` en repo.
- **Evidencia:** PR #15 / #17 (según histórico del repo)
- **Next action:** N/A
- **Owner:** Oscar
- **Fecha:** 2026-02-08

---

### Loop OL-007 — Supabase RLS demasiado permisivo (MVP inseguro por default)

- **Estado:** OPEN
- **Prioridad:** P1
- **Área:** Data / Security (Supabase)
- **Síntoma / problema (1–2 líneas):** Hay policies RLS con `USING (true)` / `WITH CHECK (true)` que permiten `INSERT/UPDATE/DELETE` sin restricción. También hay accesos anon en `pins/spots/storage`.
- **Evidencia:** Supabase Database Linter (WARN): `rls_policy_always_true` + `auth_allow_anonymous_sign_ins` (output pegado en chat 2026-02-08).
- **Impacto UX/negocio:** Riesgo de escritura/borrado no autorizado; rompe confianza y complica prod público.
- **Criterio de cierre (testable):**
  - Decisión explícita de roles permitidos (**anon** vs **authenticated**) por tabla y comando.
  - Reemplazar policies permisivas por policies mínimas (own rows / public read si aplica).
  - Linter sin WARN “always true” en comandos de escritura.

- **Next action (no hoy):**
  - **DECISIÓN**: qué queda público (SELECT) y qué requiere auth (INSERT/UPDATE/DELETE).
  - Luego: implementar policies + probar CRUD desde app.

- **Owner:** Oscar
- **Fecha:** 2026-02-08

---

### Loop OL-008 — Supabase Auth: “Leaked password protection” deshabilitado

- **Estado:** OPEN
- **Prioridad:** P2
- **Área:** Auth / Security
- **Síntoma / problema (1–2 líneas):** Protección contra contraseñas filtradas está apagada en Supabase Auth.
- **Evidencia:** Supabase Advisor (WARN) `auth_leaked_password_protection` (output pegado en chat 2026-02-08).
- **Impacto UX/negocio:** Riesgo innecesario; hardening pendiente.
- **Criterio de cierre (testable):**
  - Setting habilitado en Supabase Dashboard.
  - Nota en DECISIONS si cambia reglas UX de password.

- **Next action (Oscar):** Habilitar setting cuando estemos listos para endurecer Auth.
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
- **Next action:**
- **Bloqueos / info faltante:**
- **Owner:**
- **Fecha:** YYYY-MM-DD
```

---

## 3) Reglas de higiene

1. **No hay “pendientes invisibles”.** Si se menciona en chat, se crea loop.
2. **Criterio de cierre obligatorio.** Sin criterio = no se ejecuta.
3. **Un loop = una cosa.** Si crece, se divide.
4. **DONE requiere evidencia:** PR/commit + bitácora (o nota en PR) + si cambió criterio, registrar en DECISIONS.

**Última actualización:** 2026-02-08
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
- **Último commit/PR:** main al día; OL-002 (Flow gates) y OL-003 (Recordar gates) cerrados; merge de docs/contracts aplicado.
- **Scope actual:** Elegir el siguiente loop OPEN (si aplica) y preparar ejecución.
- **Target platform:** Web mobile (primero); prod Vercel desde main
- **Riesgos activos:**
  - Commits parciales sin regla pueden volver a desalinear prod.
  - OPEN_LOOPS desactualizado hace que pendientes vivan solo en memoria.

- **Próximo entregable (24h):** Escoger 1 siguiente loop (si existe OL-XXX OPEN) y ejecutarlo como micro-scope.

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
- **Next action (Cursor):** N/A (cerrado).
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
- **Contexto (link a bitácora/PR):** PR `chore/search-v2-doc-alignment` y PR `chore/ops-update-after-searchv2-docs` mergeados en main. SEARCH_V2.md alineado con código; `.cursor/` ignorado según corresponda.
- **Impacto UX/negocio:** Quien lea SEARCH_V2 en repo puede tomar decisiones sobre datos correctos.
- **Criterio de cierre (testable):** Doc en main alineada con comportamiento de Search V2 actual. Evidencia: PRs mergeados.
- **Next action (Cursor):** N/A (cerrado).
- **Bloqueos / info faltante (Oscar):** Ninguno.
- **Owner:** Cursor
- **Fecha:** 2026-02-07

---

### Loop OL-005 — Contratos y bitácoras ops sin track en PR/bitácora única

- **Estado:** DONE
- **Prioridad:** P2
- **Área:** Ops / Docs
- **Síntoma / problema (1–2 líneas):** Se generaron contratos (DATA_MODEL_CURRENT, PROFILE_AUTH_CONTRACT_CURRENT) y pueden no ser fácilmente descubribles sin índices.
- **Contexto (link a bitácora/PR):** `docs/definitions/contracts/INDEX.md` + `docs/bitacora/INDEX.md`.
- **Impacto UX/negocio:** Contratos y lecciones aprendidas menos descubribles.
- **Criterio de cierre (testable):** Existe índice que referencia contratos y bitácoras relevantes (o queda explícito dónde viven).
- **Next action (Cursor):** N/A (cerrado).
- **Bloqueos / info faltante (Oscar):** Ninguno.
- **Owner:** Cursor
- **Fecha:** 2026-02-07

---

### Loop OL-006 — Contratos "CURRENT" faltaban en repo (ahora verificados)

- **Estado:** DONE
- **Prioridad:** P1
- **Área:** Ops / Contracts
- **Síntoma / problema (1–2 líneas):** `docs/definitions/contracts/INDEX.md` listaba contratos CURRENT sin archivos.
- **Contexto (link a bitácora/PR):** `docs/definitions/contracts/INDEX.md`
- **Impacto UX/negocio:** Sin contratos, el equipo no puede verificar supuestos; proyecto menos retomable.
- **Criterio de cierre (testable):** Existen y están completos `DATA_MODEL_CURRENT.md` y `PROFILE_AUTH_CONTRACT_CURRENT.md` en `docs/definitions/contracts/` con evidencia.
- **Evidencia:** PR #15 / #17 (según historial del repo)
- **Owner:** Oscar
- **Fecha:** 2026-02-08

---

### Loop OL-007 — Supabase RLS demasiado permisivo (MVP inseguro por default)

- **Estado:** OPEN
- **Prioridad:** P1
- **Área:** Data / Security (Supabase)
- **Síntoma / problema (1–2 líneas):** Hay policies RLS con `USING (true)` / `WITH CHECK (true)` que permiten INSERT/UPDATE/DELETE sin restricción (y además accesos anon en pins/spots/storage).
- **Evidencia:** Supabase Database Linter (WARN): `rls_policy_always_true` + `auth_allow_anonymous_sign_ins` (output pegado en chat 2026-02-08).
- **Impacto UX/negocio:** Riesgo de escritura/borrado no autorizado; rompe confianza y complica pasar a prod público.
- **Criterio de cierre (testable):**
  - Definir roles permitidos (anon vs authenticated) por tabla y por comando.
  - Reemplazar policies permisivas por policies mínimas (own rows / public read si aplica).
  - Linter sin WARN de “always true” en comandos de escritura.

- **Next action (Arquitecto/Oscar):** No implementar hoy. Primero decidir: qué queda público (SELECT) y qué requiere auth (INSERT/UPDATE/DELETE). Luego ejecutar hardening + pruebas CRUD desde app.
- **Bloqueos / info faltante (Oscar):** Decisión de producto: lectura pública sí/no; escritura siempre auth; y si habrá admin role para borrar.
- **Owner:** Oscar
- **Fecha:** 2026-02-08

---

### Loop OL-008 — Supabase Auth: “Leaked password protection” deshabilitado

- **Estado:** OPEN
- **Prioridad:** P2
- **Área:** Auth / Security
- **Síntoma / problema (1–2 líneas):** “Leaked password protection” está deshabilitado en Supabase Auth.
- **Evidencia:** Supabase Advisor (WARN) `auth_leaked_password_protection` (output pegado en chat 2026-02-08).
- **Impacto UX/negocio:** Riesgo innecesario en cuentas; hardening pendiente.
- **Criterio de cierre (testable):** Setting habilitado + verificación en panel de Supabase + nota en DECISIONS si afecta UX (password rules).
- **Next action (Oscar):** Habilitar setting en Supabase Dashboard cuando estemos listos para endurecer Auth (y revisar si cambia requisitos de password).
- **Bloqueos / info faltante (Oscar):** Ninguno.
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
- **Fecha:** YYYY-MM-DD
```

---

## 3) Reglas de higiene (para que esto funcione)

1. **No hay “pendientes invisibles”.** Si se menciona en chat, se crea loop.
2. **Criterio de cierre obligatorio.** Sin criterio = no se ejecuta.
3. **Un loop = una cosa.** Si crece, se divide.
4. **DONE requiere evidencia:** PR/commit + bitácora (o nota en PR) + si cambió criterio, registrar en DECISIONS.
