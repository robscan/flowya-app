# MAP_FRAMING_UX — Encuadre de cámara (Explore)

**Estado:** referencia de producto / UX (actualizado 2026-04-26).
**Código:** [`lib/places/areaFraming.ts`](../../lib/places/areaFraming.ts), [`lib/places/cameraBBox.ts`](../../lib/places/cameraBBox.ts), [`lib/places/resolveCameraFraming.ts`](../../lib/places/resolveCameraFraming.ts), [`focusCameraOnSpot` en `MapScreenVNext`](../../components/explorar/MapScreenVNext.tsx), [`hooks/useMapCore.ts`](../../hooks/useMapCore.ts).

---

## Principio

- **Una intención por control:** encuadrar el **lugar** (spot / bbox / zoom contextual) no debe mezclarse en el mismo gesto que “ir a mi posición” o “ver usuario + spot”. Eso reduce conflictos con filtros, sheet y `programmaticFlyTo`.
- **Invariant bbox↔punto:** `mapbox_bbox` solo puede controlar cámara si es finito, tiene forma `{west,south,east,north}` y contiene el punto real del spot/lugar (`latitude/longitude`). Si no contiene el punto, gana el punto y el bbox debe ignorarse o repararse explícitamente.
- **Zoom contextual:** país/región → `fitBounds` cuando hay `mapbox_bbox` confiable y aplica `shouldFitBoundsForPlace`; parque/atracción/área POI → `fitBounds` si hay bbox confiable, o fallback contextual amplio; POI puntual → zoom ~`SPOT_FOCUS_ZOOM` (17) vía [`applyExploreCameraForPlace`](../../lib/places/areaFraming.ts).

---

## Decisión: encuadre contextual = ciclo de zoom sobre el mismo foco

El botón de encuadre (Explore) **no** mezcla lugar y usuario. Ciclo de **dos pasos** sobre la misma ancla (spot o POI), en `applyPlaceReframeCycle` ([`lib/places/areaFraming.ts`](../../lib/places/areaFraming.ts)): **encuadre definido** (`applyExploreCameraForPlace`: `fitBounds` cuando aplica bbox + heurísticas; si no, `flyTo` contextual) ↔ **vista general** (mismo centro, `SPOT_REFRAME_CYCLE_WIDE_ZOOM`). El botón **Locate** sigue siendo la acción para ir a la posición del usuario.

---

## Rutas de cámara

| Origen | Comportamiento |
|--------|----------------|
| Búsqueda: tap en resultado spot | `focusCameraOnSpot(spot)` — respeta `mapbox_bbox` + tipo solo si el bbox contiene el punto |
| Deep link / spot existente desde POI | Misma heurística unificada |
| Tap en mapa: POI sin bbox en tiles | Encuadre en UI con viewport; **persistencia** de bbox confiable vía título + proximidad al guardar (`resolveFramingForMapTapPoi` / `resolveCameraFramingForPointName`) |
| Edit Spot → Guardar | Si cambia ubicación o el bbox actual falta/no contiene el punto, se intenta reparar por título + proximidad; si no hay bbox confiable, se limpia metadata de cámara derivada |

---

## Backfill V1

La migración `034_spots_invalid_mapbox_bbox_cleanup.sql` queda preparada para limpiar metadata derivada incoherente sin tocar coordenadas, pins, visibilidad ni ownership. Antes de limpiar, guarda respaldo en `spots_mapbox_bbox_cleanup_034_backup` con RLS habilitado y sin policies públicas.

---

## Rendimiento

Evitar ráfagas de `fitBounds`/`flyTo` + refetch completo de lista tras cada mutación; preferir merge local del spot y refresco ligero de etiquetas cuando baste.
