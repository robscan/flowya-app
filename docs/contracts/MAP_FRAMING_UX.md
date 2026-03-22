# MAP_FRAMING_UX — Encuadre de cámara (Explore)

**Estado:** referencia de producto / UX (2026-03-22).  
**Código:** [`lib/places/areaFraming.ts`](../../lib/places/areaFraming.ts), [`focusCameraOnSpot` en `MapScreenVNext`](../../components/explorar/MapScreenVNext.tsx), [`hooks/useMapCore.ts`](../../hooks/useMapCore.ts).

---

## Principio

- **Una intención por control:** encuadrar el **lugar** (spot / bbox / zoom contextual) no debe mezclarse en el mismo gesto que “ir a mi posición” o “ver usuario + spot”. Eso reduce conflictos con filtros, sheet y `programmaticFlyTo`.
- **Zoom contextual:** país/región → `fitBounds` cuando hay `mapbox_bbox` y aplica `shouldFitBoundsForPlace`; POI puntual → zoom ~`SPOT_FOCUS_ZOOM` (17) vía [`applyExploreCameraForPlace`](../../lib/places/areaFraming.ts).

---

## Decisión: encuadre contextual = ciclo de zoom sobre el mismo foco

El botón de encuadre (Explore) **no** mezcla lugar y usuario. Ciclo de **dos pasos** sobre la misma ancla (spot o POI), en `applyPlaceReframeCycle` ([`lib/places/areaFraming.ts`](../../lib/places/areaFraming.ts)): **encuadre definido** (`applyExploreCameraForPlace`: `fitBounds` cuando aplica bbox + heurísticas; si no, `flyTo` contextual) ↔ **vista general** (mismo centro, `SPOT_REFRAME_CYCLE_WIDE_ZOOM`). El botón **Locate** sigue siendo la acción para ir a la posición del usuario.

---

## Rutas de cámara

| Origen | Comportamiento |
|--------|----------------|
| Búsqueda: tap en resultado spot | `focusCameraOnSpot(spot)` — respeta `mapbox_bbox` + tipo |
| Deep link / spot existente desde POI | Misma heurística unificada |
| Tap en mapa: POI sin bbox en tiles | Encuadre en UI con viewport; **persistencia** de bbox vía forward geocode al guardar (`resolveFramingForMapTapPoi`) |

---

## Rendimiento

Evitar ráfagas de `fitBounds`/`flyTo` + refetch completo de lista tras cada mutación; preferir merge local del spot y refresco ligero de etiquetas cuando baste.
