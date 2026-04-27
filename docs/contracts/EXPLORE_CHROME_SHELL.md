# EXPLORE_CHROME_SHELL — Chrome inferior unificado (Explorar)

**Última actualización:** 2026-04-26 (dominancia de selección + header contextual canónico)
**Estado:** ACTIVE
**Owner:** Explore vNext (`MapScreenVNext`), Design System
**Relacionado:** [EXPLORE_SHEET.md](EXPLORE_SHEET.md), [CANONICAL_BOTTOM_SHEET.md](CANONICAL_BOTTOM_SHEET.md), [DESIGN_SYSTEM_USAGE.md](DESIGN_SYSTEM_USAGE.md), [explore/FLOWYA_STATUS_ROW_VISIBILITY.md](explore/FLOWYA_STATUS_ROW_VISIBILITY.md), [explore/FILTER_RUNTIME_RULES.md](explore/FILTER_RUNTIME_RULES.md), [EXPLORE_WEB_DESKTOP_SIDEBAR_CANON.md](EXPLORE_WEB_DESKTOP_SIDEBAR_CANON.md)

## 1. Objetivo

Definir un **único host inferior** para el **chrome de Explorar** (entrada a búsqueda, perfil, acciones de cuenta) y, cuando aplique, el **cuerpo** tipo sheet (lista de bienvenida / recomendados). Sustituye el patrón histórico de **dos hosts mutuamente excluyentes** (banda flotante `ExploreSearchActionRow` vs `ExploreWelcomeSheet` con el mismo row embebido).

## 2. Componentes canónicos

- **`ExploreChromeSearchField`** (`components/design-system/explore-chrome-search-field.tsx`): **única** pieza de UI para la **entrada a búsqueda** en el chrome de Explorar (pastilla + `SearchLauncherField` `variant="onMap"`). **Sin perfil**; el acceso a cuenta es **`ExploreMapProfileButton`** (esquina superior del mapa). Usar este componente en welcome (móvil y **desktop/sidebar**), banda KPI, y camino legacy en `MapScreenVNext` cuando aplique.

- **`ExploreChromeShell`** (`components/design-system/explore-chrome-shell.tsx`): contenedor que garantiza:
  - **Zona chrome** fija al borde inferior del host (misma semántica que la fila de `ExploreChromeSearchField`).
  - **Zona cuerpo** opcional encima del chrome cuando el modo lo requiere (lista cold-start / RPC en filtro **Todos** sin selección).

- **`ExploreWelcomeSheet`** (design-system): implementación del cuerpo + gestos peek / medium / expanded + lista; compone **`ExploreChromeSearchField`** en el bloque peek / cabecera sidebar desktop.

- **`ExploreContextSheetHeader`** (design-system): cabecera canónica compartida por Welcome/Countries. Acciones mínimas: compartir y volver en drilldown. **Sin X de cierre** en superficies base/motivacionales.

- *Compat:* `ExploreSearchActionRow` reexporta `ExploreChromeSearchField` (nombre histórico); nuevas importaciones deben usar **`ExploreChromeSearchField`**.

## 3. Modos de presentación

| Modo | Condición (runtime) | Chrome | Cuerpo sheet |
|------|---------------------|--------|----------------|
| **welcome** | `pinFilter === "all"`, sin spot/POI/países sheet, sin búsqueda abierta, sin overlay create | Entrada Search en sheet / chrome superior según viewport | Visible (peek / medium / expanded) |
| **countries-base** | `pinFilter === "saved" \| "visited"`, sin spot/POI, sin búsqueda abierta, sin overlay create, count > 0 | Entrada Search en sheet / chrome superior según viewport | `CountriesSheet` visible (peek / medium / expanded) |

Reglas de exclusión con otras superficies: alinear con [EXPLORE_SHEET.md](EXPLORE_SHEET.md) §1.2 (Search, CountriesSheet, SpotSheet no se apilan como sheets de contexto adicional sin reglas explícitas).

