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

## 5) Dirección acordada — OL-PROFILE-001 (aún no reflejada en DB)

**Estado del contrato anterior:** sigue vigente la evidencia de §1–4 hasta que exista migración en Supabase.

**Decisión de producto/arquitectura (2026-04-12):** la fuente de verdad del perfil será una tabla **`public.profiles`** (`id` = `auth.users.id`), columnas mínimas V1: `display_name`, `avatar_url`, `created_at`, `updated_at`; **RLS owner-only** (perfil privado, sin superficie pública). Detalle: [`docs/ops/plans/PLAN_OL_PROFILE_001_ROBUST_USER_PROFILE_2026-03-28.md`](../ops/plans/PLAN_OL_PROFILE_001_ROBUST_USER_PROFILE_2026-03-28.md) § Decisiones cerradas.

**Migración en repo (aplicar en Supabase antes de dar por cerrado en DB):** [`supabase/migrations/026_profiles_private_owner_rls.sql`](../../supabase/migrations/026_profiles_private_owner_rls.sql) — tabla, RLS, trigger `handle_new_user_profile`, backfill desde `auth.users`.

Tras aplicar la migración en el proyecto remoto, actualizar este documento (o un `PROFILE_AUTH_CONTRACT_NEXT.md`) con introspección SQL y policies.

---

## Referencias

- `docs/definitions/contracts/DATA_MODEL_CURRENT.md`
- `docs/ops/governance/GUARDRAILS.md`
- `docs/ops/governance/DECISIONS.md`
- `docs/ops/plans/PLAN_OL_PROFILE_001_ROBUST_USER_PROFILE_2026-03-28.md`
