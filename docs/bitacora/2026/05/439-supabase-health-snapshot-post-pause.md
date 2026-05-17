# 439 — Supabase health snapshot post-pausa

**Fecha:** 2026-05-17
**Rama:** `codex/supabase-phase-0-registry-001`
**OL relacionado:** recuperación Supabase / `OL-DATA-MODEL-INTROSPECTION-001`, Flow `043`

## Qué se hizo

- Introspección read-only del remoto vía `SUPABASE_DB_URL` + `psycopg2` (contraseñas con `[]` no compatibles con URL cruda en CLI).
- Snapshot versionado: [`SUPABASE_HEALTH_SNAPSHOT_2026-05-17.json`](../../ops/SUPABASE_HEALTH_SNAPSHOT_2026-05-17.json).
- Registro de migraciones `001`–`043`: [`MIGRATION_REGISTRY.md`](../../ops/MIGRATION_REGISTRY.md).
- Script reutilizable: [`scripts/supabase/remote_health_check.py`](../../../scripts/supabase/remote_health_check.py).
- Contrato [`DATA_MODEL_CURRENT.md`](../../contracts/DATA_MODEL_CURRENT.md) alineado a conteos 2026-05-17.

## Hallazgos clave

| Área | Estado |
|---|---|
| Geo `040`–`042` | Tablas presentes; seed `041` (4 países, 2 regiones, 3 ciudades, 21 aliases, 19 external_refs); `user_geo_marks` = 0 filas |
| Flow `043` | **No aplicada** — `flows` / `flow_stops` ausentes |
| Core | `spots` 314 (305 visibles / 9 hidden), `pins` 223, `spot_images` 81 |
| `mapbox_bbox` | 98 con bbox, **0 inválidos** (post `034`); tabla backup `034` presente |
| Migraciones CLI | Solo `auth` / `realtime` exponen `schema_migrations`; no usar `db push` masivo |

## Próximos pasos seguros

1. VoBo explícito → aplicar `043_flow_core_tables.sql` con `db query --file` + [`FLOW_CORE_POSTMIGRATION_VERIFY_2026-04-28.sql`](../../ops/FLOW_CORE_POSTMIGRATION_VERIFY_2026-04-28.sql).
2. Mantener política de reconciliación de historial (registro + health check periódico, no push ciego).
3. Conectar runtime Flow persistente solo después de verificar `043` en remoto.

## Evidencia

- Snapshot JSON (sin secretos): `docs/ops/SUPABASE_HEALTH_SNAPSHOT_2026-05-17.json`
- Delta vs introspección 2026-04-26 documentado en el snapshot (`spots` +2, `pins` -2, `spot_images` +7, geo tables nuevas).
