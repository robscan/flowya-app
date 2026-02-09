# CURRENT_STATE — Flowya (operativo)

> Fuente de verdad del estado actual del proyecto.
> Snapshot operativo + memoria resumida.
> No es backlog ni planeación.
>
> 🔒 Regla: ningún chat/sprint se considera cerrado si este archivo no se actualiza.

---

## Ahora mismo

- **Scope activo:** ninguno (baseline estable).
- **Branch activa:** `main`.
- **Estado del repo:** `main` protegido, limpio y sincronizado.
- **Entorno:** Web mobile (Explore público).

---

## Sólido

- Explore (map-first) es público y estable.
- RLS activo en `spots`.
- Policies vigentes:
  - **SELECT:** público (`is_hidden = false`)
  - **INSERT:** solo usuarios autenticados
  - **UPDATE:** solo usuarios autenticados
  - **DELETE físico:** deshabilitado
- Soft delete activo vía `is_hidden`.
- Trazabilidad de creación:
  - `spots.user_id` existe
  - Los INSERTs envían `user_id = auth.uid()` desde la app
- UX de creación protegida:
  - Usuarios no autenticados **no acceden** al wizard
  - Se reutiliza el modal de login existente
  - No aparecen errores técnicos de RLS en UI
- Sistema retomable sin memoria de chat.
- Reglas de cierre y ejecución formalizadas.
- Supabase Database Advisor muestra WARN por RLS permisivas; evaluadas y aceptadas como decisiones deliberadas de producto (ver DECISIONS.md). No representan riesgo inmediato.

---

## Frágil / Atención

- Ownership **no enforceado** en DB (decisión consciente).
- Soft delete **solo reversible desde Supabase** (no desde UI).
- No hay panel de moderación (fuera de alcance actual).

---

## Historial relevante (memoria resumida)

- **OL-007 — RLS en `spots` (DONE)**
  - Eliminada escritura anónima.
  - SELECT público mantiene Explore.
  - DELETE físico deshabilitado.

- **Trazabilidad de spots (DONE)**
  - `user_id` agregado y poblado.
  - INSERTs envían `user_id` desde la app.

- **OL-009 — UX Auth Gate en creación de spots (DONE)**
  - Bloqueo en entry points (search, mapa).
  - Bloqueo al montar `/create-spot`.
  - Reutilización del modal de login existente.
  - Eliminado error técnico de RLS en UX.

---

## Guardrails activos

- `main` protegido: NO direct commit / NO direct push.
- Todo cambio va por **rama + PR** (incluido docs-only).
- `OPEN_LOOPS.md` solo se entrega cuando define alcance diario.
- No abrir Flow ni Recordar completos sin decisión explícita.
- Seguridad primero; UX después, sin romper Explore.

---

## Next step sugerido (no obligatorio)

- UX copy: mensaje humano previo al login (“Inicia sesión para crear spots”).
- Definir heurísticas simples de spam (volumen por `user_id`).
- Continuar con flows / producto.
