# Migration registry — flowya-app Supabase (legacy)

**Última actualización:** 2026-05-17  
**Fuente remota:** [`SUPABASE_HEALTH_SNAPSHOT_2026-05-17.json`](SUPABASE_HEALTH_SNAPSHOT_2026-05-17.json)  
**Política vigente:** no usar `supabase db push` hasta reconciliar historial. Aplicar cambios con `db query --file` + verificador SQL + bitácora.

## Leyenda

| Estado | Significado |
|--------|-------------|
| **applied** | Evidencia en remoto (tablas/policies/conteos) o bitácora de aplicación verificada |
| **pending** | Archivo en repo; objeto remoto ausente |
| **backup-only** | SQL de respaldo/listado; no DDL de producto |
| **n/a** | No existe archivo en repo |

## Resumen ejecutivo

| Métrica | Valor |
|---------|--------|
| Archivos en `supabase/migrations/` | 43 |
| Hueco en numeración | **023** (no existe) |
| Duplicado de prefijo | **018** (×2) |
| Última aplicada en remoto | **042** |
| Pendiente en remoto | **043** |
| `public.supabase_migrations` | **No visible** (solo `auth` / `realtime`) |

## Registro completo

| # | Archivo | Remoto | Método | Evidencia | Verificador |
|---|---------|--------|--------|-----------|-------------|
| 001 | `001_create_spots_and_pins.sql` | applied | histórico | `spots`, `pins` existen | introspección 2026-04-26 |
| 002 | `002_add_spots_address.sql` | applied | histórico | columna `spots.address` | introspección 2026-04-26 |
| 003 | `003_storage_spot_covers.sql` | applied | histórico | bucket `spot-covers` | introspección Storage |
| 004 | `004_storage_spot_covers_public.sql` | applied | histórico | bucket público | introspección Storage |
| 005 | `005_storage_spot_covers_update.sql` | applied | histórico | policies Storage | introspección Storage |
| 006 | `006_pins_unique_rls.sql` | applied | histórico | RLS `pins` | introspección 2026-04-26 |
| 007 | `007_pins_delete_policy.sql` | applied | histórico | policy delete | introspección |
| 008 | `008_spots_rls_select.sql` | applied | histórico | SELECT spots públicos | introspección |
| 009 | `009_feedback_table.sql` | applied | histórico | tabla `feedback` (0 filas) | health 2026-05-17 |
| 010 | `010_spots_update_authenticated_soft_delete.sql` | applied | histórico | `is_hidden` en spots | introspección |
| 011 | `011_pins_saved_visited.sql` | applied | histórico | `saved`/`visited` | health 2026-05-17 |
| 012 | `012_spots_set_user_id_on_insert.sql` | applied | histórico | todos spots con `user_id` | introspección |
| 013 | `013_spots_update_authenticated_ensure.sql` | applied | histórico | UPDATE spots auth | introspección |
| 014 | `014_spots_hide_spot_rpc.sql` | applied | histórico | RPC hide | introspección |
| 015 | `015_spots_linking_fields.sql` | applied | histórico | `linked_place_*` | introspección |
| 016 | `016_rpc_get_most_visited_spots.sql` | applied | histórico | RPC agregados | introspección |
| 017 | `017_get_most_visited_spots_k_anonymity.sql` | applied | histórico | k-anon RPC | introspección |
| 018 | `018_spots_block_client_hard_delete.sql` | applied | `db query --file` | bitácora 308; sin DELETE cliente | inventario seguridad |
| 018 | `018_spots_owner_write_guardrails.sql` | applied | `db query --file` | bitácora 308; guardrails owner | inventario seguridad |
| 019 | `019_spots_mapbox_camera_framing.sql` | applied | histórico | `mapbox_bbox`, `mapbox_feature_type` | introspección |
| 020 | `020_user_tags_pin_tags.sql` | applied | histórico | `user_tags`, `pin_tags` | health 2026-05-17 |
| 021 | `021_user_tags_set_user_id_trigger.sql` | applied | histórico | trigger tags | bitácora 310 |
| 022 | `022_storage_spot_covers_owner_write_guardrails.sql` | applied | histórico | Storage guardrails | introspección |
| 023 | — | n/a | — | **No hay archivo 023** en repo | — |
| 024 | `024_spot_images.sql` | applied | histórico | tabla `spot_images` | health 2026-05-17 |
| 025 | `025_storage_spot_gallery_owner.sql` | applied | histórico | galería Storage | introspección |
| 026 | `026_profiles_private_owner_rls.sql` | applied | histórico | tabla `profiles` | health 2026-05-17 |
| 027 | `027_profile_avatar_storage.sql` | applied | histórico | bucket avatars | scripts/supabase README |
| 028 | `028_profiles_email_sync.sql` | applied | histórico | columna `email` | profile introspect |
| 029 | `029_profiles_last_activity_at.sql` | applied | histórico | `last_activity_at` | profile introspect |
| 030 | `030_profiles_photo_sharing_pref.sql` | applied | histórico | `share_photos_with_world` | contrato fotos |
| 031 | `031_spot_personal_images_private.sql` | applied | histórico | `spot_personal_images` | health 2026-05-17 |
| 032 | `032_storage_spot_personal_private.sql` | applied | histórico | bucket privado | introspección |
| 033 | `033_pins_remove_public_select.sql` | applied | `db query --file` | sin `pins_select_public`; policies owner | health 2026-05-17 |
| 034 | `034_spots_invalid_mapbox_bbox_cleanup.sql` | applied | `db query --file` | backup table existe; **0 bbox inválidos** | health 2026-05-17 |
| 035 | `035_spot_images_path_first_metadata.sql` | applied | `db query --file` | `storage_path` en `spot_images` | bitácora 394 / MEDIA_STORAGE |
| 036 | `036_seed_cover_only_spot_images.sql` | applied | `db query --file` | 81 filas `spot_images` | health 2026-05-17 |
| 037 | `037_pins_status_derived_guard.sql` | applied | `db query --file` | estados pins coherentes (70/153) | bitácora 394; health 2026-05-17 |
| 038 | `038_spot_covers_orphan_candidates_backup.sql` | backup-only | SQL listado | no DDL producto | bitácora 397 |
| 039 | `039_spots_linked_exact_duplicate_cleanup.sql` | applied | `db query --file` | unique index parcial POI | bitácora 396 |
| 040 | `040_geo_core_tables.sql` | applied | `db query --file` | 5 tablas `geo_*`; RLS on | bitácora 409; GEO_CORE verify |
| 041 | `041_geo_seed_initial_scope.sql` | applied | `db query --file` | 4 países, 2 regiones, 3 ciudades, 21 aliases | bitácora 410 |
| 042 | `042_user_geo_marks.sql` | applied | `db query --file` | tabla existe; 0 filas; RLS on | bitácora 411; USER_GEO verify |
| 043 | `043_flow_core_tables.sql` | **pending** | — | `flows` / `flow_stops` **ausentes** | FLOW_CORE verify (post-apply) |

