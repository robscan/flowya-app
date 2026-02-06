# Bitácora 030 — Fix scroll en Spot Detail y Create Spot (web)

## Problema

En web, el scroll vertical estaba desactivado en Spot Detail y Create Spot. El usuario no podía desplazarse para ver todo el contenido (descripciones largas, campos del wizard, etc.).

## Causa raíz

1. **ScrollViewStyleReset (expo-router):** El reset global aplica `body { overflow: hidden }`, lo que impide que el documento haga scroll cuando el contenido supera el viewport.
2. **Layout flex:** En la cadena de contenedores flex, faltaba `minHeight: 0` para que el ScrollView pudiera recibir una altura acotada y habilitar overflow interno.
3. **ScrollView sin altura explícita:** Algunos ScrollViews no tenían `style={{ flex: 1 }}` ni `contentContainerStyle` con `flexGrow: 1`, necesarios para que el contenido pueda crecer y activar el scroll.

## Qué se ajustó

### 1. Override en app/+html.tsx

Se añadió un bloque de estilos que reemplaza el comportamiento del reset por defecto:

- `html, body { min-height: 100% }` — altura mínima del viewport
- `#root { min-height: 100%; height: auto; display: flex; flex: 1 }` — #root puede crecer con el contenido
- `body { overflow-y: auto; overflow-x: hidden }` — permite scroll vertical cuando el contenido es más alto que el viewport

### 2. Spot Detail (components/design-system/spot-detail.tsx)

- **rootWebScroll:** `minHeight: 0` solo en web, para que el contenedor flex deje que el ScrollView gestione el overflow.
- **scrollView:** `flex: 1` para que el ScrollView ocupe el espacio disponible.
- **scrollContentGrow:** `flexGrow: 1` en `contentContainerStyle` para que el contenido pueda superar la altura del viewport.

### 3. Create Spot (app/create-spot/index.web.tsx)

- **flex:** `minHeight: 0` para la cadena de contenedores flex.
- **stepWithFixedBar:** `minHeight: 0`.
- **scrollView:** nuevo estilo con `flex: 1` aplicado a todos los ScrollViews del wizard.
- **scrollContentWithBar:** `flexGrow: 1` para que el contenido pueda crecer.

## Por qué no se revirtió el bloqueo de zoom

- El meta viewport (`maximum-scale=1`, `user-scalable=no`) se mantiene igual.
- `touch-action: manipulation` sigue en todos los botones.
- Los estados pressed de los botones no se modificaron.

El cambio es solo en el manejo del scroll; la UX de zoom y gestos táctiles permanece igual.

## Archivos tocados

| Archivo | Cambio |
|---------|--------|
| app/+html.tsx | Override de estilos para body overflow-y auto y #root height auto |
| components/design-system/spot-detail.tsx | rootWebScroll, scrollView, scrollContentGrow, minHeight 0 |
| app/create-spot/index.web.tsx | scrollView, flexGrow, minHeight 0 en flex y stepWithFixedBar |
| docs/bitacora/2026/01/030-fix-scroll-web.md | Esta bitácora |

## Validación

- [ ] Scroll funciona con teclado visible (Create Spot)
- [ ] Scroll funciona sin teclado
- [ ] Mapa sigue interactivo (MapLocationPicker, Spot Detail)
- [ ] Overlays (botones flotantes) siguen en position absolute y funcionan bien
