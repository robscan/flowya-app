# EXPLORE_SHEET — Contract (Single Sheet, Multi-Mode)

**Última actualización:** 2026-02-09
**Owner:** Explore vNext (`/`)
**Status:** ACTIVE (source of truth)

> Objetivo: Unificar Search y Spot en **un solo Sheet** (3 estados) para evitar overlays frágiles, glitches de scroll/drag y problemas con teclado.
> Este contrato define: estados, modos, layout, eventos, z-index y comportamiento esperado (web + mobile).

---

## 1) Principios (no negociables)

1. **Un solo contenedor**: `ExploreSheet`.
2. `ExploreSheet` tiene **3 estados**: `collapsed | medium | expanded`.
3. `ExploreSheet` tiene **modes**: `search | spot`.
4. **Search NO se implementa como overlay** si rompe scroll/drag o crea espacio blanco.
5. Con teclado abierto: UI debe ser **keyboard-safe** (lista visible, sin tapar contenido).
6. Animaciones/drag: **safe-by-default** (si hay riesgo de regresión, se desactiva animación/drag antes de romper interacción).
7. **Motion:** duraciones, easing y snap se definen en el spec canónico **MOTION_SHEET.md** (mismo directorio).

### 1.1) Sheet gestures unified (implementación actual)

- **SpotSheet** = 3 estados (collapsed | medium | expanded) + drag/snap según MOTION_SHEET. Anchors: collapsed content-aware, medium/expanded % viewport.
- **SearchSheet (SearchFloating)** = 2 estados: **closed** (pill en dock) y **open_full** (sheet fullscreen). Entrada/salida programática (translateY) + **drag-to-dismiss** desde handle/header.
- **Drag solo en handle/header:** nunca en el body/lista. El body tiene scroll propio; el gesto de arrastre del sheet se limita al área de handle + header para evitar conflicto con scroll.
- **Cuando Search está abierto:** SpotSheet no se renderiza (condición `selectedSpot != null && !searchV2.isOpen` en MapScreenVNext). No se usa pointer-events en un sheet oculto; se evita montar SpotSheet para que no intercepte taps.

---

## 2) Modelo mental

- `ExploreSheet` es el “contenedor de contexto” que se acopla al mapa.
- El mapa siempre existe al fondo.
- El contenido cambia por `mode`:
  - `mode="search"`: top bar estilo Apple Maps + lista
  - `mode="spot"`: header (share + título + cerrar) + contenido spot

---

## 3) Estados (state machine)

### Estados permitidos

- `collapsed`
- `medium`
- `expanded`

### Reglas por estado

#### `collapsed`

- **Se ve flotando**, ancho completo, como “barra plegada” (similar a search plegado).
- En `mode="spot"` muestra **solo header**:
  - share
  - título (1 línea ideal, 2 líneas máx)
  - close

- En `mode="search"`:
  - muestra la **top bar** (input + close en una línea)
  - opcionalmente puede mostrar 0–1 fila de “recientes” (solo si cabe sin romper).

#### `medium`

- Altura ajustable dentro de un rango (ver sección “layout”).
- Contenido visible + scroll donde aplique.
- En `mode="search"`: lista principal de resultados/recentes/vistos.
- En `mode="spot"`: resumen + acciones principales (p. ej. guardar/visited/share) + preview de contenido.

#### `expanded`

- Altura ajustable dentro de un rango mayor.
- Debe permitir scroll sin que haya “doble scroll” o contenido encimado.

---

## 4) Modes

### `mode="search"`

**Top bar (obligatorio):**

- Search input + botón cerrar en **una sola línea**.
- Clear “x” **dentro del input** cuando hay texto.
- Focus state: **fondo del contenedor** (no línea azul visible).
  - Si la línea/ring no se puede eliminar: mismo color del fondo (invisible).

- Perfil al lado del buscador (no en chips). _(Se define en contract de TopBar; aquí se soporta su slot.)_

**Contenido:**

- Con query vacía:
  - mostrar “Cercanos” (defaultItems) y/o sugerencias por zona.

- Con `< 3 chars`:
  - mostrar “Búsquedas recientes” + “Vistos recientemente”.

- Con `>= 3 chars`:
  - resultados o “sin resultados” + CTA crear (si aplica según reglas del producto).

**Keyboard-safe:**

- Lista se desplaza/ajusta con teclado (safe-area + keyboard).
- Nunca queda tapada por el teclado.

