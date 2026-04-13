# PLAN_OL_PROFILE_001_ROBUST_USER_PROFILE_2026-03-28

**Actualización 2026-04-12:** decisiones de modelo V1 cerradas — ver § [Decisiones cerradas](#decisiones-cerradas-2026-04-12).

## Objetivo

Construir un perfil de usuario realmente util para web, apoyado en la auth actual, sin depender todavía de social login.

## Contexto real del repo

- hoy no existe una tabla pública obvia de `profiles`
- existe auth por magic link
- existen piezas dispersas de cuenta:
  - chip/perfil en Explore
  - logout
  - traveler flows / países
  - filtros y actividad embebidos

Referencia:

- `docs/contracts/PROFILE_AUTH_CONTRACT_CURRENT.md`

## Alcance

- definir modelo canónico de perfil (**tabla `public.profiles`**; ver § Decisiones cerradas)
- persistir en DB:
  - `display_name`
  - `avatar_url`
  - timestamps de cuenta
- exponer una superficie web real de perfil/cuenta
- permitir edición de datos básicos
- integrar logout y estado de sesión de forma clara

## No alcance

- social login
- onboarding complejo
- perfiles públicos o social graph
- followers, sharing social, comunidad

## Principios

- usar la auth actual como foundation
- no esperar social login para tener cuenta usable
- mantener owner-only donde no haya necesidad pública
- evitar duplicar identidad entre `auth.users` y una tabla nueva sin contrato

## Decisiones cerradas (2026-04-12)

1. **Fuente de verdad:** tabla en **`public`** (nombre canónico: **`profiles`**), **`id uuid PRIMARY KEY REFERENCES auth.users(id)`** — no usar solo `user_metadata` como almacén principal (escalable, RLS por fila, evita duplicar identidad sin contrato).
2. **Mínimo V1 web (columnas):**
   - `id` — uuid, PK, igual a `auth.users.id`
   - `display_name` — texto (nullable al crear; la UI puede pedirlo o mostrar placeholder hasta completar)
   - `avatar_url` — texto nullable (URL a Storage u origen acordado)
   - `created_at`, `updated_at` — `timestamptz`
   - **No** `username` / handle único en V1 (evita unicidad, reservas y validación extra hasta que producto lo pida).
3. **Visibilidad:** perfil **privado** — solo el **owner** puede SELECT/INSERT/UPDATE su fila vía RLS; sin página pública de usuario, sin listado de perfiles, sin datos pensados como “públicos en internet”. Mostrar nombre de otro usuario en un recurso (p. ej. pin) es decisión de **otro** alcance; no forma parte del V1 de este plan.

## Alcance funcional recomendado

### PF-01 Foundation de datos

- migración: tabla `profiles` con el esquema mínimo anterior; RLS **owner-only**; trigger opcional `updated_at`
- garantizar `id` = usuario autenticado como único dueño de la fila
- políticas explícitas (p. ej. SELECT/UPDATE para `auth.uid() = id`; INSERT solo al registrarse o primera vez que accede — definir en implementación)

### PF-02 Superficie web de perfil

- pantalla o sheet de cuenta usable
- mostrar:
  - `display_name`
  - avatar
  - sesión actual
  - países/spots/flows cuando aplique

### PF-03 Edición básica

- editar `display_name`
- editar avatar (`avatar_url`)
- feedback claro de guardado/error

### PF-04 Estado de sesión y continuidad

- entry claro desde Explore
- logout
- copy coherente para usuario anónimo / registrado

## Archivos ancla del repo

- `docs/contracts/PROFILE_AUTH_CONTRACT_CURRENT.md`
- `contexts/auth-modal.tsx`
- `app/_layout.tsx`
- `components/explorar/MapScreenVNext.tsx`
- superficies actuales de perfil/logout en Explore

## Backlog técnico sugerido

- `BT-PROFILE-01` Actualizar contrato de perfil en docs (`PROFILE_AUTH_CONTRACT_*`) cuando exista evidencia en DB; alinear tipos/capa `lib/profile`.
- `BT-PROFILE-02` ~~Crear migración `profiles` + RLS owner-only~~ — **en repo:** `supabase/migrations/026_profiles_private_owner_rls.sql` (aplicar en Supabase).
- `BT-PROFILE-03` Crear capa de dominio `lib/profile/*`.
- `BT-PROFILE-04` Crear superficie web de perfil/cuenta.
- `BT-PROFILE-05` Integrar edición básica de nombre/avatar.
- `BT-PROFILE-06` QA de sesión, logout, estados vacíos y usuario sin completar perfil.

## Riesgos

1. Mezclar perfil con auth provider sin contrato claro.
- Mitigación: decidir una sola fuente de verdad.

2. Abrir perfil social antes de tiempo.
- Mitigación: mantenerlo privado/propio en V1.

3. Mover auth demasiado tarde y dejar cuenta inconsistente.
- Mitigación: este loop debe dejar usable la cuenta con magic link antes de social login.

## Criterio de cierre

Se considera cerrado cuando:

1. Existe una fuente de verdad de perfil.
2. El usuario puede ver y editar datos básicos de cuenta en web.
3. El perfil deja de ser solo un chip o punto de logout.
4. Auth social puede entrar después sin reabrir el dominio de perfil desde cero.

## Posición en roadmap

Debe ejecutarse antes del loop de `Auth` social login y antes de monetización.
