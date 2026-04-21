# SEARCH_RUNTIME_RULES

Reglas runtime de buscador en Explorar.

## Scope

- Prioridad de resultados y reglas por filtro.
- Separación entre resultados internos y recomendaciones externas.
- Guardrails para evitar mezcla cross-filter y regresiones de UX.

## Reglas canónicas

1. **Filtro `Todos`**
- Orden: spots guardados/visitados -> spots creados -> recomendaciones externas.
- Si faltan resultados de una etapa, promover etapa según estrategia sin ocultar guardados relevantes.

2. **Filtros `Por visitar` / `Visitados`**
- Mostrar solo resultados del grupo interno correspondiente.
- No mostrar recomendaciones externas ni CTA de crear.
- Empty state específico del filtro (sin mezclar con estado global).

3. **Refresh por cambio de filtro**
- Cambio de filtro con query activa fuerza refresh para evitar mezcla (`saved` vs `visited`).

4. **Reorden por viewport**
- Aplicar reorden por viewport solo en `saved/visited`.
- En `Todos`, mantener ranking global definido para evitar inestabilidad.

5. **Theming y tokens**
- Cards y headers deben usar tokens de tema; prohibido hardcode oscuro en modo light.
- Contenedor del panel de búsqueda (adapters web/native): con `Todos`, fondo `searchPanelAllBackground` (gris tenue); con `saved`/`visited`, tokens `countriesPanel*` como en `CountriesSheet` (`getSearchPanelSurfaceColors` en `lib/search/searchPanelSurface.ts`). Ver `docs/definitions/search/SEARCH_V2.md` (superficie del panel).

6. **Interfaz pública de Search (`SearchFloatingProps<T>`)**
- El contrato de entrada/salida para plataforma vive en `components/search/types.ts`.
- Props mínimas operativas:
  - `controller` (`useSearchControllerV2`)
  - `defaultItems`, `recentQueries`, `recentViewedItems`
  - `renderItem`, `getItemKey`
  - `pinFilter`, `pinCounts`, `onPinFilterChange`
- Extensiones de runtime:
  - `defaultItemSections` / `resultSections` para estados compuestos.
  - `tagFilter*` para owner tags.
  - `placeSuggestions` + `onCreateFromPlace` para create-from-place cuando aplica.
  - `placesListFirstSectionHeaderRight` (opcional): slot derecho en la **primera** cabecera de sección con ítems cuando `pinFilter ∈ {saved,visited}` (paridad con `CountriesSheet` / sheet Lugares). Implementación canónica de tipografía + layout: `components/explorar/explore-places-list-section-title-row.tsx`, consumida por `SearchSurface`.

7. **Router de plataforma + layout web**
- `SearchFloating` enruta por plataforma:
  - web -> `SearchOverlayWeb`
  - native -> `SearchFloatingNative`
- Web responsive canónico (`lib/web-layout.ts`):
  - `webSearchUsesConstrainedPanelWidth(windowWidth)` activa ancho limitado en `>= 768`.
  - `WEB_SEARCH_OVERLAY_MAX_WIDTH = 720`, `WEB_PANEL_PADDING_H = 16`.
- El overlay web usa `--app-height` con `100dvh` o fallback `visualViewport.height`; evitar `100vh`.
- En open/close del overlay web:
  - lock de scroll global (`body.style.overflow = "hidden"` + `position: fixed`),
  - restore completo al cerrar (overflow, posición y scrollY previo).
- `touchAction`:
  - backdrop: `none` (evita scroll del fondo),
  - panel: `pan-y` (permite scroll del listado).

## Core puro recomendado

- `rankSearchResultsByIntent(...)`
- `partitionSearchResultsByFilter(...)`
- `sortByViewportCenter(...)`
- `shouldShowExternalRecommendations(filter)`

## Adapter necesario

- `SearchProvider` (fetch interno/externo)
- `ThemeAdapter` (tokens light/dark)
- `UIAdapter` (render secciones/listas por plataforma)

## Troubleshooting

1. **En web aparece espacio en blanco o el teclado “corta” el overlay**
- Verificar que el contenedor use `var(--app-height, 100dvh)` y no `100vh`.
- Confirmar fallback a `visualViewport.height` cuando no hay soporte de `dvh`.

2. **Al cerrar Search, la página queda bloqueada sin scroll**
- Auditar cleanup de `SearchOverlayWeb`:
  - restaurar `position/top/left/right/overscrollBehavior`,
  - restaurar `overflow`,
  - hacer `window.scrollTo(savedScrollY)`.

3. **El listado no hace scroll en web**
- Revisar `touchAction`: si `none` se aplica al contenedor raíz del panel, el gesto no llega al `ScrollView`.
- Mantener `none` solo en backdrop y `pan-y` en panel.

4. **Ancho inconsistente entre Search y sheets en tablet/desktop**
- Confirmar uso de `lib/web-layout.ts` en `SearchOverlayWeb`, `SpotSheet` y `CountriesSheet`.
- No usar `maxWidth` hardcode local fuera de las constantes compartidas.

## Referencias

- `docs/contracts/SEARCH_V2.md`
- `docs/contracts/SEARCH_NO_RESULTS_CREATE_CHOOSER.md`
- `docs/contracts/shared/SEARCH_STATE.md`
- `docs/contracts/shared/SEARCH_INTENTS.md`
- `docs/contracts/shared/SEARCH_EFFECTS.md`
- `docs/bitacora/2026/02/150-search-v2-refresh-por-filtro-y-badge-estado-color.md`
- `docs/bitacora/2026/02/152-search-v2-todos-incluye-visitados-y-titulos-por-filtro.md`
- `docs/bitacora/2026/02/159-search-viewport-reorder-solo-filtros-saved-visited.md`
