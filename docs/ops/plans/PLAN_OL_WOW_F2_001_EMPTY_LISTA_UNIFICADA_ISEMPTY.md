# Plan: OL-WOW-F2-001-EMPTY — Lista unificada isEmpty

## Contexto

**DoD/AC del OL** ([docs/ops/OPEN_LOOPS.md](../OPEN_LOOPS.md)):

- Lista en `isEmpty` fusiona Flowya spots cercanos + POIs por categoría Mapbox (Category API) en un único listado
- Sin etiquetas "Spots cercanos" vs "Lugares cercanos"; el usuario ve un único listado de spots
- Orden por atractivo/cercanía
- `lib/places/searchPlacesCategory.ts` (nuevo) con categoría `attraction` o `landmark`

**Referencia:** [docs/ops/proposals/PROPOSAL_SEARCH_POIS_LANDMARKS_IN_LIST.md](../proposals/PROPOSAL_SEARCH_POIS_LANDMARKS_IN_LIST.md) (Fase 2)

---

## Estado actual

- **isEmpty:** SearchSurface muestra `defaultItems` (Flowya spots cercanos) con título "Spots cercanos"
- **defaultItems:** proviene de MapScreenVNext como `defaultSpots` — solo Flowya spots ordenados por distancia
- **renderItem:** ya acepta `Spot | PlaceResult` (OL-WOW-F2-001-SEARCH cerrado)

---

## Alcance

### In scope

- Crear `lib/places/searchPlacesCategory.ts` con `searchPlacesByCategory(category, opts): Promise<PlaceResult[]>`
- Mapbox Search Box Category API: `GET /search/searchbox/v1/category/{canonical_category_id}`
- Fetch POIs por categoría cuando `isEmpty` (search abierto, query vacía) y `pinFilter === 'all'`
- Merge `defaultSpots` + `nearbyPlaces` en lista única para isEmpty
- Pasar `defaultItemsOverride` o equivalente a SearchSurface cuando isEmpty con merge
- Sin etiquetas separadas; misma fila visual para Spot y PlaceResult (ya existe en renderItem)
- Dedupe: `dedupeExternalPlacesAgainstSpots` para evitar duplicados
- Orden por atractivo/cercanía (spots primero por distancia, luego places)

### Out of scope

- Feature flag (ejecutar siempre; rollback por revert si hay regresión)
- Cambios en isSearch, isPreSearch, isNoResults

---

## Fases de implementación

### Fase 1: searchPlacesCategory.ts

**Archivo nuevo:** [lib/places/searchPlacesCategory.ts](../../lib/places/searchPlacesCategory.ts)

1. **Función** `searchPlacesByCategory(category: string, opts: SearchPlacesCategoryOptions): Promise<PlaceResult[]>`:
   - Endpoint: `https://api.mapbox.com/search/searchbox/v1/category/${category}`
   - Parámetros: `access_token`, `proximity` (lng,lat), `bbox` (opcional), `limit` (default 6)
   - Mapear GeoJSON FeatureCollection a `PlaceResult[]` (reutilizar estructura de searchPlaces/searchPlacesPOI)
   - Categoría propuesta: `attraction` (POIs turísticos no comerciales). Alternativa: `landmark` si existe en Mapbox

2. **Tipos:**
   ```ts
   export type SearchPlacesCategoryOptions = {
     limit?: number;
     proximity?: { lat: number; lng: number };
     bbox?: { west: number; south: number; east: number; north: number };
   };
   ```

3. **Canonical categories Mapbox:** verificar en docs. Ejemplos: `attraction`, `landmark`, `tourist_attraction`, `food_and_drink`. Probar `attraction` primero.

---

### Fase 2: Fetch en MapScreenVNext

**Archivo:** [components/explorar/MapScreenVNext.tsx](../../components/explorar/MapScreenVNext.tsx)

1. **Estado** `nearbyPlacesEmpty: PlaceResult[]` (similar a placeSuggestions)

2. **useEffect** para fetch cuando isEmpty:
   - Condición: `searchV2.isOpen && searchV2.query.trim().length === 0 && pinFilter === 'all'`
   - Llamar `searchPlacesByCategory('attraction', { proximity, bbox, limit: 6 })`
   - Dedupe: `dedupeExternalPlacesAgainstSpots(nearbyPlacesEmpty, filteredSpots)` antes de merge
   - Setear `nearbyPlacesEmpty` con resultado

3. **Dependencias:** mapInstance (bbox, center), pinFilter, searchV2.isOpen, searchV2.query

---

### Fase 3: defaultItemsOverride para isEmpty

**Opciones:**

