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

---

## DEC-004 — Recordar-lite vive como metadata en Spot (por ahora)
- **Fecha:** 2026-02-07
- **Contexto:** Queremos capturar memoria (visited, fecha, nota corta) sin abrir un “diario” completo que rompa map-first o dispare scope creep.
- **Opciones consideradas:** (A) Entidad separada `memories/entries` con timeline, (B) Metadata mínima dentro de `spots`, (C) Guardar todo como texto libre sin estructura.
- **Decisión:** Implementar (cuando toque) **Recordar-lite** como **metadata dentro de Spot**: `visited`, `visited_at` y `note_short` (limitada). Recordar “completo” permanece cerrado hasta cumplir gates.
- **Racional:** Minimiza fricción y complejidad; mantiene Explore como núcleo; permite señales de valor sin abrir un producto paralelo.
- **Consecuencias / tradeoffs:** No hay timeline/álbum por ahora; si en el futuro se requiere entidad separada, se migrará con decisión nueva que la superseda.
- **Evidencia (bitácora/PR):** OL-003 (gates Recordar) + PR `chore/gates-recordar`.

---

## DEC-005 — Flow-lite antes de abrir Flow (Draft simple, no tour IA)
- **Fecha:** 2026-02-07
- **Contexto:** Queremos valor temprano de “organizar spots” sin abrir Flow completo (pantallas nuevas, planner multi-paso, IA).
- **Opciones consideradas:** (A) Abrir Flow completo ya, (B) Flow-lite dentro de Explore (draft simple), (C) Posponer cualquier Flow hasta V2.
- **Decisión:** Adoptar (B) **Flow-lite** como capacidad mínima dentro de Explore: listas/drafts simples que agrupan spots (orden opcional), sin IA y sin pantallas nuevas. Flow completo permanece cerrado hasta gates.
- **Racional:** Mantiene map-first, reduce scope creep, permite probar valor real antes de invertir en un producto paralelo.
- **Consecuencias / tradeoffs:** No hay itinerarios automáticos ni planner; si se abre Flow completo, se hará con decisión nueva que superseda.
- **Evidencia (bitácora/PR):** OL-002 (gates Flow) + PR `chore/gates-flow`.

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
