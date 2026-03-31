# 308 — Merge PR #101, #99 y #100 (contrato SpotSheet + seguridad spots)

Fecha: 2026-03-21  
Tipo: Ops + integración  
Rama: `main` (merges secuenciales)

## Resumen

Integración en `main` de tres PRs en borrador, orden de merge: **#101** → **#99** → **#100**. Ramas remotas `cursor/*` eliminadas post-merge.

| PR | Contenido |
|----|-----------|
| [#101](https://github.com/robscan/flowya-app/pull/101) | Contrato `docs/contracts/SPOT_SHEET_CONTENT_RULES.md` — modo POI y lightbox. |
| [#99](https://github.com/robscan/flowya-app/pull/99) | Migración `018_spots_block_client_hard_delete.sql` — revocar DELETE en clientes, políticas delete legacy. |
| [#100](https://github.com/robscan/flowya-app/pull/100) | Migración de guardrails owner-write (renombrada luego a `022_spots_owner_write_guardrails.sql` para evitar colisión de versión) — políticas INSERT/UPDATE/DELETE por owner, `hide_spot` con comprobación de ownership. |

## Orden de aplicación en Supabase

Se corrigió la colisión de versión entre migraciones `018_*`:

- `018_spots_block_client_hard_delete.sql`
- `022_spots_owner_write_guardrails.sql`

Con esta versión única, la migración de ownership puede aplicarse de forma fiable en todos los entornos.

## Validación local

- `npm run lint` (expo lint): sin errores; advertencias preexistentes en otros archivos.

## Referencias

- `docs/contracts/SPOT_SHEET_CONTENT_RULES.md`
- `supabase/migrations/018_spots_block_client_hard_delete.sql`
- `supabase/migrations/022_spots_owner_write_guardrails.sql`
