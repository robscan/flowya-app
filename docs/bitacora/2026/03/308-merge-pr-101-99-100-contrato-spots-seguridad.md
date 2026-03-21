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
| [#100](https://github.com/robscan/flowya-app/pull/100) | Migración `018_spots_owner_write_guardrails.sql` — políticas INSERT/UPDATE/DELETE por owner, `hide_spot` con comprobación de ownership. |

## Orden de aplicación en Supabase

Ambas migraciones comparten prefijo `018_*`; orden lexicográfico: `018_spots_block_client_hard_delete.sql` antes que `018_spots_owner_write_guardrails.sql`.

## Validación local

- `npm run lint` (expo lint): sin errores; advertencias preexistentes en otros archivos.

## Referencias

- `docs/contracts/SPOT_SHEET_CONTENT_RULES.md`
- `supabase/migrations/018_spots_block_client_hard_delete.sql`
- `supabase/migrations/018_spots_owner_write_guardrails.sql`
