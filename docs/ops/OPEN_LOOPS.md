# OPEN_LOOPS — Flowya (alcance activo)

**Fecha:** 2026-02-08

> Este archivo define el alcance diario del chat.
> El objetivo es **vaciar esta lista** para dar por cerrada la sesión.
> Los loops cerrados NO permanecen aquí.

---

## Loop activo

### OL-009 — UX: Bloquear creación de spot sin autenticación

**Problema**

- Usuarios no autenticados pueden navegar todo el wizard de creación.
- Al finalizar, reciben un error técnico de RLS:
  `new row violates row-level security policy for table "spots"`.

**Objetivo UX**

- Si el usuario NO está autenticado:
  - NO debe avanzar al wizard.
  - Debe mostrarse el **mismo modal de login** que se usa al tocar el botón de perfil.
- Si el usuario está autenticado:
  - El flujo de creación funciona exactamente igual que hoy.

**Contexto técnico confirmado**

- RLS bloquea INSERT correctamente (seguridad OK).
- `spots.user_id` existe.
- El INSERT ya envía:
  `user_id: user?.id ?? null`
  (si no hay usuario, el insert falla por RLS; comportamiento esperado).

**Fuera de alcance**

- No crear modales nuevos.
- No cambiar RLS, SQL ni Supabase.
- No refactorizar arquitectura.
- No implementar paneles de admin o moderación.

**Criterio de cierre (DoD)**

- Usuario NO autenticado:
  - Al intentar crear spot → se abre modal de login.
  - El wizard NO se renderiza.
  - No aparece error técnico de RLS.
- Usuario autenticado:
  - Puede crear spot normalmente.
  - El spot se guarda con `user_id = auth.uid()`.

**Owner**

- Producto / UX

**Prioridad**

- Alta (impacta experiencia core).
