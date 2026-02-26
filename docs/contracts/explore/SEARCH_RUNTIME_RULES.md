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

## Core puro recomendado

- `rankSearchResultsByIntent(...)`
- `partitionSearchResultsByFilter(...)`
- `sortByViewportCenter(...)`
- `shouldShowExternalRecommendations(filter)`

## Adapter necesario

- `SearchProvider` (fetch interno/externo)
- `ThemeAdapter` (tokens light/dark)
- `UIAdapter` (render secciones/listas por plataforma)

## Referencias

- `docs/contracts/SEARCH_V2.md`
- `docs/contracts/SEARCH_NO_RESULTS_CREATE_CHOOSER.md`
- `docs/contracts/shared/SEARCH_STATE.md`
- `docs/contracts/shared/SEARCH_INTENTS.md`
- `docs/contracts/shared/SEARCH_EFFECTS.md`
- `docs/bitacora/2026/02/150-search-v2-refresh-por-filtro-y-badge-estado-color.md`
- `docs/bitacora/2026/02/152-search-v2-todos-incluye-visitados-y-titulos-por-filtro.md`
- `docs/bitacora/2026/02/159-search-viewport-reorder-solo-filtros-saved-visited.md`
