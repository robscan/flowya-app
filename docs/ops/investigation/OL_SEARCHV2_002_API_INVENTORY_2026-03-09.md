# OL-SEARCHV2-002 — Inventario de superficies API Mapbox

**Fecha:** 2026-03-09  
**Estado:** Fase 1 — Investigación  
**Referencia:** [PLAN_OL_SEARCHV2_002_INVESTIGATION_FIRST_2026-03-08.md](../plans/PLAN_OL_SEARCHV2_002_INVESTIGATION_FIRST_2026-03-08.md)

---

## 1. Inventario de endpoints

| Endpoint | Archivo(s) | Función principal | Estado uso |
|----------|------------|-------------------|------------|
| `search/geocode/v6/reverse` | `lib/mapbox-geocoding.ts` | `resolveAddress`, `resolvePlaceNameAtCoords` | Activo |
| `search/geocode/v6/forward` | `lib/places/searchPlaces.ts`, `lib/mapbox-geocoding.ts` | `searchPlaces`, `resolvePlaceForCreate` | Activo / Dormido |
| `search/searchbox/v1/forward` | `lib/places/searchPlacesPOI.ts` | `searchBoxForward` | Activo |
| `search/searchbox/v1/category/{category}` | `lib/places/searchPlacesCategory.ts` | `searchPlacesByCategory` | **No invocado** |

---

## 2. Llamadas por flujo

### 2.1 Reverse Geocoding (`search/geocode/v6/reverse`)

| Flujo | Disparador | Llamadas estimadas | Notas |
|-------|------------|--------------------|-------|
| **MapLocationPicker** (Create Spot paso ubicación) | Usuario confirma ubicación | 1 por confirmación | `reverseGeocode(lat, lng)` |
| **handleCreateSpotFromDraft** (MapScreenVNext) | Usuario crea spot desde sheet | 1 por spot creado | `resolveAddress` en background, no bloquea UI |
| **resolveAddress para POI** | Usuario crea spot desde tap POI | 1 por spot creado | Mismo patrón que draft |
| **resolvePlaceNameAtCoords** | Fallback nombre en coords | 0 en flujo principal | Posible uso en display; verificar |
| **CJK / locale** | Regiones CJK sin script latino | Hasta 2 por `resolveAddress` | Primera con `types=place,region,country`; fallback sin types |

### 2.2 Forward Geocoding v6 (`search/geocode/v6/forward`)

| Flujo | Disparador | Llamadas estimadas | Notas |
|-------|------------|--------------------|-------|
| **Create Spot (placesStrategy)** | Usuario escribe en buscador (debounce 300ms) | 1 por búsqueda tras debounce | `searchPlaces(q, limit: 12)` |
| **searchPlacesPOI fallback** | Search Box devuelve vacío | 0–1 por búsqueda Explore | Solo si Search Box no devuelve resultados |
| **Cold start: tap lugar semilla** | Usuario toca país/lugar en cold start | 0–1 por tap | `searchPlacesPOI` o `searchPlaces` para resolver coords |
| **resolveSpotLink** (Edit Spot) | Usuario guarda spot editado | 1 por guardado | `searchPlaces(title, limit: 8, proximity, bbox)` |
| **resolvePlaceForCreate** | CTA Crear desde búsqueda | **0** | GeocodingProvider existe pero **no usado en MapScreenVNext** (SEARCH_EFFECTS.md) |

### 2.3 Search Box Forward (`search/searchbox/v1/forward`)

| Flujo | Disparador | Llamadas estimadas | Notas |
|-------|------------|--------------------|-------|
| **Búsqueda Explore** (mode spots) | Usuario escribe query ≥ 3 chars | 1 por búsqueda (debounce 300ms) | `searchPlacesPOI` → `searchBoxForward` |
| **Fallback a Geocoding** | Search Box devuelve vacío o 429 | 0–1 | Cooldown 30s en 429 |

### 2.4 Search Box Category (`search/searchbox/v1/category/{category}`)

| Flujo | Disparador | Llamadas | Notas |
|-------|------------|----------|-------|
| **Empty-state POIs** | Search abierto, query vacía, pinFilter=all | **0** | `nearbyPlacesEmpty` hardcodeado a `[]` en MapScreenVNext. `searchPlacesByCategory` existe pero **no se invoca**. Sustituido por `flowyaPopularSpots` (RPC Supabase). |

