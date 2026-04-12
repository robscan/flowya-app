# EXPLORE_WEB_DESKTOP_SIDEBAR_CANON — Sidebar desktop (≥1080) + map stage

**Última actualización:** 2026-04-12  
**Estado:** ACTIVE (canon de producto + implementación)  
**Relacionado:** [EXPLORE_CHROME_SHELL.md](EXPLORE_CHROME_SHELL.md) §8–8b, `components/explorar/ExploreDesktopSidebarAnimatedColumn.tsx`, `components/explorar/MapScreenVNext.tsx`, `lib/explore-map-chrome-layout.ts`, [`layer-z.ts`](../components/explorar/layer-z.ts)

---

## 1. Objetivo

Unificar el **panel lateral izquierdo** en Explorar web (viewport ≥ `WEB_EXPLORE_SIDEBAR_MIN_WIDTH`) para que:

- Existan **variantes de ancho** fijas y acotadas (no anchos arbitrarios).
- El **contenido** sea intercambiable (misma “carcasa”, distinto cuerpo): bienvenida, países/KPI, detalle spot/POI.
- Las **animaciones de entrada/salida** no provoquen **parpadeo blanco**, recortes ni mapa desincronizado.
- Los **controles del mapa** sigan siendo **usables y clicables** en la columna derecha (`mapStage`).

---

## 2. Componente anfitrión

| Pieza | Rol |
|-------|-----|
| **`ExploreDesktopSidebarAnimatedColumn`** | Única envoltura del panel lateral. Props: `panelWidth`, `animationKey`, `skipEntranceAnimation`, `onStageWidthAnimationFrame`. |
| **`mapStage`** | Columna derecha `flex: 1`: **todo** el mapa Mapbox + overlays (filtros, controles, FLOWYA cuando aplica) vive **aquí**, no encima del sidebar. |

**Regla:** El sidebar **no** debe renderizar `MapCoreView`; solo contenido de app (sheets).

---

## 3. Variantes de ancho (canon)

Definidas en `lib/web-layout.ts` (nombres orientativos):

| Variante | Ancho | Uso |
|----------|-------|-----|
| **KPI / default** | `WEB_EXPLORE_SIDEBAR_PANEL_WIDTH` (400px) | Welcome, SpotSheet, Countries en modo KPI/resumen. |
| **Listado lugares** | `WEB_EXPLORE_SIDEBAR_PLACES_LIST_PANEL_WIDTH` (720px) | CountriesSheet en vista listado (`countriesSheetListView` presente). |

**Transición 400 ↔ 720:** usar **`ExploreDesktopSidebarStaticColumn`** (`skipEntranceAnimation: true`): ancho **fijo** sin animar con `Animated.Value` en el contenedor. Motivo documentado en código: `overflow: hidden` en la variante animada **recortaba** un frame al cambiar ancho (contenido ancho + host estrecho).

---

## 4. Comportamiento de entrada y salida

### 4.1 Cuándo animar ancho 0 → w

Solo cuando el panel lateral **aparece desde cero** (p. ej. primera vez que el layout pasa a sidebar y se desea feedback). En la práctica actual, **`skipEntranceAnimation` está activado** en `MapScreenVNext` para evitar glitches al cambiar filtros/sheets.

**Canon recomendado:**

- **Entrada “suave”** opcional: una sola animación de **opacidad** o **slide** del contenido interno, **no** del ancho del contenedor si eso compite con `overflow: hidden` y el mapa.
- **Salida:** preferir **desmontaje** o `display: none` coherente con el estado de Explorar; no dejar columnas fantasma con `pointer-events` activos.

### 4.2 Parpadeo blanco (flash)

Causas típicas a vigilar (no son parches por pantalla, sino **checklist**):

1. **Fondo:** `mapStage` usa `backgroundColor` del tema; durante `resize` del mapa un frame puede mostrar fondo claro — alinear color con el estilo Mapbox o usar color de mapa coherente en dark/light.
2. **Mapbox `resize`:** Cualquier cambio de ancho del `mapStage` debe disparar **`map.resize()`** tras layout (patrón **doble `requestAnimationFrame`** ya usado en sidebar estático).
3. **`overflow`:** `hidden` en el contenedor lateral durante animación de ancho corta contenido y puede verse como “flash” o franja blanca al redibujar.
4. **Orden de capas:** Evitar que un hijo del sidebar con fondo opaco cubra transientemente el borde del mapa sin intención.

---

## 5. Contenido por modo (misma columna)

Orden de prioridad de render en el panel (simplificado):

1. **Spot / POI** (`SpotSheet` con `webDesktopSidebar`).
2. **CountriesSheet** (`webDesktopSidebar`).
3. **ExploreWelcomeSheet** (`webExploreLayout="desktopSidebar"`).

**Cabecera FLOWYA:** cuando `isFlowyaSidebarHeaderVisible`, la fila FLOWYA + pastilla puede vivir en la **cabecera del sidebar** (no sobre el mapa). Ver `computeExploreMapChromeLayout` y `EXPLORE_CHROME_SHELL.md`.

---

## 6. Map controls en desktop (QA / depuración)

**Ubicación:** `MapControls` se renderiza **dentro de `mapStage`**, posición absoluta inferior derecha (`styles.controlsOverlay`).

**Visibilidad:** `areMapControlsVisible` en `computeExploreMapChromeLayout` — con sidebar activo suele ser `true` salvo bloqueos (`searchV2Open`, `createSpotNameOverlayOpen`, u hoja expandida en layout móvil; en desktop las sheets laterales suelen forzar `expanded` sin ocultar controles de la misma forma).

### 6.1 Orden Z (canon)

Definido en `components/explorar/layer-z.ts`:

- **`FILTER` (14) > `MAP_CONTROLS` (10)**  
  La franja superior de filtros es **más alta** que los controles del mapa. Eso es correcto **solo en la banda superior**; el contenedor del filtro tiene `left: 0; right: 0` pero **no** debe extenderse verticalmente hasta cubrir los controles inferiores.

**Si los controles “no responden” en desktop:**

1. Inspeccionar en DevTools **qué elemento** recibe el `click` (overlay transparente, sheet, scrim, o capa de búsqueda).
2. Confirmar `pointerEvents` en ancestros: overlays usan `box-none` donde aplica; evitar un `View` full-screen con `pointerEvents: 'auto'` sobre el `mapStage`.
3. Confirmar que **`mapControlsOverlayMounted`** es true y **`areMapControlsVisible`** true; si la opacidad animada está en 0, el usuario percibe controles “muertos”.
4. Verificar que **Search** fullscreen u otros modales** no dejen una capa invisible** al cerrar.

*(Este apartado es la base para trabajo en rama; los fixes concretos no forman parte del contrato.)*

---

## 7. Cambios al contrato

Cualquier nuevo modo de panel lateral o nuevo ancho debe:

1. Añadir constante en `web-layout.ts`.
2. Actualizar **`ExploreDesktopSidebarAnimatedColumn`** solo si el comportamiento de ancho lo justifica; preferir **columna estática** para cambios de ancho frecuentes.
3. Añadir entrada en **`docs/bitacora/`** y, si aplica, en `OPEN_LOOPS.md`.
