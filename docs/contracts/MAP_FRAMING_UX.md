# MAP_FRAMING_UX — Encuadre de cámara (Explore)

**Estado:** referencia de producto / UX (2026-03-22).  
**Código:** [`lib/places/areaFraming.ts`](../../lib/places/areaFraming.ts), [`focusCameraOnSpot` en `MapScreenVNext`](../../components/explorar/MapScreenVNext.tsx), [`hooks/useMapCore.ts`](../../hooks/useMapCore.ts).

---

## Principio

- **Una intención por control:** encuadrar el **lugar** (spot / bbox / zoom contextual) no debe mezclarse en el mismo gesto que “ir a mi posición” o “ver usuario + spot”. Eso reduce conflictos con filtros, sheet y `programmaticFlyTo`.
- **Zoom contextual:** país/región → `fitBounds` cuando hay `mapbox_bbox` y aplica `shouldFitBoundsForPlace`; POI puntual → zoom ~`SPOT_FOCUS_ZOOM` (17) vía [`applyExploreCameraForPlace`](../../lib/places/areaFraming.ts).

---

## Decisión: no alternar “lugar” y “usuario” en un solo botón

Se recomienda mantener **dos acciones claras** (p. ej. control “Ver lugar” vs “Cerca de ti”), en línea con mapas y listas tipo Apple Maps / Reminders. Un ciclo Lugar → Área → Cerca solo si se documenta en UI y no rompe expectativas de reframe único.

Implementación futura opcional: **niveles de zoom del mismo spot** (detalle → barrio → región) como ciclo sobre el **mismo** ancla geográfica; distinto del toggle usuario/lugar.

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
