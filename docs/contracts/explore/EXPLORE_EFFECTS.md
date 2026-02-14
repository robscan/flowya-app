# EXPLORE_EFFECTS

## Purpose
Definir los **effects/adapters** que Explore necesita (map, repo, uploads, auth gating) para ejecutar intents sin acoplarse a plataformas/UI.

## Scope
- Fetch y refresh de spots (incluye filtros por `is_hidden`)
- Selección y navegación del mapa (flyTo, getBounds, screenPos)
- Create spot (draft inline) → persistencia + upload
- Soft delete (is_hidden) + políticas anti “pin fantasma”
- Auth gating como decisión previa a ciertas acciones

## Non-goals
- UI (Radix/shadcn/Reanimated)
- Implementación concreta de Supabase/Mapbox en este documento

## Contract

### Adapters (pseudo-TypeScript)

```ts
type SpotsRepo = {
  fetchSpots(args: { viewport?: MapViewportSnapshot; includeHidden?: boolean }): Promise<ExploreSpotLite[]>;
  insertSpot(args: {
    coords: { lat: number; lng: number };
    title?: string;
    descriptionShort?: string;
    descriptionLong?: string;
    coverUri?: string;
  }): Promise<{ spotId: string }>;
  updateSpotHidden(args: { spotId: string; isHidden: boolean }): Promise<void>;
};

type MapAdapter = {
  getViewport(): Promise<MapViewportSnapshot>;
  getBounds(): Promise<MapViewportSnapshot["bounds"] | undefined>;
  flyTo(args: { center: { lat: number; lng: number }; zoom?: number }): Promise<void>;
  getSelectedPinScreenPos(args: { spotId: string }): Promise<{ x: number; y: number } | null>;
};

type MediaUploadAdapter = {
  uploadSpotCover(args: { spotId: string; uri: string }): Promise<{ publicUrl: string }>;
};

type AuthGateAdapter = {
  requireAuth(): Promise<{ ok: true } | { ok: false; reason: "not_authed" }>;
};

type ExploreEffects = {
  spotsRepo: SpotsRepo;
  map: MapAdapter;
  media: MediaUploadAdapter;
  auth: AuthGateAdapter;
};
```

### Políticas recomendadas (anti bugs fantasma)
- **Soft delete invalidation chain** (obligatoria):
  1) `updateSpotHidden(spotId,true)` exitoso
  2) emitir intent `EXPLORE/SPOT_HIDDEN`
  3) invalidar Search cache: `SEARCH/INVALIDATE_SOFT_DELETED`
  4) refresh pins: `fetchSpots` o eliminar localmente el spot
- **Refetch policy**:
  - Después de delete o create: refrescar `spots` inmediatamente (no esperar a focus).
  - Evitar “pins fantasmas” eliminando localmente el spot en estado antes/además del refetch.

## Invariants (dev-only)
1. `fetchSpots` en Explore V1 **siempre** debe filtrar `is_hidden=false` por default.
2. `updateSpotHidden(true)` debe reflejarse en UI en <1 interacción (no depender de focus).
3. Si se crea un spot desde draft, el draft se reemplaza por el spot persistido (mismo lugar en selección si aplica).
4. Si `selectedSpotId` apunta a un spot ocultado, debe limpiarse o redirigirse a estado estable.

## Effects / Adapters
- Hoy:
  - Repo Supabase: `lib/supabase.ts` + queries en `MapScreenVNext.tsx` y `app/spot/[id].web.tsx`
  - Map: `useMapCore.ts` + `MapCoreView.tsx`
  - Upload: `lib/spot-image-upload` (referenciado en reporte)
  - Auth gating: `AuthModalProvider` + `requireAuthOrModal` pattern en `MapScreenVNext.tsx`
- Futuro:
  - `core/explore/effects/*` implementa adapters concretos por plataforma (web/nativo)

## Source Mapping (today → future)
- Fetch/filter: `MapScreenVNext.tsx` (refetchSpots) → `SpotsRepo.fetchSpots`
- Soft delete: `app/spot/[id].web.tsx` → `SpotsRepo.updateSpotHidden`
- Create:
  - Wizard: `app/create-spot/index.web.tsx`
  - Draft inline: `MapScreenVNext.tsx` + `SpotSheet.tsx` → `SpotsRepo.insertSpot` + `MediaUploadAdapter`
- Map operations: `useMapCore.ts` / `lib/map-core/constants.ts` → `MapAdapter`

## Open Questions
- Confirmar si `is_hidden` está en migraciones (si no, crear migración y alinear docs).
- Decidir si V3 seguirá soportando draft inline además del wizard.
