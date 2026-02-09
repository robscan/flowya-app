# PROMPTING_STANDARD — FLOWYA

> Estándar obligatorio para prompts dirigidos a Cursor.  
> Garantiza estabilidad, trazabilidad y cierre operativo.

---

## Regla de oro

Si no está en:

- `docs/ops/CURRENT_STATE.md`
- `docs/ops/OPEN_LOOPS.md`

**no existe.**

---

## Principios (NO negociables)

1. **1 PR = 1 micro-scope**
2. Map-first (Apple Maps vibe)
3. No abrir Flow ni Recordar salvo que `GUARDRAILS.md` lo permita
4. Nada de reproches
5. Todo PR debe dejar el proyecto **retomable mañana**

6. **`main` está protegido**
   - NO commits directos
   - NO push directo
   - TODO cambio (incluido docs-only) va por **rama + PR**

---

## Disciplina de estado (MANDATORY)

Cuando un prompt implique cambios en estado operativo:

- **CURRENT_STATE.md**
  - Debe actualizarse con **archivo completo final**
- **OPEN_LOOPS.md**
  - Debe actualizarse con **archivo completo final**
  - SOLO loops activos

Nunca entregar bloques sueltos ni instrucciones parciales.

---

## Cierre operativo (MANDATORY)

Todo prompt a Cursor **DEBE** terminar pegando **verbatim**:
