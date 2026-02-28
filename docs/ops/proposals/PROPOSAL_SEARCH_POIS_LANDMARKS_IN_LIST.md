# Propuesta: POIs y Landmarks en la lista principal de búsqueda

**Fecha:** 2026-02-28  
**Contexto:** isEmpty e isSearch actualmente muestran solo Flowya spots en la lista principal. Los POIs/landmarks de Mapbox aparecen solo en isNoResults o en footer "Recomendaciones" cuando `searchMixedRanking` está ON.

**Objetivo:** Incluir POIs (no comerciales) y landmarks en la lista principal de resultados de forma unificada en isEmpty e isSearch.

---

## Principio rector

**Siempre usaremos "spots" para definir lugares.** La distinción entre spots creados en DB y lugares aún no creados es operativa; el usuario no debe notarla. El usuario solo ve un listado con las opciones más atractivas e interesantes que puede visitar. No hay "mis spots" vs "lugares externos" — hay un único listado de spots (creados o por crear).

---

## Estado actual

| Estado     | Lista principal                 | POIs/landmarks Mapbox                                |
|-----------|----------------------------------|------------------------------------------------------|
| isEmpty   | Flowya spots ("Spots cercanos")  | No incluidos                                         |
| isSearch  | Flowya spots                     | Solo footer "Recomendaciones" si searchMixedRanking ON |
| isNoResults | Ningún Flowya                 | Sí, "Lugares recomendados" (placeSuggestions)         |

---

## Opciones de diseño

### Opción A — Lista fusionada (spots como concepto único)

**Idea:** Una sola lista ordenada por atractivo/interés donde spots DB y lugares externos (POIs/landmarks) se presentan igual. El usuario ve "spots" sin distinguir si ya están en su colección o no.

**Ventajas:** UX simple, un solo scroller, modelo mental único.  
**Desventajas:** Requiere modelo unificado (Spot | PlaceResult) internamente; renderItem y ranking cross-fuente.

**Cambios clave:**
1. `searchDisplayResults` pasa a ser `(Spot | PlaceResult)[]` en lugar de `Spot[]`
2. Función de merge: `mergeAndRankSearchResults(spots, placeSuggestions, query)` usando `rankExternalPlacesByIntent` y prioridad spots por defecto
3. `renderItem` recibe union type: Spot → SpotCard, PlaceResult → ResultRow con `onCreateFromPlace`
4. placeSuggestions se fetchean siempre cuando query >= 3 (no solo isNoResults o mixed), y se fusionan en la lista

---

### Opción B — Dos secciones con mismo concepto visual

**Idea:** Mantener lista principal como hoy pero añadir sección fija debajo con spots adicionales (POIs/landmarks). Ambas secciones muestran el mismo tipo de fila; no hay etiquetas que expongan "DB vs externo".

**Ventajas:** Cambios mínimos, modelo Spot intacto.  
**Desventajas:** Dos bloques visuales; el usuario podría preguntarse por qué están separados.

**Cambios clave:**
1. En isEmpty: añadir sección "Lugares cercanos" con POIs de categoría (Mapbox Category API)
2. En isSearch: añadir sección "Lugares recomendados" con placeSuggestions (ya existe como footer; mover a bloque explícito en ListView)
3. Sin merge; cada sección tiene su renderItem

---

### Opción C — Híbrido (A para isSearch, B para isEmpty)

**Idea:** isSearch usa lista fusionada (más valor con query); isEmpty usa dos secciones (spots + POIs por categoría).

**Ventajas:** Balance entre consistencia y complejidad.  
**Desventajas:** Dos patrones distintos según estado.

---

## Propuesta recomendada: Opción C (Híbrido)

### Principio de presentación

**Un solo listado de spots.** Spots DB y lugares externos (POIs/landmarks) se renderizan con la misma fila visual. El tap en un spot ya creado abre la ficha; el tap en un lugar externo abre el flujo Crear spot (operativo, invisible para el usuario como distinción de origen).

### Fase 1: isSearch — Lista fusionada

1. **Extender fuente de datos**
   - placeSuggestions se fetchean cuando: `query >= 3` y `pinFilter === 'all'`
   - Crear `mergeSearchResults(spots, places, query): (Spot | PlaceResult)[]`:
     - **Orden por atractivo/interés:** no "spots primero, luego externos"; ranking unificado que priorice lo más interesante (landmarks, cercanía, relevancia de query). Reutilizar `rankExternalPlacesByIntent` para places; spots mantienen su ranking; intercalar según score global.
     - Dedupe: `dedupeExternalPlacesAgainstSpots` si un PlaceResult tiene coordenadas muy cercanas a un Spot
   - `searchDisplayResults` pasa a ser el resultado del merge

2. **Contrato de render**
   - `SearchResultItem = Spot | PlaceResult` — modelo interno; el usuario solo ve "spots".
   - `renderItem(item: SearchResultItem)`:
     - Si Spot → SpotCard (componente actual)
     - Si PlaceResult → misma fila visual que SpotCard; `onPress` → flujo Crear spot / sheet POI (transparente)

3. **Archivos afectados**
   - `MapScreenVNext.tsx`: lógica merge, fetchear placeSuggestions sin condicionar a isNoResults
   - `SearchOverlayWeb.tsx` / `SearchFloatingNative.tsx` (o SearchSurface): renderItem union type
   - `SearchFloatingProps`: extender para aceptar `renderPlaceItem?: (place: PlaceResult) => ReactNode` si se quiere separar

4. **Feature flag**
   - `searchPoisInMainList` (nuevo) para rollout gradual; cuando ON, aplicar merge en isSearch.

---

### Fase 2: isEmpty — Lista fusionada de spots cercanos

1. **API Mapbox Category Search**
   - Endpoint: `GET https://api.mapbox.com/search/searchbox/v1/category/{category}`
   - Parámetros: `proximity`, `bbox`, `limit`
   - Categoría propuesta: `attraction` o `landmark` (POIs no comerciales, turísticos)
   - Referencia: [Mapbox Search Box Category API](https://docs.mapbox.com/api/search/search-box/#search-box-category)

2. **Nueva función**
   - `searchPlacesByCategory(category: string, opts: { bbox, proximity, limit }): Promise<PlaceResult[]>`
   - Archivo: `lib/places/searchPlacesCategory.ts` (nuevo)
   - Mapear respuesta GeoJSON a `PlaceResult`

3. **Fetch en isEmpty**
   - Cuando `isEmpty` (Search abierto y query vacía)
   - useEffect: `searchPlacesByCategory('attraction', { bbox, proximity, limit: 6 })`
   - Estado: `nearbyPlaces: PlaceResult[]`

4. **UI**
   - **Un solo listado de spots:** merge `defaultItems` (Flowya spots) + `nearbyPlaces` (POIs por categoría) en una lista única ordenada por atractivo/cercanía. Sin etiquetas "Spots cercanos" vs "Lugares cercanos" — una sola sección de resultados.
   - Cada item → misma fila visual; Spot → ficha; PlaceResult → flujo Crear spot
   - Si no hay spots ni lugares, mostrar emptyMessage

5. **Feature flag**
   - `searchNearbyPoisEmpty` para rollout gradual.

---

## Resumen de cambios

| Componente                   | Fase 1 (isSearch)                    | Fase 2 (isEmpty)                              |
|-----------------------------|--------------------------------------|-----------------------------------------------|
| MapScreenVNext              | merge logic, fetch places siempre    | fetch nearbyPlaces por categoría              |
| SearchSurface / Overlays    | renderItem union Spot \| PlaceResult | Lista única merge Flowya + POIs por categoría |
| lib/places                  | —                                    | searchPlacesCategory.ts                       |
| featureFlags                | searchPoisInMainList                 | searchNearbyPoisEmpty                         |

---

## Orden de ejecución sugerido

1. **OL-WOW-F2-001** (Single Search Surface) — cerrar primero para tener SearchSurface unificado
2. **Nuevo OL:** isSearch con POIs/landmarks en lista principal (Fase 1)
3. **Nuevo OL:** isEmpty con "Lugares cercanos" (Fase 2)

---

## Riesgos y mitigación

| Riesgo                           | Mitigación                                                                 |
|----------------------------------|----------------------------------------------------------------------------|
| Ranking subóptimo                | Orden unificado por atractivo/interés; A/B test con searchPoisInMainList   |
| Latencia extra (2 fetches)       | Paralelizar spotsStrategy + searchPlacesPOI cuando query >= 3              |
| Category API sin categoría ideal | Probar `attraction`, `landmark`, `tourism`; fallback a query "Lugares"     |
| Regresión en filtros saved/visited | En saved/visited solo Flowya spots (operativo); ya respetado hoy         |

---

## Criterios de aceptación

**Fase 1**
- Con query >= 3 y pinFilter=all: lista principal muestra un único listado de spots (DB + POIs/landmarks) ordenado por atractivo/interés
- Usuario no distingue visualmente origen; tap en spot DB → ficha; tap en POI → Crear spot (transparente)
- Sin regresión en saved/visited (solo spots Flowya)

**Fase 2**
- Con query vacía: un único listado de spots (Flowya cercanos + POIs por categoría) ordenado por atractivo/cercanía
- Sin etiquetas que expongan "creados vs no creados"; misma fila visual para ambos

---

## Referencias

- [docs/ops/OPEN_LOOPS.md](../OPEN_LOOPS.md) — OL-WOW-F2-001
- [lib/places/searchPlacesPOI.ts](../../lib/places/searchPlacesPOI.ts) — searchPlacesPOI, rankLandmarkSimple
- [lib/places/searchPlaces.ts](../../lib/places/searchPlaces.ts) — PlaceResult, searchPlaces
- [components/explorar/MapScreenVNext.tsx](../../components/explorar/MapScreenVNext.tsx) — rankExternalPlacesByIntent, placeSuggestions
- [Mapbox Search Box Category API](https://docs.mapbox.com/api/search/search-box/#search-box-category)
