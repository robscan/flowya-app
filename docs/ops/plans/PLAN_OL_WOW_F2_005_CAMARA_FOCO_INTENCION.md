# Plan: OL-WOW-F2-005 — Cámara/foco por intención

## Contexto

**DoD/AC del OL** (OPEN_LOOPS):
- Definir comportamiento determinista por modo:
  - **discover**: estabilidad de viewport, sin auto-movimientos agresivos
  - **inspect**: centrar selección solo si no está legible/visible
  - **act**: congelar recuadres automáticos durante la acción principal
- Anti-jitter: prohibido encadenar `flyTo + fitBounds` para el mismo evento
- Cada modo se implementa y valida por separado (mini QA secuencial)

**Dependencia:** OL-WOW-F2-004 (Sheet intent model)

---

## Estado actual (análisis)

### Triggers de cámara programática

| Trigger | Acción | Archivo / hook |
|---------|--------|----------------|
| Map load | tryCenterOnUser (geoloc) | useMapCore, lib/map-core/constants |
| Selección desde búsqueda | programmaticFlyTo | MapScreenVNext, searchV2.setOnSelect |
| Selección pin en mapa | programmaticFlyTo | MapScreenVNext, onPinClick |
| Filter change + pending | programmaticFlyTo | handlePinFilterChange |
| Deep link spotId/created | programmaticFlyTo | useEffect params |
| POI tap | programmaticFlyTo | handlePoiTap / reframe |
| Reframe contextual | flyTo / handleReframeSpot | useMapCore |
| Reframe spot+user | flyTo o fitBounds | useMapCore |
| Ver mundo | flyTo(zoom=GLOBE_ZOOM_WORLD/INITIAL) | useMapCore |
| Locate | flyTo(user) | useMapCore |

### Posibles cadenas flyTo+fitBounds
- No se encontró encadenamiento directo en el mismo handler. Cada handler usa solo flyTo O fitBounds.

### Mapeo propuesto: modos → contexto

| Modo | Contexto | Comportamiento |
|------|----------|----------------|
| **discover** | Sin selectedSpot, sheet peek, no en create/edit | No auto-flyTo salvo tryCenterOnUser (load). Estabilidad. |
| **inspect** | selectedSpot activo, sheet medium/expanded | flyTo solo si spot fuera de viewport o no legible |
| **act** | Create spot abierto, edit spot, long-press placing | No auto-frame. Congelar. |

---

## Fases de implementación

### Fase 1: Modo discover (Mini QA 1)
- **Objetivo:** Estabilidad de viewport cuando usuario explora sin selección.
- **Cambios:** Revisar que no haya auto-moves agresivos en discover. tryCenterOnUser en load es aceptable.
- **Verificación:** Cambiar filtro sin pending → cámara no se mueve. Pan/zoom manual → estable.

### Fase 2: Modo inspect (Mini QA 2)
- **Objetivo:** Centrar selección solo si no está visible/legible.
- **Cambios:** Antes de programmaticFlyTo en selección (search, pin, filter pending), comprobar si el punto ya está en viewport con margen. Si sí, omitir flyTo.
- **Implementación:** `isPointVisibleInViewport(map, lng, lat, marginPx)` → boolean.

### Fase 3: Modo act (Mini QA 3)
- **Objetivo:** Congelar recuadres durante create/edit.
- **Cambios:** No programmaticFlyTo cuando createSpotNameOverlayOpen, isPlacingDraftSpot, o navegación a /spot/[id] edit.

### Fase 4: Anti-jitter y documentación
- Auditoría final: confirmar que no hay flyTo+fitBounds encadenados.
- Actualizar MAP_RUNTIME_RULES con reglas de modos.

### Fase 5: Refactor controles mapa
- Globe → toggle zoom world/zoom back (press 1: zoom WORLD manteniendo posición; press 2: restaurar zoom anterior)
- 3D siempre activo, sin toggle
- Location → toggle 3 estados (ubicación → norte → cámara antes de norte)
- Ocultar solo botón flotante Crear spot (MapPinPlus en overlay)

---

## Orden de ejecución

1. Fase 1 (discover) → Mini QA 1 → accept/reject
2. Fase 2 (inspect) → Mini QA 2 → accept/reject
3. Fase 3 (act) → Mini QA 3 → accept/reject
4. Fase 4 (anti-jitter + docs)
5. Fase 5 (refactor controles mapa)

---

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| omitir flyTo cuando sí debe centrar | Margen generoso en isPointVisibleInViewport |
| regresión en pending-first | Mantener flyTo en filter+pending (es transición explícita) |
