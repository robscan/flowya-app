# Bitácora 032 (2026/02) — Search V2 S5: Cleanup (mapa solo V2)

**Micro-scope:** S5 — Consolidar Search V2 como única implementación en el mapa; eliminar legacy.  
**Rama:** `chore/search-v2-s5-cleanup`  
**Objetivo:** El mapa usa solo useSearchControllerV2 (mode="spots"), SearchInputV2, SearchResultsListV2, spotsStrategy. Sin flag; legacy eliminado.

---

## Qué se eliminó (legacy)

- **Estado/handlers legacy en `app/(tabs)/index.web.tsx`:**
  - `searchActive`, `searchQuery`, `searchResults`, `orderedSearchResults`, `resolvedPlace`, `pendingCreateFromSearchRef`, `searchInputRef`, `resolvingQueryRef`
  - `showCreateSpotDuplicateWarning`, `duplicateWarningSpotTitle`
  - Handlers: `handleToggleSearch`, `handleClearSearch`, `handleSearchResultSelect`, `handleCreateSpotFromSearch`, `handleCreateSpotDuplicateWarningConfirm`, `handleCreateSpotDuplicateWarningCancel`
- **UI legacy:** input TextInput + botón clear (X) con `backgroundElevated`; lista con `orderedSearchResults`; bloque "¿No encontraste lo que buscas?" + CTA "Crear spot: {query}" / "Crear: {nombre}"; modal de advertencia duplicado (B2-MS8).
- **Lógica legacy:** `resolvePlace` (Mapbox forward para CTA crear); `useEffect` que setea `resolvedPlace`; condicionales `SEARCH_V2_ENABLED` en overlay visible, FAB, strategy, setOnSelect/setOnCreate, navigateToCreateSpotFromSearch, handleMapLongPress.
- **Imports eliminados:** `SEARCH_V2_ENABLED`, `resolvePlace`, `ResolvedPlace`, `checkDuplicateSpot`, `normalizeSpotTitle`, `TextInput`.
- **Archivo eliminado:** `constants/flags.ts` (el flag ya no se usa en ninguna pantalla).
- **Estilos eliminados:** `searchInput`, `searchClearButton` (solo usados por legacy).

---

## Cambios clave en index.web.tsx

- **Strategy:** `spotsStrategyV2` siempre es `createSpotsStrategy(...)` (sin rama por flag).
- **Overlay visible:** `searchOverlayVisible = searchV2.isOpen` (sin condicional).
- **Search overlay:** Una sola rama de JSX: backdrop + SearchInputV2 + área de resultados (historial / Cercanos / Vistos recientemente cuando query < 3; lista V2 + stageLabel cuando query >= 3 y hay resultados; sugerencias + CTA "Crear" cuando 0 resultados).
- **FAB:** Siempre `searchV2.setOpen(true)` / `searchV2.setOpen(false)`.
- **navigateToCreateSpotFromSearch:** Siempre `searchV2.setOpen(false)`; tipo del param `place` genérico `{ name, latitude, longitude }` (ya no `ResolvedPlace`).
- **MapPinFilter** y **MapControls** se mantienen; conectados a V2 vía `pinFilter` y `getFilters` en el controller.

---

## Riesgos y rollback

- **Riesgo:** Cualquier bug en V2 afecta al 100% de usuarios del mapa (no hay fallback legacy).
- **Rollback:** Revert del PR de S5. No hay flag; el único rollback es revertir el commit.

---

## Checklist QA (A–G)

- [ ] **A) Toggle + foco:** FAB Search abre modo search (FAB azul con X), input con focus/teclado. Tap en backdrop cierra search sin borrar texto.
- [ ] **B) Threshold + historial:** query < 3: NO hay resultados; sí aparecen búsquedas recientes si existen.
- [ ] **C) Búsqueda progresiva + etiquetas:** query >= 3: si 0 en viewport → expanded → si 0 → global. Etiquetas "En esta zona / Cerca de aquí / En todo el mapa". No se mezclan stage y fetchMore.
- [ ] **D) Infinite scroll:** Scroll en lista dispara fetchMore (sin duplicados), respeta hasMore/isLoading.
- [ ] **E) Cap pins + hint:** Si hay >500 pins: solo 500 + hint "Hay demasiados resultados, acerca el zoom…".
- [ ] **F) Filtros:** Todos / Por visitar / Visitados afectan resultados (en query/strategy).
- [ ] **G) CTA Crear:** CTA "Crear" se mantiene y funciona (navega a create-spot sin copy legacy).

---

## Build / Lint

- Build OK.
- Lint OK.
