# PROFILE_AUTH_CONTRACT_CURRENT

**Estado:** CURRENT (verificado por introspección SQL)
**Última verificación:** 2026-02-08
**Fuente de verdad:** `docs/definitions/contracts/PROFILE_AUTH_CONTRACT_CURRENT.md`

## Evidencia (SQL introspección — Supabase SQL Editor)

Se verificó:

1. **No hay tablas tipo `profiles/users/auth` en `public`** (por nombre):

- Query sobre `information_schema.tables` en schema `public` con `ilike '%profile%'|'%user%'|'%auth%'` → **0 rows**.

2. **Columnas de ownership (`user_id`) presentes**:

- `pins.user_id` (uuid, NOT NULL)
- `feedback.user_id` (uuid, NULL)

3. **RLS habilitado** (`public`):

- `spots` → `rls_enabled = true`
- `pins` → `rls_enabled = true`
- `feedback` → `rls_enabled = true`

> Nota: este contrato describe lo que la app **puede asumir como facts** con esta evidencia. Policies específicas y permisos por rol requieren evidencia adicional.

---

## 1) Identidad de usuario (CURRENT)

- La app usa `user_id` (uuid) como identificador de owner en `pins` (obligatorio) y opcional en `feedback`.
- No existe un “perfil” en `public` por nombre (no verificado que exista en otro schema).

**Implicación:** “Perfil” (si existe) no es una tabla pública obvia; puede vivir en otro schema o manejarse solo desde `auth.users` + metadata (no verificado aquí).

---

## 2) Ownership y alcance de datos (CURRENT)

### `pins`

- `user_id` es **NOT NULL** → cada pin pertenece a un usuario.
- `spot_id` enlaza a `spots.id` (FK ya verificada en DATA_MODEL_CURRENT).

### `feedback`

- `user_id` es **NULLABLE**:
  - permite feedback anónimo o desde usuario no autenticado (posible).
  - también incluye `user_email`, `user_agent`, `url`.

### `spots`

- No tiene `user_id` (según contrato de modelo de datos).
- Con RLS habilitado, su lectura/escritura depende de policies (no verificadas aquí).

---

## 3) Seguridad (CURRENT)

- RLS está habilitado en `spots`, `pins`, `feedback`.

**OPEN LOOP (evidencia requerida para cerrar):**

- Enumerar policies por tabla (SELECT/INSERT/UPDATE/DELETE) y sus condiciones.
- Confirmar si existe FK de `pins.user_id` o `feedback.user_id` hacia `auth.users(id)` (si es deseado).

---

## 4) Reglas operativas (asumibles vs no asumibles)

**Asumible hoy (con evidencia):**

- `pins` es siempre “user-owned”.
- tablas core están bajo RLS.

**No asumible aún (sin evidencia):**

- Que el usuario pueda leer `spots` sin login.
- Que `pins` sea privado por usuario (depende de policy).
- Que exista `profiles` y su estructura.

---

## Referencias

- `docs/definitions/contracts/DATA_MODEL_CURRENT.md`
- `docs/ops/GUARDRAILS.md`
- `docs/ops/DECISIONS.md`
