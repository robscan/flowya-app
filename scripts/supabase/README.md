# Introspección Supabase (OL-PROFILE)

## Archivos


| Archivo                      | Uso                                                                                       |
| ---------------------------- | ----------------------------------------------------------------------------------------- |
| `ol-profile-introspect.sql`  | Consultas para pegar en **SQL Editor** y ver columnas, RLS, triggers y Storage.           |
| `profiles_snapshot_json.sql` | Devuelve **un JSON** con el listado de columnas de `profiles` (copiar/pegar al snapshot). |
| `snapshot.example.json`      | Plantilla de cómo documentar el estado esperado / pegar resultados exportados.            |
| `snapshots/profiles-remote.schema.json` | Referencia validada: columnas `profiles` en remoto.                          |
| `snapshots/storage-profile-avatars.policies.json` | Referencia validada: políticas del bucket `profile-avatars`.           |


## Cómo obtener “estado actual”

1. Abre el proyecto en [Supabase Dashboard](https://supabase.com/dashboard) → **SQL** → **New query**.
2. Pega secciones de `ol-profile-introspect.sql` (o el archivo completo si el editor lo permite ejecutar todo).
3. Para guardar como JSON: en muchos editores puedes exportar resultados; si no, copia la tabla a una hoja y convierte, o usa `json_agg` en una variante de la query, por ejemplo:

```sql
SELECT json_agg(row_to_json(t))
FROM (
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'profiles'
  ORDER BY ordinal_position
) t;
```

4. Guarda el JSON en tu control de versiones interno o adjúntalo al PR de migración.

## Orden de migraciones relevantes (perfil)

1. `026_profiles_private_owner_rls.sql` — tabla `profiles`, RLS, trigger fila nueva en `auth.users`.
2. `027_profile_avatar_storage.sql` — `avatar_storage_path`, bucket `profile-avatars`, políticas Storage.
3. `028_profiles_email_sync.sql` — columna `email` y sincronización con `auth.users`.
4. `029_profiles_last_activity_at.sql` — columna `last_activity_at` (marca de uso de la app; **no** se muestra en UI de cuenta; analítica / **OL-METRICS-001** vía DB).

Si en remoto solo está 026, la app fallará al seleccionar `avatar_storage_path` hasta aplicar **027**. El email en tabla requiere **028**.

## Checklist rápido de verificación (perfil)

Ejecuta estas consultas en SQL Editor después de aplicar migraciones:

```sql
-- 1) Columnas canónicas en profiles
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
  AND column_name IN (
    'id', 'display_name', 'email', 'avatar_storage_path', 'last_activity_at', 'created_at', 'updated_at'
  )
ORDER BY column_name;

-- 2) Triggers esperados en auth.users / public.profiles
SELECT event_object_schema, event_object_table, trigger_name
FROM information_schema.triggers
WHERE (event_object_schema = 'auth' AND event_object_table = 'users')
   OR (event_object_schema = 'public' AND event_object_table = 'profiles')
ORDER BY event_object_schema, event_object_table, trigger_name;

-- 3) Policies del bucket profile-avatars
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
  AND (qual ILIKE '%profile-avatars%' OR with_check ILIKE '%profile-avatars%')
ORDER BY policyname;
```

## Troubleshooting común

| Síntoma en app | Causa probable | Acción recomendada |
| --- | --- | --- |
| Error `column profiles.avatar_storage_path does not exist` | Falta migración `027_profile_avatar_storage.sql` | Aplicar 027 y reintentar; validar columnas con checklist |
| Subida de avatar devuelve `null` o 403 | Política Storage bloquea path | Confirmar objeto exacto `{auth.uid()}/avatar.jpg` (sin subcarpetas) |
| `profiles.email` no coincide con `auth.users.email` | Falta trigger de 028 | Revisar `on_auth_user_email_sync_profiles` y `profiles_enforce_email_from_auth_trigger` |
| `last_activity_at` parece estático | Throttle cliente de `touchMyProfileLastActivity` (~10 min) | Probar carga de `/account` (usa `bypassThrottle: true`) o esperar ventana |

## Codepaths de referencia

- UI cuenta web: `app/account/index.web.tsx`
- Mapa (focus + touch de actividad): `components/explorar/MapScreenVNext.tsx`
- Capa perfil: `lib/profile/index.ts`
- Avatar Storage: `lib/profile-avatar-upload.ts`
- Contrato vigente: `docs/contracts/PROFILE_AUTH_CONTRACT_CURRENT.md`