## Planes futuros (no en repo)

| # planificado | Archivo en plan | En repo | Notas |
|---------------|-----------------|---------|-------|
| 043 (geo plan) | `043_spots_geo_links_and_provenance.sql` | **no** | Colisión de número con Flow `043` — renumerar a **044+** |
| 044 (geo plan) | `044_spots_geo_backfill_reviewed.sql` | **no** | Requiere revisión manual de 103 spots geo-like visibles |

Fuente: [`PLAN_GEO_CANON_MIGRATIONS_V1_2026-04-28.md`](plans/PLAN_GEO_CANON_MIGRATIONS_V1_2026-04-28.md)

## Procedimiento para la siguiente migración (043)

1. VoBo producto + rollback documentado.  
2. `npx supabase db query --db-url "$SUPABASE_DB_URL" --file supabase/migrations/043_flow_core_tables.sql`  
   (o `python3 scripts/supabase/remote_health_check.py` antes/después).  
3. [`FLOW_CORE_POSTMIGRATION_VERIFY_2026-04-28.sql`](FLOW_CORE_POSTMIGRATION_VERIFY_2026-04-28.sql)  
4. Actualizar esta tabla y bitácora.  
5. Conectar runtime solo después de verificación.

## Comandos útiles

```bash
set -a && source .env && set +a
python3 scripts/supabase/remote_health_check.py
python3 scripts/supabase/remote_health_check.py --out docs/ops/SUPABASE_HEALTH_SNAPSHOT.json
```

**Nota:** `supabase db query --linked` requiere `SUPABASE_DB_PASSWORD` y falla si la contraseña tiene `[]`. Preferir `SUPABASE_DB_URL` + script Python o percent-encode manual.
