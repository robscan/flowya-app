# OPEN_LOOPS — Flowya (cola activa)

**Última actualización:** 2026-02-08

> **Backlog único de pendientes reales.**
> Aquí solo vive lo que está **abierto y bloquea o condiciona avance**.
>
> 🔒 **Regla:** lo que no esté aquí o en DECISIONS, **no existe**.

---

## Estados

- **OPEN** → identificado, pendiente
- **READY** → definido, listo para ejecutar
- **IN_PROGRESS** → ejecutándose
- **BLOCKED** → dependencia externa
- **DONE** → se elimina de este archivo (vive en CURRENT_STATE + evidencia)

---

## Snapshot operativo (al cierre)

- **Branch activo:** `main`
- **Scope activo:** cierre de loops de seguridad
- **Riesgos activos:** Data / Auth
- **Próximo entregable:** cerrar OL-008

---

## Loops activos

### Loop OL-007 — Supabase RLS demasiado permisivo

- **Estado:** OPEN
- **Prioridad:** P1
- **Área:** Data / Security
- **Problema (1–2 líneas):** Policies con `USING (true)` / `WITH CHECK (true)` permiten escritura/borrado sin restricción.
- **Impacto:** Riesgo de exposición o corrupción de datos en prod público.
- **Criterio de cierre (testable):**
  - Decisión explícita: qué tablas permiten SELECT público y cuáles requieren auth.
  - Reemplazar policies permisivas por policies mínimas.
  - Supabase linter sin warnings `always_true` en comandos de escritura.
- **Next action:** Definir reglas de acceso (producto) antes de implementar.
- **Owner:** Oscar
- **Fecha:** 2026-02-08

---

### Loop OL-008 — Supabase Auth sin leaked password protection

- **Estado:** OPEN
- **Prioridad:** P2
- **Área:** Auth / Security
- **Problema (1–2 líneas):** “Leaked password protection” deshabilitado en Supabase Auth.
- **Impacto:** Hardening pendiente innecesario.
- **Criterio de cierre (testable):**
  - Setting habilitado en Supabase.
  - Verificación login/signup.
  - Nota en DECISIONS si cambia UX de password.
- **Next action:** Habilitar setting y validar flujo.
- **Owner:** Oscar
- **Fecha:** 2026-02-08

---

## Regla de higiene

- Un loop = una cosa.
- Todo loop debe tener **criterio de cierre testable**.
- DONE **no vive aquí**: se elimina y se refleja en `CURRENT_STATE.md` + evidencia.
