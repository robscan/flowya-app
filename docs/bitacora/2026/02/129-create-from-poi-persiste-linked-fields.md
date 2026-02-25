# Bitácora 129 — Create from POI/Search persiste `link_*` al insertar

**Fecha:** 2026-02-25  
**Rama:** `codex/search-poi-linking-phase-b`

---

## Objetivo

Corregir causa raíz de “tap abre sheet POI en vez de Flowya” después de crear spot desde POI/Search: el spot se creaba sin `linked_place_id`.

## Cambios aplicados

Archivo:

- `components/explorar/MapScreenVNext.tsx`

Ajustes:

- `TappedMapFeature` ahora conserva metadatos de enlace:
  - `placeId`
  - `maki`
- Al crear preview desde Search (`handleCreateFromPlace`) se pasa `place.id` y `place.maki`.
- Al tocar feature en mapa (`handleMapClick`) se captura:
  - `placeId` (feature/mapbox/place id disponible)
  - `maki` (`maki`/`icon` del feature)
- En `handleCreateSpotFromPoi` y `handleCreateSpotFromPoiAndShare`, el `insertPayload` ahora persiste:
  - `link_status` (`linked` cuando hay `placeId`; `unlinked` si no)
  - `linked_place_id`
  - `linked_place_kind`
  - `linked_maki`
  - `linked_at`
  - `link_version` (`SPOT_LINK_VERSION`)

## Impacto esperado

- Un spot creado desde POI/Search nace enlazado cuando el proveedor entrega id, por lo que el tap posterior puede resolver a Flowya por regla linked.
- Se reduce dependencia de fallback por proximidad.