### `mode="spot"`

**Header (obligatorio, siempre visible en collapsed/medium/expanded):**

- share
- título
- close

**Contenido:**

- summary en medium
- full (o más completo) en expanded
- Reglas de contenido y sheet única: ver [SPOT_SHEET_CONTENT_RULES.md](SPOT_SHEET_CONTENT_RULES.md)

**Regla clave:**

- Al **pan/zoom** del mapa: sheet colapsa a `collapsed` (sin cambiar el spot seleccionado).

---

## 5) Entradas (props) del componente

> Nota: esto es contrato conceptual; el nombre real de props puede variar, pero el comportamiento NO.

### Props mínimas

- `mode: 'search' | 'spot'`
- `state: 'collapsed' | 'medium' | 'expanded'`
- `onRequestStateChange(nextState)`
- `onClose()`
  - En `mode="spot"`: limpia selección (selectedSpot = null).
  - En `mode="search"`: cierra búsqueda (isOpen=false) o vuelve a `mode="spot"` si hay spot seleccionado (definir por pantalla).

- `onDragStateChange?(...)` (opcional)
- `topInset`, `bottomInset` (safe area)
- `keyboardInset` (si aplica)

### Datos por mode

#### Search mode data

- `query`, `onChangeQuery`
- `recentQueries`
- `recentViewedItems`
- `defaultItems`
- `results`
- `renderItem`, `getItemKey`
- `emptyState` (mensajes)
- `ctaCreate` (label + handler si aplica)

#### Spot mode data

- `spot: { id, title, ... }`
- `onShare()`
- `onToggleSaved()` (mantener comportamiento actual)
- `onToggleVisited()` (mantener comportamiento actual)

---

## 6) Salidas (events) obligatorias

- `onClose` (close icon)
- `onRequestStateChange` (drag o taps según diseño)
- `onPanZoomMap` (evento del mapa hacia la pantalla) → colapsa a `collapsed` si `mode="spot"`
- `onFocusSearch` / `onBlurSearch` (si aplica)

---

## 7) Layout & medidas (reglas)

- `collapsedHeight`: fija o casi fija (solo header/topbar). Implementación SpotSheet: 96 px.
- `mediumHeight`: rango (min–max) controlado. Implementación: ~60% del viewport (anchor snap).
- `expandedHeight`: rango (min–max) controlado. Implementación: ~90% del viewport (anchor snap).
- Anchors para drag/snap: ver MOTION_SHEET.md; SpotSheet usa translateY + 3 anchors (collapsed px, medium/expanded %).

**Reglas de scroll**

- No usar scroll global “porque sí”.
- `medium/expanded` pueden tener scroll **en contenido**, no en contenedor completo si eso causa doble scroll.
- Evitar gaps raros y contenido encimado:
  - spacing por tokens
  - safe-area consistente
  - no “magic numbers” sin documentar.

---

## 8) Z-index & capas

Orden recomendado (top → bottom):

1. `ExploreSheet` (interactivo)
2. Top bar / Perfil / Chips (si están dentro o por encima del sheet según composición final)
3. Controles de mapa (si aplican) — nunca deben quedar tapados por el teclado
4. Mapa

---

## 9) Compatibilidad web/mobile (obligatorio)

- Web:
  - evitar “overscroll blank space” (no overlay frágil)
  - focus ring: no visible (o invisible con mismo color del fondo)

- Mobile:
  - keyboard-safe
  - drag gesture no debe romper tap targets
  - safe-area correcto

---

## 10) Anti-regresión (tests manuales mínimos)

1. Abrir search → no hay espacio blanco al drag desde extremos.
2. Teclado abierto → lista visible (no tapada).
3. Focus input → sin línea azul visible (o invisible).
4. Seleccionar spot → sheet modo spot.
5. Pan/zoom mapa con spot seleccionado → sheet colapsa a header.
6. Segundo tap pin/hit-area → navegación a `/spot/[id]` (no se rompe).
7. Ruta legacy removida: `/` es el único entrypoint de Explore en runtime activo.

---

## 11) Notas de implementación (hygiene)

- No crear versiones duplicadas del sheet.
- Si se necesita extraer piezas:
  - `ExploreTopBar`
  - `ExploreSpotHeader`
  - `ExploreSearchList`
  - `ExploreSpotContent`
    Todas deben vivir en design system o en carpeta Explore con decisión explícita y plan de migración.
