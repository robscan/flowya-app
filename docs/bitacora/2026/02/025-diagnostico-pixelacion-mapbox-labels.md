# Bitácora 025 (2026/02) — Diagnóstico: pixelación de labels del mapa base (Mapbox)

**Tipo:** Diagnóstico (solo lectura). No se aplicaron fixes ni se modificó código.

---

## Objetivo

Identificar el punto exacto donde se altera indirectamente el render canónico de Mapbox Web y provoca pixelación en los labels de calles del mapa base.

---

## 1. Contenedores padres del `<Map />`

**Jerarquía verificada:**  
`html > body > #root > Stack > (tabs) > Tabs > index > View.mapScreenRoot.map-screen-root-dvh > Map`

- **Archivo:** `app/(tabs)/index.web.tsx` — L832–836: el `<Map />` es hijo directo de un `View` con `styles.mapScreenRoot` y `className="map-screen-root-dvh"` (solo en web).
- **Estilos del contenedor:** `mapScreenRoot` (position absolute, inset 0, width 100%); `map` (flex 1, width/height 100%).
- **No se encontraron** en ese contenedor: `transform`, `will-change`, `filter`, `backdrop-filter`, `contain`, ni `opacity < 1`. Ningún componente que envuelva el mapa aplica esas propiedades.
- **Excepción — atributo `inert` (L328–333):** El nodo `mapRootRef` recibe `inert=""` cuando `!isFocused`. Algunos navegadores pueden cambiar composición o render de subárboles inertes. Si el pixelado se ve solo con el mapa visible (tab activo), `inert` no aplica; si ocurre al cambiar de tab y volver, podría ser relevante.

---

## 2. Setup web / viewport

**app/+html.tsx:**
- Meta viewport: `width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, shrink-to-fit=no`
- Estilos inline: `html,body{min-height:100%}#root{min-height:100%;height:auto;display:flex;flex:1}body{overflow-y:auto;overflow-x:hidden}`

**Por qué puede afectar:** `maximum-scale=1` y `user-scalable=no` bloquean el zoom. En dispositivos de alta densidad, el navegador puede escalar toda la página como bitmap, haciendo que el canvas de Mapbox se vea pixelado. Afectaría a toda la página, no solo a Mapbox.

**styles/viewport-dvh.css** — clase `.map-screen-root-dvh` (aplicada al padre directo del mapa):

- `overflow: hidden` — Crea nuevo bloque de formato y en muchos navegadores un nuevo stacking context; puede promover el contenedor a capa de composición. La promoción y el aislamiento del canvas hijo pueden provocar subpixel rounding o un tratamiento distinto del antialiasing.
- `height: 100vh` / `100dvh` — En viewports con tamaño fraccionario o alta DPI, estas unidades pueden dar dimensiones no enteras en píxeles; un contenedor con altura no entera puede forzar redondeos en el canvas hijo y afectar el suavizado de texto y líneas.

---

## 3. Estilo de Mapbox

- mapStyle: `mapbox://styles/mapbox/dark-v11` y `mapbox://styles/mapbox/light-v11`. Estilos estándar; no hay fuentes ni glyphs custom. No hay evidencia de que el estilo sea la causa.

---

## 4. Capas globales

- Overlays (filterOverlay, cardOverlay, etc.) son hermanos del mapa, no lo envuelven. No hay animaciones de layout ni transiciones que envuelvan el mapa.

---

## Resumen: archivos y capas sospechosas

| Archivo / capa | Qué puede degradar el antialiasing |
|----------------|-------------------------------------|
| `styles/viewport-dvh.css` — `.map-screen-root-dvh` | `overflow: hidden` (posible promoción a capa, stacking context) y `height: 100vh/100dvh` (dimensiones no enteras, subpixel rounding) en el contenedor directo del mapa |
| `app/+html.tsx` — meta viewport | `maximum-scale=1, user-scalable=no` puede provocar escalado de la página como bitmap en alta DPI, afectando al canvas |
| `app/(tabs)/index.web.tsx` — atributo `inert` | Solo si el pixelado se relaciona con cambiar de tab y volver; en tab activo no aplica |

---

## Declaración

Se encontraron alteraciones plausibles: las de `viewport-dvh.css` (overflow + unidades de viewport) y las del meta viewport en `+html.tsx`. El resto del código no muestra propiedades (transform, filter, will-change, opacity < 1) aplicadas al contenedor del mapa que expliquen por sí solas la degradación. El origen no parece estar en componentes de spots, Search ni Create Spot.

Si tras revertir o aislar estos puntos el pixelado continúa, el origen podría estar fuera del repo (navegador, dispositivo, extensiones o build de Expo/React Native Web).