---

## 3. Patrones de uso por sesión típica

### Sesión A: Usuario explora y busca

1. Abre Explore → cold start (0 Mapbox; seeds estáticos).
2. Escribe "París" → 1 Search Box forward.
3. Selecciona resultado → 0 (sin resolver coords extra).
4. Escribe "torre eiffel" → 1 Search Box forward (si query ≥ 3).
5. Tap en lugar semilla → 0–1 Search Box o Geocoding (resolver coords).
6. Crea spot desde POI → 1 reverse.

**Total sesión A:** ~2–4 llamadas Mapbox.

### Sesión B: Usuario crea spot (Create Spot)

1. Navega a Create Spot → 0.
2. Escribe "Fundación Joan Miró" (3+ chars) → 1 Geocoding forward (`searchPlaces`).
3. Selecciona lugar → 0.
4. Confirma ubicación (MapLocationPicker) → 1 reverse.
5. Guarda spot → 0 (address ya resuelto en paso 4).

**Total sesión B:** 2 llamadas.

### Sesión C: Usuario edita spot (Edit Spot)

1. Edita título y guarda → 1 Geocoding forward (`resolveSpotLink`).

**Total sesión C:** 1 llamada por edición.

### Sesión D: Usuario busca mucho (edge case)

1. 10 búsquedas en Explore (cada una con debounce) → 10 Search Box.
2. 2 fallbacks a Geocoding por queries sin resultados Search Box → 2 Geocoding.
3. Crea 2 spots → 2 reverse.

**Total sesión D:** ~12–14 llamadas.

---

## 3.1 Patrones que generan más llamadas

| Factor | Impacto | Detalle |
|--------|---------|---------|
| **Búsquedas repetidas** | Alto | Cada query ≥ 3 chars en Explore → 1 Search Box. Sin cache, misma query en viewport similar repite llamada. |
| **Viewport en movimiento** | Medio | Create Spot con bbox/proximity cambia por viewport; cada búsqueda con nuevo bbox = nueva llamada. |
| **Filtro pin** | Bajo | `spotsStrategy` no llama Mapbox; búsqueda externa (searchPlacesPOI) es independiente del filtro. |
| **Cold start → tap semilla** | Medio | Tap en país/lugar semilla puede disparar searchPlacesPOI/searchPlaces para resolver coords reales. |
| **Create Spot paso búsqueda** | Alto | Cada tecleo (tras debounce 300ms) → 1 Geocoding forward. Usuario escribiendo "Fundación Joan" = 2+ llamadas. |
| **Edit Spot + guardar** | Bajo | 1 Geocoding forward por guardado (resolveSpotLink). |
| **Crear spots desde POI/draft** | Medio | 1 reverse por spot. Sesión con 5 spots creados = 5 reverse. |
| **CJK / resolveAddress** | Medio | Hasta 2 reverse por dirección en regiones CJK (primera con types, fallback sin). |
| **Search Box 429** | Medio | Cooldown 30s; si muchas llamadas, fallback a Geocoding = mezcla Search Box + Geocoding. |

---

## 4. Métricas e instrumentación

### 4.1 Cómo usar la instrumentación

Módulo `lib/mapbox-api-metrics.ts` con `recordMapboxApiCall(endpoint, caller)` integrado en:

- `lib/mapbox-geocoding.ts`: resolveAddress, resolvePlaceNameAtCoords, resolvePlaceForCreate
- `lib/places/searchPlaces.ts`: searchPlaces
- `lib/places/searchPlacesPOI.ts`: searchBoxForward
- `lib/places/searchPlacesCategory.ts`: searchPlacesByCategory

**Activación:** `EXPO_PUBLIC_DEBUG_MAPBOX_METRICS=true`

**Inspección:** `globalThis.__flowyaMapboxApiMetrics` o `getMapboxApiMetricsSnapshot()`

**Datos disponibles:** `total`, `byEndpoint`, `byCaller`, `lastCall`

**Límite:** Solo memoria; datos se pierden al recargar. Sin persistencia. Para telemetría productiva ver OL-METRICS-001.

