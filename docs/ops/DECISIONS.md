# DECISIONS — FLOWYA (ADR-lite)
**Última actualización:** 2026-02-07  
**Propósito:** Registro de decisiones cerradas para no reabrir debates, mantener coherencia UX, y acelerar ejecución.

---

## Cómo usar este documento
- Cada decisión tiene un **ID** y un **resultado**.
- Si una decisión cambia, se agrega una nueva entrada que la **supersede** (no se edita la historia).

### Formato (ADR-lite)
- **Contexto**
- **Opciones consideradas**
- **Decisión**
- **Racional**
- **Consecuencias / tradeoffs**
- **Evidencia** (bitácora/PR)

---

## DEC-001 — Auth mínima con Magic Link + “no barrera de entrada”
- **Fecha:** 2026-01-?? (ver bitácora 017)
- **Contexto:** Spots/pins deben persistir por usuario, pero Flowya debe ser usable sin cuenta.
- **Opciones:** (A) Login obligatorio al inicio, (B) Guest primero + login al guardar, (C) Social login.
- **Decisión:** Usar **Magic Link** y solicitar cuenta **solo cuando el usuario intenta guardar su primer pin**.  
- **Racional:** Minimiza fricción inicial y habilita ownership para persistencia.  
- **Consecuencias:** Hay que manejar bien estados “sin sesión” y mensajes del modal según contexto.
- **Evidencia:** bitácora `2026/01/017-scope-i-auth.md` y `2026/01/019-modal-auth-variantes.md`.

---

## DEC-002 — Modal de auth con variantes por contexto (savePin vs profile)
- **Fecha:** 2026-01-?? (ver bitácora 019)
- **Contexto:** El usuario abre auth por razones distintas (guardar vs entrar a cuenta).
- **Opciones:** (A) Un solo copy, (B) Copy por contexto centralizado.
- **Decisión:** Centralizar `AUTH_MODAL_MESSAGES` con variantes mínimas.
- **Racional:** Reduce confusión y mantiene consistencia.
- **Consecuencias:** Consumidores deben pasar el mensaje correcto.
- **Evidencia:** bitácora `2026/01/019-modal-auth-variantes.md`.

---

## DEC-003 — Confirm modal propio (logout) alineado a visual FLOWYA
- **Fecha:** 2026-01-?? (ver bitácora 020)
- **Contexto:** `window.confirm`/alerts rompen estética y control.
- **Decisión:** Usar `ConfirmModal` propio.
- **Evidencia:** bitácora `2026/01/020-confirm-modal-logout.md`.

---

## Template para nuevas decisiones (copiar/pegar)
```md
## DEC-XXX — (título corto)
- **Fecha:** YYYY-MM-DD
- **Contexto:**
- **Opciones consideradas:**
- **Decisión:**
- **Racional:**
- **Consecuencias / tradeoffs:**
- **Evidencia (bitácora/PR):**
```
