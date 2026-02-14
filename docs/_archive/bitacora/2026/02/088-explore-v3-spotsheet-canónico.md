# Bitácora 088 (2026/02) — Explore V3: SpotSheet canónico

## Qué se cambió

- **Explore V3 usa SpotSheet canónico**: `spotSheetVariant="legacy"` en lugar de `"v3"`. La pantalla /exploreV3 comparte el mismo motor que / (SpotSheet.tsx: Reanimated + Gesture Handler, 3 estados, drag, scroll único).
- **Sin variante v3**: SpotPeekCardV3Web + SpotSheetV3Web quedan inactivos para Explore V3; se elimina regresión de contratos.
- **Comentarios de contrato** en SpotSheet.tsx y MapScreenVNext.tsx: X dismiss, map->peek, drag 3 estados, scroll único.

## Contratos cumplidos

- peek existe (collapsed del SpotSheet)
- X SIEMPRE cierra/dismiss (onClose → setSelectedSpot(null))
- map pan/zoom → peek (onUserMapGestureStart)
- drag peek ↔ medium ↔ expanded
- scroll único en body (un ScrollView)
- CTAs Guardar/Visitado centrados (SpotSheet ya tenía justifyContent: center)

## Archivos tocados

- `app/exploreV3.web.tsx` — spotSheetVariant="legacy"
- `components/explorar/SpotSheet.tsx` — comentarios contrato
- `components/explorar/MapScreenVNext.tsx` — comentarios contrato