### 4.2 Plan para producir recomendaciones (OL-SEARCHV2-002)

Objetivo: usar la instrumentación para generar recomendaciones concretas de ajustes y cerrar OL-SEARCHV2-002.

| Paso | Acción | Entregable |
|------|--------|------------|
| 1 | Ejecutar sesiones representativas (escenarios A–D de sección 3) con instrumentación activa | Snapshot de `__flowyaMapboxApiMetrics` por sesión |
| 2 | Registrar total + byEndpoint + byCaller de cada sesión (tabla o notas) | Datos brutos |
| 3 | Comparar con estimaciones (sección 3) y umbral (sección 5) | Desviación vs modelo |
| 4 | Contrastar con dashboard Mapbox (si disponible) | Validación cruzada |
| 5 | Redactar informe: (a) evidencia, (b) recomendación optimizar vs no optimizar, (c) si optimizar: ajustes concretos (p. ej. cache L1 en searchPlacesPOI, TTL 5 min; reverse solo-on-confirm) | Informe OL-SEARCHV2-002 |
| 6 | Cerrar OL-SEARCHV2-002 con el informe como evidencia | Bitácora de cierre |

**Escenarios a ejecutar:** Sesión A (explorar+buscar), B (Create Spot), C (Edit Spot), D (edge case muchas búsquedas). Añadir variantes si hay patrones sospechosos (cold start, CJK, etc.).

---

## 5. Estimación de coste y umbral de preocupación

### Pricing Mapbox (referencia)

- **Free tier:** 100.000 requests/mes (Geocoding).
- **Post-free Geocoding:** ~0,75 USD / 1.000 requests.
- **Search Box:** Consultar [docs Mapbox](https://docs.mapbox.com/api/search/search-box/#search-box-api-pricing) para modelo actual.

### Estimación conservadora (sin datos reales)

| Usuarios activos/mes | Sesiones | Llamadas Mapbox/mes | Dentro free tier |
|----------------------|----------|---------------------|------------------|
| 100                  | 500      | 2.000               | Sí               |
| 1.000                | 5.000    | 20.000              | Sí               |
| 5.000                | 25.000   | 100.000             | Límite           |
| 10.000               | 50.000   | 200.000             | No               |

(Asumiendo ~4 llamadas Mapbox por sesión media.)

### Umbral de preocupación sugerido

1. **Coste:** Superar free tier de forma sostenida (p. ej. 2 meses consecutivos > 100k).
2. **Latencia:** P99 de búsqueda > 500 ms de forma recurrente.
3. **429 / rate limit:** Observar cooldowns frecuentes en sesiones reales.
4. **Presupuesto explícito:** Si existe límite de gasto mensual en Mapbox, usarlo como umbral.

### Conclusión preliminar

Con uso bajo/medio, free tier cubre. La investigación debe **cuantificar consumo real** con instrumentación antes de optimizar.

---

## 6. Código no usado / limpia

1. **resolvePlaceForCreate** + GeocodingProvider: exportados pero no usados en MapScreenVNext. Create Spot usa `searchPlaces` vía placesStrategy.
2. **searchPlacesByCategory**: implementado pero `nearbyPlacesEmpty = []`. No genera llamadas; potencial dead code.
3. **Cooldown 429** en searchPlacesPOI: 30s; reduce picos pero no consumo base.

---

## 7. Recomendación preliminar

**No implementar cache/optimización hasta tener datos.**

1. **Instrumentar** llamadas por endpoint en sesiones de prueba (dev/staging).
2. **Registrar** volumen real durante 1–2 semanas (o simular sesiones representativas).
3. **Comparar** con umbral de preocupación (presupuesto, límites Mapbox).
4. **Decidir:** Si no hay problema de coste ni latencia → cerrar OL como "no requiere acción". Si hay problema → definir scope acotado de intervención (L1 cache, TTL, etc.) según plan PLAN_OL_SEARCHV2_002_API_EFFICIENCY.

---

## 8. Próximos pasos

- [x] Instrumentación mínima (contadores por endpoint).
- [ ] Ejecutar sesiones de prueba siguiendo plan 4.2 y registrar consumo.
- [ ] Redactar informe con recomendaciones de ajustes concretas.
