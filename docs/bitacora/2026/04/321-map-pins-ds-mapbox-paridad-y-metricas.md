# 321 — Paridad map pins Design System ↔ Mapbox (métricas compartidas y tokens)

Fecha: 2026-04-05  
Tipo: Contrato visual + arquitectura  
Área: `lib/map-core/`, `components/design-system/map-pins.tsx`, `hooks/useMapCore.ts`, `constants/theme.ts`

## Problema que evitábamos

El DS mostraba pins distintos al mapa: tamaños mezclados (círculo `circle-radius` vs sprite compuesto × `makiIconSize`), colores default tomados de `pin.default` / `pin.outline` en lugar de `mapPinSpot.default`, y SVG de por visitar/visitado con hex fijos no ligados al theme.

## Fuentes de verdad (no duplicar)

| Capa | Archivo / token |
|------|-------------------|
| Radios, trazos, maki, plus, labels | `Colors.*.mapPinSpot` en `constants/theme.ts` |
| Círculos + «+» + labels Mapbox | `lib/map-core/spots-layer.ts` |
| Sprites `FLOWYA_PIN_*` | `lib/map-core/pin-status-images.ts` (colores desde `mapPinSpot`, geometría desde métricas) |
| Fórmulas compartidas | `lib/map-core/map-pin-metrics.ts` (`getSpotCircleMetrics`, `getCompositePinMetrics`, `getUserLocationPinSize`, constantes 32/2/1.5) |
| React (markers, DS) | `components/design-system/map-pins.tsx` (`MapPinSpot`, `MapPinLocation`, …) |
| Registro de imágenes con tema mapa | `lib/map-core/style-image-fallback.ts` + `installStyleImageFallback(map, { mapPinPalette })` en `useMapCore` según `isDarkStyle` |

## Cambios aplicados (resumen)

1. **`map-pin-metrics.ts`**: una sola calculadora para círculos default vs pins guardados (compuesto escalado como `icon-size` Mapbox).
2. **`pin-status-images.ts`**: `addPinStatusImage(map, id, palette)`; colores `toVisit`/`visited`; sin hex sueltos.
3. **`MapPinSpot`**: default usa **`mapPinSpot.default.fill`** y borde animado **`default.stroke` → `selected.defaultStroke`**; label default con **`default.labelText` / `labelHalo`** (alineado a bitácoras 268–271); `defaultPinStyle` `plain` | `flowya_unlinked` (círculo + «+»); por visitar/visitado con métricas compuestas; icono Pin/Check siempre visible como en bitmap.
4. **`MAP_PIN_SIZES`**: incluye outer/disc para sprites guardados además de spot/location/create.
5. **Documentación persistente**: `docs/contracts/MAP_PINS_CONTRACT.md` actualizado con checklist anti-regresión.

## Regla para futuros cambios

Antes de tocar estilos de pin en DS o en mapa: leer `MAP_PINS_CONTRACT.md` y comprobar que **cualquier color de pin en mapa** provenga de `mapPinSpot` (no de `pin.*` salvo estados to_visit/visited que usan `pin.planned` / `pin.visited` en paralelo al theme).

## Sanidad

- `npm run typecheck` OK tras los cambios.

## Referencias cruzadas

- Bitácoras **268**, **270**, **271** (color default, Flowya sin POI, label swap).
- Bitácora **305** (pins por visitar / iconos compuestos).
- Contrato: `docs/contracts/MAP_PINS_CONTRACT.md`.