**Dominancia de selección (2026-04-26):** `selectedSpot` / `poiTapped` siempre domina sobre Welcome/Countries. Al cambiar de `Todos` a `Por visitar`/`Visitados` mientras el usuario consulta un lugar, el runtime no reemplaza el SpotSheet con CountriesSheet; difiere la sheet contextual hasta cerrar la consulta si sigue aplicando. Si una selección viene de búsqueda y está fuera del filtro activo, el pin seleccionado se fuerza visible con su estado real.

## 4. Estados del cuerpo (welcome)

- `peek` | `medium` | `expanded` — misma semántica que [CANONICAL_BOTTOM_SHEET.md](CANONICAL_BOTTOM_SHEET.md) (awareness / decisión / detalle).
- Snap y gestos: `components/explorar/spot-sheet/sheet-logic.ts` (`resolveNextSheetStateFromGesture`), drag en handle/header.

## 5. Snap compartido del sheet inferior (welcome ↔ países)

Un único **nivel mecánico** (`peek` | `medium` | `expanded`) se mantiene en memoria de sesión (`exploreLowerSheetSnap` en `MapScreenVNext`) y se sincroniza con el sheet **activo**:

| Momento | Nivel |
|---------|--------|
| **Primera presentación “fría”** del filtro (sin historial útil de snap en esa transición; p. ej. entrada inicial a KPI con datos) | **`medium`** por defecto para el cuerpo accionable sin cubrir todo el mapa. |
| **Gesto en mapa** (pan/zoom) | **`peek`** — alineado con `collapseExploreWelcomeOnMapGestureRef` / `collapseCountriesSheetOnMapGestureRef`. |
| **Cambio de filtro** (Todos ↔ Por visitar ↔ Visitados) **sin** nuevo gesto de mapa | Se **reutiliza** el último snap guardado: desde **Todos** hacia KPI, el nivel del **welcome** se aplica al **CountriesSheet** al abrirlo; entre `saved`/`visited` con sheet abierto se conserva el estado del sheet actual. |

Persistencia por filtro (`countriesSheetPersistRef`: `open` + estado por `saved`/`visited`) se mantiene; el snap global evita saltos arbitrarios al cruzar Todos ↔ KPI.

## 6. Persistencia al cambiar filtros (welcome)

- Al **salir** de modo welcome (p. ej. Todos → Por visitar / Visitados): el snap compartido ya refleja el último `welcomeSheetState` mientras el welcome estaba visible.
- Al **volver** a modo welcome: restaurar el estado guardado **solo** si el usuario no abrió otra superficie que invalide el contexto (búsqueda fullscreen, Countries abierto, spot seleccionado). Si hay duda, preferir `medium` sobre `expanded` para no tapar el mapa.

## 7. Entrada KPI (Por visitar / Visitados) y sheet de países

- Al pasar de **Todos** a **saved**/**visited** con **al menos un pin** en ese filtro y sin selección activa, el **CountriesSheet** se abre y adopta el **snap compartido** (típicamente alineado al welcome previo).
- Al refrescar / rehidratar en **saved**/**visited** con count > 0, `CountriesSheet` es la superficie base. La antigua banda inferior KPI/FLOWYA/Search no debe aparecer como fallback de filtros KPI.
- Con selección activa, el cambio de filtro no reemplaza el SpotSheet/POI. Si al cerrar la consulta el filtro activo sigue en KPI y hay datos, puede abrirse CountriesSheet como contexto diferido.
- Si el contador del filtro es **0**, no se fuerza la apertura del sheet de países; debe resolverse como empty-state/toast de filtro, no como banda KPI inferior.
- Acciones explícitas dentro del sheet (p. ej. KPI de lugares) pueden seguir llevando a **`expanded`** según el handler actual.
- Si el usuario abre un **SpotSheet** desde el mapa (u otra entrada) mientras el CountriesSheet estaba abierto, al **cerrar** el spot se **restaura** el CountriesSheet (mismo snap y lista); ver [FILTER_RUNTIME_RULES.md](explore/FILTER_RUNTIME_RULES.md) §1c.
- Los botones circulares flotantes de acceso directo a países/lugares y reapertura de Welcome no forman parte del canon: las entradas naturales son filtros, search/chrome, KPI dentro de sheet y navegación de lista.
- Tap en país desde `CountriesSheet` cambia inmediatamente la ruta del sheet a “Lugares en {país}” y mantiene mínimo `medium`; el `fitBounds` programático del mapa no se trata como gesto manual que colapsa a `peek`.

