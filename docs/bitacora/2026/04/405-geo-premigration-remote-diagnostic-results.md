# 405 — Resultados remotos pre-migracion geo

**Fecha:** 2026-04-28
**Tipo:** evidencia remota / diagnostico read-only / data architecture

## Contexto

Se ejecuto el diagnostico read-only definido en [`GEO_IDENTITY_PREMIGRATION_DIAGNOSTIC_2026-04-28.sql`](../../../ops/GEO_IDENTITY_PREMIGRATION_DIAGNOSTIC_2026-04-28.sql) contra Supabase remoto usando `npx supabase db query --linked`.

No se aplicaron migraciones ni cambios de datos.

## Resultado ejecutivo

- `spots_total=313`
- `visible_spots=304`
- tablas `geo_*` existentes: `0`
- `geo_like_spots_by_provider_metadata=104`
- `repeated_linked_place_id_groups=7`
- `repeated_visible_title_groups=21`

## Lectura arquitectonica

La evidencia confirma el diagnostico de producto:

- hoy hay entidades territoriales viviendo como `spots`;
- no existe identidad geo canonica;
- hay duplicados territoriales por proveedor y por titulo;
- varios spots geo-like ya tienen relaciones de usuario/media, por lo que no se puede limpiar ni reclasificar de forma destructiva.

## Distribucion geo-like

| `linked_place_kind` | `mapbox_feature_type` | Spots |
|---|---|---:|
| `poi` | `country` | 40 |
| `poi` | `place` | 55 |
| `poi` | `locality` | 4 |
| `poi` | `region` | 4 |
| `poi` | `neighborhood` | 1 |

## Duplicados visibles por `linked_place_id`

| Caso | Filas | Observacion |
|---|---:|---|
| Brasil | 3 | Pais duplicado como spot. |
| München / Múnich | 2 | Ciudad con alias/idioma. |
| Costa Rica | 2 | Pais duplicado como spot. |
| Chile | 2 | Pais duplicado como spot. |
| Costa Rica / San José | 2 | Mismo ref mezclando pais/ciudad; red flag. |
| Ciudad de México | 2 | Ciudad duplicada como spot. |
| Kerpen | 2 | Ciudad duplicada como spot. |

## Casos semilla

| Caso | Estado |
|---|---|
| Holbox | Existe como spot visible, `linked_place_kind=poi`, sin `mapbox_feature_type`. |
| Mérida | Existe como spot visible, `linked_place_kind=poi`, sin `mapbox_feature_type`. |
| San José | Existe como spot visible con `mapbox_feature_type=country`; requiere revision antes de seed/backfill. |
| México | Existe como spot visible con `mapbox_feature_type=country`. |

## Riesgo de relaciones

66 spots geo-like tienen al menos una relacion (`pins`, `pin_tags`, `spot_images` o `spot_personal_images`).

Implicacion:

- No hard delete.
- No soft-hide masivo sin backup y criterio producto.
- No migrar relaciones usuario-geo implicitamente sin definir `user_geo_marks`.
- Cualquier cleanup debe venir despues de `040`/`041`/`042` y con script de backfill auditado.

## Decision

Procede preparar el siguiente PR de migracion `040_geo_core_tables.sql` como DDL aditivo, sin seed y sin tocar `spots`.

No procede todavia:

- Search geo runtime.
- GeoSheet runtime.
- Cleanup de geo-like spots.
- Backfill spot-geo.
- Seed masivo de paises/ciudades.

## Validacion

- Conexion remota verificada con query read-only.
- SQL diagnostico completo ejecuto sin error.
- Resultados resumidos en [`PLAN_GEO_CANON_MIGRATIONS_V1_2026-04-28.md`](../../../ops/plans/PLAN_GEO_CANON_MIGRATIONS_V1_2026-04-28.md).

## Rollback

No aplica rollback DB. Este bloque solo documenta evidencia remota.
