# SYSTEM_MAP — Flowya (map-first)

## Pantallas / Shells

- **ExploreShell (Map-first)**  
  - MapCanvas (Mapbox)
  - FloatingControls
  - OverlayPanel (search / placePreview / createSpot / spotCard / pickLocation)

## Módulos

- **Search V2**
  - Controller (stages, ranking)
  - UI (input, list)
  - Events: `onSelectPlace`, `onSelectSpot`, `onCreateQuery`

- **Create Spot (Explore)**
  - Overlay: CreateSpotOverlay (lite → optional expand)
  - Uses: Mapbox place snapshot, pins status

- **Auth / Profile (actual)**
  - Magic link + AuthModalProvider
  - Gating: guardar pin / abrir perfil / logout confirm

## Datos

- `spots` (public RLS true)  
- `pins` (user-owned, RLS by uid)  
- `feedback`

## Observabilidad / IA (C3)

- `activity_log` (planned): eventos mínimos para flows/recuerdos

## Convenciones de archivos (operativas)

- Bitácora: `docs/bitacora/YYYY/MM/NNN-...md`
- PRs: `docs/pr/YYYY/MM/pr-<scope>-<branch>-<id>.md`
- Estado: `docs/ops/CURRENT_STATE.md` y `docs/ops/OPEN_LOOPS.md`
