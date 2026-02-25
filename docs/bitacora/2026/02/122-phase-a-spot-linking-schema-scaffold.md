# Bitácora 122 — Fase A: schema + scaffolding de spot linking

**Fecha:** 2026-02-25  
**Rama:** `codex/search-poi-linking-phase-a`  
**Relación:** PLAN_SPOT_LINKING_VISIBILITY_SAFE_ROLLOUT, OL-P0-004

---

## Objetivo

Iniciar Fase A del rollout seguro de linking spot↔POI/Landmark, dejando base de datos, contratos y puntos de extensión listos sin activar comportamiento productivo.

---

## Cambios aplicados

### 1) Migración DB (additive)

Archivo:

- `supabase/migrations/015_spots_linking_fields.sql`

Columnas nuevas en `spots`:

- `link_status` (default `unlinked`)
- `link_score`
- `linked_place_id`
- `linked_place_kind`
- `linked_maki`
- `linked_at`
- `link_version`

Constraints:

- `spots_link_status_check` (`linked|uncertain|unlinked`)
- `spots_linked_place_kind_check` (`poi|landmark|null`)

Índices:

- `idx_spots_link_status`
- `idx_spots_linked_place_id`

### 2) Feature flags (default OFF)

Archivo:

- `lib/feature-flags.ts`

Flags agregadas:

- `EXPO_PUBLIC_FF_LINK_ON_EDIT_SAVE`
- `EXPO_PUBLIC_FF_HIDE_LINKED_UNSAVED`
- `EXPO_PUBLIC_FF_FLOWYA_PIN_MAKI_ICON`

### 3) Resolver scaffold

Archivos:

- `lib/spot-linking/types.ts`
- `lib/spot-linking/resolveSpotLink.ts`

Estado:

- Resolver en modo scaffold (`v1-phase-a-scaffold`), retorna fallback seguro `unlinked`.
- Sin lookup externo ni scoring real aún (queda para Fase B/C).

### 4) Hook pasivo en Edit Spot web

Archivo:

- `app/spot/edit/[id].web.tsx`

Comportamiento:

- Al guardar ubicación, si `linkOnEditSave` está activo, llama resolver y añade `link_*` al update.
- Con flags por defecto OFF, no altera comportamiento actual.

### 5) Contratos actualizados

- `docs/contracts/DATA_MODEL_CURRENT.md`
- `docs/contracts/MAPBOX_PLACE_ENRICHMENT.md`
- `docs/ops/OPEN_LOOPS.md` (avance de Fase A)

---

## Criterio de seguridad

- No hay cambio de UX visible por defecto.
- No hay ocultamiento condicional activado.
- No hay dependencia obligatoria de API externa.

---

## Riesgos pendientes

- Resolver real y scoring aún no implementados (intencional).
- Falta definir contrato final de `place_id` estable para dedupe mixto Search.
- Falta validar política de visibilidad de POI base antes de activar hide linked-unsaved.

---

## Próximo paso

Fase B:

- Resolver real (`resolveSpotLink`) con candidatos + score + `uncertain`.
- Integrar solamente detrás de flags y con smoke de no-regresión en Edit Spot.
