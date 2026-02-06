# Bitácora 031 (2026/02) — Search V2 S4: Create Spot (mode="places")

**Micro-scope:** S4 — Create Spot, búsqueda de lugares  
**Rama:** `feat/search-v2-s4-create-spot`  
**Objetivo:** SearchInputV2 always-open en paso 1, motor Mapbox places, selectedPlace + centrado de mapa. Params desde search inicializan selectedPlace sin ocultar el buscador.

---

## Qué se tocó

- **lib/places/searchPlaces.ts:** `searchPlaces(query, opts?)` con Mapbox forward v6; `PlaceResult` (id, name, fullName?, lat, lng, source: 'mapbox'); limit 10–15; opcional proximity/bbox.
- **lib/places/placesStrategy.ts:** `createPlacesStrategy(opts?)` para useSearchControllerV2; un solo batch (nextCursor null, hasMore false).
- **components/design-system/map-location-picker.tsx:** prop **externalCenter** `{ lat, lng } | null`; al cambiar, flyTo + setLngLat (pin en esa posición).
- **app/create-spot/index.web.tsx:** estado **selectedPlace** (PlaceResult | null); inicializado desde params (name, lat, lng) si existen; SearchInputV2 + useSearchControllerV2(mode 'places', defaultOpen true, isToggleable false); lista de resultados cuando query >= 3; onSelect → setSelectedPlace; MapLocationPicker con externalCenter={selectedPlace} y spotTitle con selectedPlace?.name; layout: header, SearchInputV2, resultados (si hay), MapLocationPicker.
- **docs/definitions/search/SEARCH_V2.md:** sección S4 ampliada (params, clear X, no dependencia del flag).
- **docs/bitacora/2026/02/031-search-v2-s4-create-spot.md:** esta entrada.

---

## Contrato params

- **Entrada con params:** `/create-spot?name=...&lat=...&lng=...&source=search` → selectedPlace inicial = `{ id: 'params', name, lat, lng, source: 'mapbox' }`; mapa ya centra con initialLatitude/initialLongitude; SearchInputV2 visible (no ocultar buscador).
- **Clear X:** solo limpia query y resultados; **selectedPlace se mantiene** (pin y ubicación siguen; usuario puede buscar otro o confirmar).

---

## Checklist de cierre

- [ ] `/create-spot` sin params: SearchInputV2 visible always-open.
- [ ] `/create-spot?name=...&lat=...&lng=...&source=search`: SearchInputV2 visible + mapa centrado + selectedPlace inicial.
- [ ] Buscar "Sagrada Familia" (>=3 chars): lista aparece; seleccionar centra mapa y setea selectedPlace.
- [ ] Clear X limpia input y resultados; selectedPlace se mantiene (documentado).
- [ ] No toggle, no filtros, no cierre por tap afuera.
- [ ] Build OK, lint OK.

---

## Rollback

Create Spot no usa `SEARCH_V2_ENABLED`; el paso 1 con búsqueda de lugares es el comportamiento actual. Si se quisiera revertir S4: quitar SearchInputV2/controller/selectedPlace y prop externalCenter; volver al paso 1 solo con MapLocationPicker.

---

## Riesgo y mitigación

- **Estado:** selectedPlace local al paso 1; params leídos una vez (B2-MS5a). externalCenter puede provocar un segundo centrado al montar si ya hay initialLatitude/initialLongitude; el useEffect en MapLocationPicker actualiza lngLat, comportamiento aceptable.
