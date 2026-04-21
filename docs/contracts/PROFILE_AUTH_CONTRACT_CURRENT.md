# PROFILE_AUTH_CONTRACT_CURRENT

**Estado:** CURRENT  
**Última verificación:** 2026-04-19 (app `/account` + `MapScreenVNext` + panel embebido desktop + esquema remoto + políticas Storage; ver bitácoras `[354](../bitacora/2026/04/354-ol-profile-001-cierre-web-paridad-nativa-diferida.md)`, `[356](../bitacora/2026/04/356-last-activity-no-ui-cuenta-ol-metrics-001-2026-04.md)` y `[372](../bitacora/2026/04/372-ol-profile-web-desktop-sidebar-embedded-a11y-share.md)`)  
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
| `share_photos_with_world` | boolean   | Nullable; preferencia: `null`=sin definir (mostrar modal), `true`=fotos públicas, `false`=fotos privadas — **030**                       |
| `last_activity_at`    | timestamptz | Nullable; marca de uso de app (**029**). **No** forma parte de la UI de cuenta; se persiste para análisis vía DB (**OL-METRICS-001**). |
| `created_at`          | timestamptz | Default `now()`                                                                                                                        |
| `updated_at`          | timestamptz | Trigger `profiles_set_updated_at`                                                                                                      |


- **No se usa** columna libre `avatar_url` (texto); fue sustituida por **Storage + `avatar_storage_path`** (**027**).
- **RLS:** owner-only — solo el usuario autenticado puede SELECT/INSERT/UPDATE su fila (`auth.uid() = id`). Sin listado público de perfiles.
- **Migraciones de referencia:** `026_profiles_private_owner_rls.sql`, `027_profile_avatar_storage.sql`, `028_profiles_email_sync.sql`, `029_profiles_last_activity_at.sql`, `030_profiles_photo_sharing_pref.sql`.

---

## 2) Storage — avatares de perfil

- **Bucket:** `profile-avatars` (público para lectura; escritura solo objetos `{auth.uid()}/avatar.jpg`).
- **Políticas:** alineadas con migración **027** (SELECT público al bucket; INSERT/UPDATE/DELETE del dueño).

---

## 3) Capa de aplicación

- **`lib/profile`:**
  - `fetchMyProfile` (lectura owner-only; sin sesión retorna `data: null` sin error).
  - `updateMyProfile` (solo `display_name`, `avatar_storage_path`).
  - `touchMyProfileLastActivity` (actualiza `last_activity_at` sin mostrarlo al usuario).
  - Tipo canónico `ProfileRow`.
- **`lib/profile-avatar-upload`:**
  - `pickProfileImageBlob` (web: `input[type=file]`; nativo: galería + recorte 1:1).
  - `uploadMyProfileAvatar` (optimiza imagen y escribe en `profile-avatars/{user_id}/avatar.jpg`, `upsert: true`).
  - `deleteMyProfileAvatarObject`, `getProfileAvatarPublicUrl`.
- **Web — cuenta:** `app/account/*.web.tsx` en el stack (móvil o ventana estrecha, ancho menor al umbral Explore sidebar). En stack, **flecha atrás** en una subpantalla vuelve al home de perfil (`/account`); el **botón cerrar (X)** en subpantalla sale del flujo de perfil por completo (`replace('/')` → Explorar). **Explore desktop (ancho mínimo sidebar, ver `WEB_EXPLORE_SIDEBAR_MIN_WIDTH`):** las rutas `/account*` hacen `<Redirect>` a `/?account=profile|details|privacy|language`; el UI se monta en **`AccountExploreDesktopPanel`** dentro de **`ExploreDesktopSidebarAnimatedColumn`** (misma columna que welcome/países/spot). `AccountShell` usa `layout="embedded"` ahí; no hay modal full-screen del stack encima del mapa.
- **Nativo — cuenta:** `app/account/index.tsx` permanece **stub** hasta OL de paridad; alcance explícitamente **web-first** en OL-PROFILE-001.

---

## 4) Identidad en el resto del modelo

- `pins.user_id`, `feedback.user_id` siguen como en `DATA_MODEL_CURRENT`.
- Mostrar nombre de **otro** usuario en un recurso público no forma parte de este contrato (perfil privado).

---

