# Bitácora 126 — Tap POI: match exclusivo por `linked_place_id`

**Fecha:** 2026-02-25  
**Rama:** `codex/search-poi-linking-phase-b`

---

## Objetivo

Eliminar falsos positivos al tocar POIs (abrir sheet Flowya por cercanía) y alinear interacción con el modelo de enlace real (`link_*`).

## Cambios aplicados

Archivo:

- `components/explorar/MapScreenVNext.tsx`

Ajustes:

- Se elimina el match por proximidad (`distanceKm <= SPOT_POI_MATCH_TOLERANCE_KM`) al tocar POI/Landmark.
- El match ahora es exclusivo por `linked_place_id` del spot vs id del feature tocado.
- Se amplía la carga de spots para incluir:
  - `link_status`
  - `linked_place_id`
  - `linked_place_kind`
- Si no existe match linked, se mantiene el flujo de sheet en modo POI (no selecciona spot Flowya).

## Impacto esperado

- Un spot `unlinked` ya no abrirá sheet Flowya por estar cerca de un POI.
- Tocar un POI abrirá sheet Flowya solo cuando el spot esté realmente enlazado (`link_status = linked` + `linked_place_id` coincidente).

## Riesgo residual

- Algunos features de Mapbox no exponen id estable en el tap; en esos casos no habrá match linked y se abrirá sheet POI.