## 8. Paridad web (WR-01)

- Viewport ≥ `tabletMin` (768px): host con ancho máximo `WEB_SHEET_MAX_WIDTH` (`lib/web-layout.ts`), centrado; `webSearchUsesConstrainedPanelWidth`.

## 8b. Desktop ancho (sidebar, producto)

- Viewport ≥ **`WEB_EXPLORE_SIDEBAR_MIN_WIDTH` (1080px)** (`lib/web-layout.ts`): **`webExploreUsesDesktopSidebar`**. Si aplica **welcome** (Todos) o **CountriesSheet** abierto en KPI, el panel deja de ser sheet inferior centrado y pasa a **columna izquierda** de ancho `WEB_EXPLORE_SIDEBAR_PANEL_WIDTH` (400px, panel lateral dedicado; más estrecho que el sheet centrado 720). El **mapa y overlays** viven en `mapStage` (columna derecha, `flex: 1`): el viewport de Mapbox coincide con esa región; `mapInstance.resize()` al cambiar el layout.
- **`ExploreWelcomeSheet`**: prop `webExploreLayout="desktopSidebar"` (lista + **`ExploreChromeSearchField`** en cabecera de la columna).
- **`CountriesSheet`**: prop `webDesktopSidebar` (panel anclado a la columna).
- **`SpotSheet`** (spot o POI): prop `webDesktopSidebar` — misma columna y ancho que welcome/países; sin sheet inferior centrado a 720px.
- **Toast** (`SystemStatusBar`): ancla inferior izquierda compensada con el ancho del panel lateral cuando el sidebar está activo.
- Por debajo de 1080px se mantiene el comportamiento de sheet inferior (§8).
- **Ancho KPI vs listado de lugares (400px ↔ 720px):** cuando el usuario entra al listado de lugares (`countriesSheetListView` no nulo), la columna usa `WEB_EXPLORE_SIDEBAR_PLACES_LIST_PANEL_WIDTH` (720px). El contenedor lateral en desktop usa **`ExploreDesktopSidebarAnimatedColumn`** con `skipEntranceAnimation`: ruta **estática** (`View` con ancho fijo, sin `Animated` en el ancho) para evitar un frame de desfase y recorte con `overflow: hidden`. **`CountriesSheet`** en `webDesktopSidebar` anula el `overflow: hidden` del contenedor tipo sheet móvil en la variante desktop y aplica **`minWidth: 0`** en hosts/cadena flex donde aplica — ver bitácora `337`.
- **Canon ampliado:** variantes de ancho, animaciones, checklist de **MapControls** / capas — [EXPLORE_WEB_DESKTOP_SIDEBAR_CANON.md](EXPLORE_WEB_DESKTOP_SIDEBAR_CANON.md).

## 9. Feature flag (transición)

- `EXPO_PUBLIC_FF_EXPLORE_CHROME_UNIFIED`: activa el ensamblado unificado en `MapScreenVNext`. Default recomendado en rollout: `false` hasta QA; luego `true` y retirada del camino legacy.

## 10. Mapa de implementación

| Archivo | Rol |
|---------|-----|
| `components/design-system/explore-chrome-shell.tsx` | Host unificado (cuando flag ON) |
| `components/design-system/explore-welcome-sheet.tsx` | Sheet lista bienvenida |
| `components/design-system/explore-chrome-search-field.tsx` | Buscador canónico (solo launcher) |
| `components/design-system/explore-search-action-row.tsx` | Alias deprecated → `ExploreChromeSearchField` |
| `components/explorar/MapScreenVNext.tsx` | Orquestación, flags, offsets |
| `lib/explore-map-chrome-layout.ts` o `hooks/useExploreMapChromeLayout.ts` | Cálculo de offsets; `isFlowyaFeedbackVisible` (ver [FLOWYA_STATUS_ROW_VISIBILITY.md](explore/FLOWYA_STATUS_ROW_VISIBILITY.md)) |
