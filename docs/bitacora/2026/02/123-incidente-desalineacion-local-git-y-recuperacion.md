# Bitácora 123 — Incidente de desalineación local Git y recuperación segura

**Fecha:** 2026-02-25  
**Rama de trabajo:** `codex/search-poi-linking-phase-b`  
**Tipo:** Incidente operativo (flujo de ramas/índice local)

---

## Qué pasó

Durante el cambio entre ramas (`main`, `phase-a`, `phase-b`) y realineación con remoto, el estado local quedó inconsistente:

- `main` mostró cambios staged inesperados.
- aparecieron borrados locales de archivos que ya estaban mergeados en `origin/main`.
- se generaron locks huérfanos (`.git/index.lock`) en comandos posteriores.

El incidente fue detectado antes de continuar implementación, evitando pérdida silenciosa de trabajo.

---

## Causa probable

Secuencia local de operaciones de punteros/checkout/rebase/reset con índice no totalmente estabilizado, combinada con lock huérfano, provocó drift entre working tree e historial esperado.

---

## Acción correctiva aplicada

1. **Respaldo primero (no destructivo):**
   - Se creó rama de recuperación con commit del estado inconsistente:
   - `codex/wip-recovery-20260225-000742-index-drift`
   - Commit: `96c7fda`

2. **Recuperación segura del flujo activo:**
   - Se reancló la rama de trabajo sobre `origin/main`:
   - `codex/search-poi-linking-phase-b` -> `6fa0b56`
   - Estado limpio confirmado (`git status` sin cambios).

3. **Continuidad:**
   - El trabajo de Fase B continúa sobre base correcta, con respaldo disponible si se necesita auditoría.

---

## Lecciones / guardrails operativos

- Antes de rebase/reset entre ramas activas, confirmar:
  - `git fetch origin`
  - `git status` limpio
  - ausencia de `.git/index.lock`
- Si hay duda, crear primero rama de respaldo y recién luego limpiar punteros.
- No continuar implementación funcional mientras exista inconsistencia local de índice.

---

## Nota de rollback

Si se requiere inspeccionar o recuperar el estado inconsistente, usar:

- rama: `codex/wip-recovery-20260225-000742-index-drift`
- commit: `96c7fda`

