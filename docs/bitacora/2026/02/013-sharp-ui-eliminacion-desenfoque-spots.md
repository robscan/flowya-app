# Bitácora 013 (2026/02) — Sharp UI: eliminación de desenfoque en spots

**Tipo:** Limpieza técnica y performance  
**Estado:** Cerrado  
**Archivos tocados:** `components/design-system/map-pins.tsx`, `app/(tabs)/index.web.tsx`

---

## Causa del desenfoque

- **Opacidad &lt; 1 en labels de pins:** En `MapPinSpot`, el texto del label usaba `labelOpacity = selected ? 1 : 0.9`, aplicando opacidad 0.9 cuando el spot no estaba seleccionado. Eso podía percibirse como menor nitidez o suavizado en los textos.
- **Posicionamiento en sub-píxel:** Las coordenadas `map.project()` (x, y) son flotantes. El overlay del hit area del pin seleccionado usaba `left` y `top` con esos valores sin redondear, pudiendo favorecer anti-aliasing y sensación de menor nitidez en algunos entornos.

---

## Qué se eliminó

- **map-pins.tsx:** Variable `labelOpacity` y opacidad condicional en el label. El texto del pin usa siempre `opacity: 1`. Se mantienen `fontWeight` y `color` según estado selected.
- **index.web.tsx:** Al aplicar `selectedPinScreenPos` al estilo del `selectedPinHitArea`, se usan valores enteros: `left: Math.round(selectedPinScreenPos.x) - SELECTED_PIN_HIT_RADIUS`, `top: Math.round(selectedPinScreenPos.y) - SELECTED_PIN_HIT_RADIUS`.

---

## Confirmación

- UI sharp en pins y textos de spots, sin efectos cosméticos añadidos.
- Sin sombras, blur, boxShadow, filter, animaciones ni transiciones nuevas.
- Limpieza técnica y de rendimiento; no cambio de diseño.