- **A)** SearchFloatingProps: añadir `defaultItemsOverride?: (Spot | PlaceResult)[]` — cuando se pasa, SearchSurface usa esto en lugar de defaultItems cuando isEmpty.
- **B)** MapScreenVNext pasa `defaultItems={defaultItemsForEmpty}` donde `defaultItemsForEmpty` es merge de defaultSpots + nearbyPlacesEmpty cuando pinFilter=all; si no, defaultSpots.

**Recomendación:** Opción B — un único prop `defaultItems` que ya acepta `T[]`. Como SearchFloating ya es `Spot | PlaceResult`, `defaultItems` puede ser `(Spot | PlaceResult)[]`. MapScreenVNext calcula:

```ts
const defaultItemsForEmpty = useMemo<(Spot | PlaceResult)[]>(() => {
  if (pinFilter !== "all") return defaultSpots;
  const deduped = dedupeExternalPlacesAgainstSpots(nearbyPlacesEmpty, defaultSpots);
  return mergeSearchResults(defaultSpots, deduped, ""); // query vacía para isEmpty
}, [defaultSpots, nearbyPlacesEmpty, pinFilter]);
```

Y pasa `defaultItems={defaultItemsForEmpty}`.

**Nota:** `mergeSearchResults` ya existe y acepta query vacía; con query vacía el ranking de places usa solo `rankExternalPlacesByIntent` que prioriza poi_landmark > place > poi.

---

### Fase 4: SearchSurface — quitar etiqueta "Spots cercanos" cuando hay merge

**Archivo:** [components/search/SearchSurface.tsx](../../components/search/SearchSurface.tsx)

- Actualmente: `{!hideListTitles ? <Text>Spots cercanos</Text> : null}`
- DoD: sin etiquetas que expongan "creados vs no creados"
- Cambio: cuando defaultItems incluye PlaceResult (merge), ocultar etiqueta. O siempre ocultar en isEmpty para mantener un solo listado sin etiqueta.
- **Decisión:** ocultar etiqueta "Spots cercanos" en isEmpty cuando pinFilter=all (porque habrá merge). Para detectar: pasar `defaultItemsIncludePlaces?: boolean` o `hideDefaultListTitle?: boolean`. Más simple: `hideListTitles` ya existe; cuando pinFilter=all y hay merge, `hideListTitles` podría ser true. Actualmente `hideListTitles = isFilteredPinSearch` (saved/visited). Para isEmpty con merge, queremos ocultar la etiqueta. Añadir: `hideDefaultListTitle = hideListTitles || (pinFilter === 'all' && defaultItems.some(item => !('title' in item)))` — complejo. Alternativa: siempre ocultar "Spots cercanos" en isEmpty cuando defaultItems.length > 0, para unificar el concepto. O: mantener "Spots cercanos" solo cuando es 100% spots (pinFilter saved/visited); cuando pinFilter=all y hay merge, no mostrar etiqueta.
- **Propuesta simple:** añadir prop `defaultListTitle?: string | null` — cuando null, no se muestra. MapScreenVNext pasa `defaultListTitle={pinFilter === 'all' ? null : 'Spots cercanos'}` cuando hay merge, o siempre null para isEmpty si queremos un solo listado sin etiqueta. DoD dice "sin etiquetas" — pasar `defaultListTitle={null}` siempre para isEmpty.

---

### Fase 5: Integración y smoke

1. Verificar que getItemKey y renderItem ya manejan PlaceResult (OK, F2-001-SEARCH).
2. Smoke: query vacía, Search abierto, pinFilter=all → lista única con spots Flowya + POIs attraction.
3. Smoke: tap en spot DB → ficha; tap en POI → Crear spot.
4. Smoke: pinFilter saved/visited → solo spots (defaultSpots sin merge).

---

## Orden de ejecución

1. Fase 1: crear searchPlacesCategory.ts
2. Fase 2: fetch nearbyPlacesEmpty en MapScreenVNext
3. Fase 3: defaultItemsForEmpty merge y pasar a SearchFloating
4. Fase 4: ocultar etiqueta "Spots cercanos" cuando hay merge (o siempre en isEmpty)
5. Fase 5: smoke y bitácora

---

## Riesgos y mitigación

| Riesgo | Mitigación |
|--------|------------|
| Category API sin categoría ideal | Probar `attraction`; fallback a `landmark` si existe |
| Latencia extra en isEmpty | Limit 6; opcional: no fetchear si mapInstance no está listo |
| Regresión saved/visited | Solo merge cuando pinFilter=all |

---

## Criterios de aceptación

- Query vacía, Search abierto, pinFilter=all → lista única con spots Flowya + POIs por categoría
- Sin etiquetas "Spots cercanos" vs "Lugares cercanos"
- Tap en spot DB → ficha; tap en POI → Crear spot
- pinFilter saved/visited → solo spots Flowya
