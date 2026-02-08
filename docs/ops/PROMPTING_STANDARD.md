# PROMPTING_STANDARD — FLOWYA

> Estándar obligatorio para prompts a Cursor.
> Garantiza estabilidad, trazabilidad y cierre operativo.

---

## Regla de oro

Si no está en:

- `docs/ops/CURRENT_STATE.md`
- `docs/ops/OPEN_LOOPS.md`

**no existe.**

---

## Principios (NO negociables)

1. **1 PR = 1 micro-scope.**
2. Map-first (Apple Maps vibe).
3. No abrir Flow ni Recordar salvo que GUARDRAILS lo permita.
4. Nada de reproches.
5. Todo PR debe dejar el proyecto **retomable mañana**.

6) **`main` está protegido (NO direct push).**  
   Todo cambio —incluidos docs-only— debe hacerse vía **rama + PR**.
   No se permiten commits ni pushes directos a `main`.

---

## Cierre operativo (MANDATORY)

Todo prompt a Cursor **DEBE** terminar pegando **verbatim** el footer:

`docs/ops/templates/CURSOR_PROMPT_FOOTER.md`

Cursor es responsable de:

- actualizar CURRENT_STATE,
- actualizar OPEN_LOOPS,
- dejar evidencia.

No duplicar reglas aquí ni en el prompt.

---

## Formato de prompt

(A) Objective  
(B) Constraints  
(C) Steps  
(D) Acceptance Criteria  
(E) Closeout (MANDATORY)

Sin excepción.
