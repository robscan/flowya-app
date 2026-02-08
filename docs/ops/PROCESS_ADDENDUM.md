
---

## Addendum — Ops Batch PR (ahorro de tiempo, sin perder control)

**Problema:** El repo exige PR para cambios a main; hacer 1 PR por micro-scope consume demasiado tiempo en Ops.

**Regla (solo para docs/ops):**
- Trabajar en **1 PR por sesión de Ops (30–60 min)**.
- Dentro de ese PR, cada “micro-scope” se ejecuta como **1 commit** (no como PR separado).
- El PR se titula: `chore(ops): ops batch — <tema>`
- Cada commit debe ser pequeño y tener mensaje claro (ej: `chore(ops): add OL-006`, `chore(ops): close OL-006`).

**Guardrails:**
- Aplica **solo** a cambios en `docs/ops/*`.
- Si el cambio toca **código de app** o `docs/definitions/*` (contratos), vuelve a **1 PR por micro-scope**.
- El PR batch debe incluir en el último commit el cierre de estado: `CURRENT_STATE.md` + `OPEN_LOOPS.md` (snapshot + evidencias).

