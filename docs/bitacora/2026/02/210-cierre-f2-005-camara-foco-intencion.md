# 210 — Cierre OL-WOW-F2-005 Cámara/foco por intención

Fecha: 2026-02-28  
Tipo: cierre operativo / OL-WOW-F2-005

## Contexto
OL-WOW-F2-005: comportamiento determinista por modo (discover/inspect/act), anti-jitter, refactor controles mapa.

## Implementación

### Fase 1 — discover
- Estabilidad de viewport sin auto-moves agresivos. tryCenterOnUser en load aceptable.

### Fase 2 — inspect
- `isPointVisibleInViewport(map, lng, lat, marginPx)` en lib/map-core/constants.
- flyTo solo si spot no visible en viewport (search, pin, filter pending, pin status change).

### Fase 3 — act
- Wrapper `flyToUnlessActMode`: omite programmaticFlyTo cuando `createSpotNameOverlayOpen || isPlacingDraftSpot`.
- Congelar recuadres durante create/edit/placing.

### Fase 4 — anti-jitter + docs
- Auditoría: no hay flyTo+fitBounds encadenados en mismo handler.
- MAP_RUNTIME_RULES: regla 0 actualizada con modos e implementación.

### Fase 5 — refactor controles mapa
- **Globe:** toggle entre GLOBE_ZOOM_WORLD (4) y GLOBE_ZOOM_INITIAL (10), mantiene posición.
- **3D:** siempre activo, sin toggle.
- **Location:** toggle 3 estados (ubicación → norte → cámara antes de norte).
- **Crear spot:** oculto solo botón flotante MapPinPlus en overlay; entry points (long-press, CTA search, BottomDock) intactos.

## Criterios de aceptación
- [x] Mini QA 1: discover — cambio filtro sin pending, pan/zoom estable.
- [x] Mini QA 2: inspect — flyTo solo si spot no visible.
- [x] Mini QA 3: act — no flyTo durante Paso 0 o placing draft.
- [x] Anti-jitter verificado.
- [x] Controles mapa refactorizados.

## Archivos relevantes
- lib/map-core/constants.ts (GLOBE_ZOOM_*, isPointVisibleInViewport)
- hooks/useMapCore.ts (handleViewWorld, handleLocate, programmaticFlyTo)
- components/design-system/map-controls.tsx
- components/explorar/MapScreenVNext.tsx (flyToUnlessActMode)
- docs/contracts/explore/MAP_RUNTIME_RULES.md

## Resultado
- OL-WOW-F2-005 cerrado. Cámara por intención operativa.