## 5) Histórico (pre-2026-04)

La introspección de **2026-02-08** no encontraba tabla `profiles` en `public`. Eso quedó **obsoleto** tras aplicar migraciones **026+** en el proyecto. No borrar este párrafo: traza el cierre del gap documental.

---

## 6) Interfaces públicas (TypeScript)

```ts
// lib/profile
fetchMyProfile(): Promise<{ data: ProfileRow | null; error: Error | null }>
updateMyProfile(patch: {
  display_name?: string | null
  avatar_storage_path?: string | null
}): Promise<{ data: ProfileRow | null; error: Error | null }>
touchMyProfileLastActivity(options?: { bypassThrottle?: boolean }): Promise<{ ok: boolean }>

// lib/profile-avatar-upload
pickProfileImageBlob(): Promise<Blob | null>
uploadMyProfileAvatar(imageBlob: Blob): Promise<{ storagePath: string; publicUrl: string } | null>
deleteMyProfileAvatarObject(storagePath: string | null | undefined): Promise<boolean>
getProfileAvatarPublicUrl(storagePath: string | null | undefined): string | null
```

### 6.1 Restricciones verificadas

- `touchMyProfileLastActivity` usa throttle cliente de `10 min` (constante `LAST_ACTIVITY_TOUCH_INTERVAL_MS`).
- `/account` fuerza un touch inicial con `bypassThrottle: true` al cargar sesión válida.
- `MapScreenVNext` toca actividad sin bypass en `useFocusEffect`.
- `uploadMyProfileAvatar` puede devolver `null` ante fallo de optimización/subida/URL pública; la UI debe tratarlo como error recuperable.

---

## 7) Flujos canónicos

### 7.1 Carga de cuenta (`/account`)

1. `supabase.auth.getUser()`.
2. Si no hay sesión o es anónima: no leer/escribir `profiles`; mostrar CTA de auth.
3. Si hay sesión: `touchMyProfileLastActivity({ bypassThrottle: true })`.
4. `fetchMyProfile()` y poblar UI con `display_name`, `email`, `avatar_storage_path`.

### 7.2 Editar nombre visible

1. Sanitizar (`trim`) en UI.
2. `updateMyProfile({ display_name })`.
3. Reflejar respuesta devuelta por DB y mostrar feedback.

### 7.3 Cambiar/eliminar avatar

1. Seleccionar blob (`pickProfileImageBlob`).
2. Subir a Storage (`uploadMyProfileAvatar`) -> ruta fija `{user_id}/avatar.jpg`.
3. Persistir ruta en `profiles.avatar_storage_path` con `updateMyProfile`.
4. Para eliminar: borrar objeto (`deleteMyProfileAvatarObject`) y luego `updateMyProfile({ avatar_storage_path: null })`.

---

## 8) Troubleshooting rápido

| Síntoma | Causa probable | Verificación |
| --- | --- | --- |
| Error al leer/escribir `avatar_storage_path` | Falta migración `027_profile_avatar_storage.sql` | Ejecutar `scripts/supabase/ol-profile-introspect.sql` y confirmar columna/policies de bucket |
| `email` de `profiles` no sincroniza con `auth.users` | Falta `028_profiles_email_sync.sql` o trigger desactivado | Revisar introspección de triggers `on_auth_user_email_sync_profiles` y `profiles_enforce_email_from_auth_trigger` |
| Subida de avatar falla con 403/`null` | Objeto fuera del patrón permitido por policy | Confirmar que la ruta sea exactamente `{auth.uid()}/avatar.jpg` |
| `last_activity_at` parece “no cambiar” en pruebas cortas | Throttle cliente de 10 min | Probar desde `/account` (usa `bypassThrottle: true`) o esperar ventana de throttle |

---

## Referencias

- `[PLAN_OL_PROFILE_001_ROBUST_USER_PROFILE_2026-03-28.md](../ops/plans/PLAN_OL_PROFILE_001_ROBUST_USER_PROFILE_2026-03-28.md)`
- `[OPEN_LOOPS.md](../ops/OPEN_LOOPS.md)`
- `[DATA_MODEL_CURRENT.md](DATA_MODEL_CURRENT.md)`
- `[scripts/supabase/README.md](../../scripts/supabase/README.md)`
