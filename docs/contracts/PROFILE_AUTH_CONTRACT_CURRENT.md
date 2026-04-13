# PROFILE_AUTH_CONTRACT_CURRENT

**Estado:** CURRENT  
**Última verificación:** 2026-04-12 (esquema remoto + políticas Storage; ver bitácora `[354](../bitacora/2026/04/354-ol-profile-001-cierre-web-paridad-nativa-diferida.md)`)  
**Fuente de verdad:** este archivo + migraciones en `supabase/migrations/`.

---

## 1) Tabla `public.profiles`

- **PK:** `id uuid` = `auth.users.id` (FK `ON DELETE CASCADE`).
- **Columnas (estado remoto validado):**


| Columna               | Tipo        | Notas                                                                                                                                  |
| --------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                  | uuid        | Igual que `auth.users.id`                                                                                                              |
| `display_name`        | text        | Nullable; editable por el usuario (web)                                                                                                |
| `email`               | text        | Nullable; copia de `auth.users.email`, sincronizada por triggers (migración **028**)                                                   |
| `avatar_storage_path` | text        | Nullable; clave en bucket `profile-avatars` (p. ej. `{user_id}/avatar.jpg`) — **027**                                                  |
| `last_activity_at`    | timestamptz | Nullable; marca de uso de app (**029**). **No** forma parte de la UI de cuenta; se persiste para análisis vía DB (**OL-METRICS-001**). |
| `created_at`          | timestamptz | Default `now()`                                                                                                                        |
| `updated_at`          | timestamptz | Trigger `profiles_set_updated_at`                                                                                                      |


- **No se usa** columna libre `avatar_url` (texto); fue sustituida por **Storage + `avatar_storage_path`** (**027**).
- **RLS:** owner-only — solo el usuario autenticado puede SELECT/INSERT/UPDATE su fila (`auth.uid() = id`). Sin listado público de perfiles.
- **Migraciones de referencia:** `026_profiles_private_owner_rls.sql`, `027_profile_avatar_storage.sql`, `028_profiles_email_sync.sql`, `029_profiles_last_activity_at.sql`.

---

## 2) Storage — avatares de perfil

- **Bucket:** `profile-avatars` (público para lectura; escritura solo objetos `{auth.uid()}/avatar.jpg`).
- **Políticas:** alineadas con migración **027** (SELECT público al bucket; INSERT/UPDATE/DELETE del dueño).

---

## 3) Capa de aplicación

- `**lib/profile`:** `fetchMyProfile`, `updateMyProfile` (display_name, avatar_storage_path), `touchMyProfileLastActivity` (actualiza `last_activity_at` sin mostrarlo al usuario), tipos `ProfileRow`.
- `**lib/profile-avatar-upload`:** subida/eliminación y URL pública.
- **Web — cuenta:** `app/account/index.web.tsx`, ruta `/account`; header oculto en stack; desktop: panel lateral + mapa visible (modal transparente).
- **Nativo — cuenta:** `app/account/index.tsx` permanece **stub** hasta OL de paridad; alcance explícitamente **web-first** en OL-PROFILE-001.

---

## 4) Identidad en el resto del modelo

- `pins.user_id`, `feedback.user_id` siguen como en `DATA_MODEL_CURRENT`.
- Mostrar nombre de **otro** usuario en un recurso público no forma parte de este contrato (perfil privado).

---

## 5) Histórico (pre-2026-04)

La introspección de **2026-02-08** no encontraba tabla `profiles` en `public`. Eso quedó **obsoleto** tras aplicar migraciones **026+** en el proyecto. No borrar este párrafo: traza el cierre del gap documental.

---

## Referencias

- `[PLAN_OL_PROFILE_001_ROBUST_USER_PROFILE_2026-03-28.md](../ops/plans/PLAN_OL_PROFILE_001_ROBUST_USER_PROFILE_2026-03-28.md)`
- `[OPEN_LOOPS.md](../ops/OPEN_LOOPS.md)`
- `[DATA_MODEL_CURRENT.md](DATA_MODEL_CURRENT.md)`