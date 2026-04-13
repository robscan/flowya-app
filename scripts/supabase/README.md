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

1. Guarda el JSON en tu control de versiones interno o adjúntalo al PR de migración.

## Orden de migraciones relevantes (perfil)

1. `026_profiles_private_owner_rls.sql` — tabla `profiles`, RLS, trigger fila nueva en `auth.users`.
2. `027_profile_avatar_storage.sql` — `avatar_storage_path`, bucket `profile-avatars`, políticas Storage.
3. `028_profiles_email_sync.sql` — columna `email` y sincronización con `auth.users`.
4. `029_profiles_last_activity_at.sql` — columna `last_activity_at` (marca de uso de la app; **no** se muestra en UI de cuenta; analítica / **OL-METRICS-001** vía DB).

Si en remoto solo está 026, la app fallará al seleccionar `avatar_storage_path` hasta aplicar **027**. El email en tabla requiere **028**.