# SEARCH — No Results → Create Chooser (anti-traición)

**Objetivo:** Evitar que el usuario se sienta traicionado cuando no hay resultados.
**Principio:** "Crear" nunca debe resolver texto y terminar creando un match inesperado (p.ej. una calle homónima).

---

## Disparador

Estado aplica cuando:

- `query.length >= threshold` (p.ej. 3)
- `results.length === 0` (internos + externos)
- `isLoading === false`

---

## UI canónica (chooser explícito)

En vez de "Crear <query>" único, mostrar:

- **Intro condicional:** El mensaje "No hay spots con ese nombre. Puedes crearlo en Flowya:" se muestra solo si `placeSuggestions.length === 0` (centrado).

### A) Sugerencias de texto (ES↔EN) — **@deprecated 2026-02-22**

- Diccionario curado; reintento de búsqueda. Tap = setQuery(suggestion).
- **Estado:** Ocultas en UI (`{false && ...}`). Ver `GUARDRAILS_DEPRECACION`. Reemplazo previsto: `mapPoiResults` (queryRenderedFeatures) en MS-2.

### B) Listado de lugares (Mapbox, con coordenadas)

- Lista de 3–8 sugerencias con coords (searchPlaces, limit 6–8). Cada item: **Nombre** + **Dirección/contexto** (fullName). Tap = crear spot con esas coords. Prohibido CTA único que resuelva texto sin mostrar dirección.

### C) Crear spot aquí (UGC, sin resolver texto)

CTA: **"Crear spot aquí"** — botón pill (tint), subtítulo: Centro del mapa o tu ubicación. Estilo similar a `detailButton` de SpotSheet.

- **Auth:** Sin sesión, el tap abre modal de login; con sesión sigue el flujo (CreateSpotNameOverlay → draft).
- Coordenadas:
  1. Centro del mapa (viewport center) si está disponible
  2. Fallback: ubicación actual

- Nombre:
  - Usar `query` como nombre provisional permitido, pero sin resolverlo.
  - Recomendación UX: hint "Nombre provisional (puedes editarlo)".

---

## Comportamiento al seleccionar (map-first)

- Se mantiene el usuario en el mismo mapa.
- Seleccionar sugerencia o crear nuevo:
  - Cierra buscador
  - Abre SpotSheet en **MEDIUM** del spot creado/seleccionado (contrato `SPOT_SELECTION_SHEET_SIZING`)

- **Al seleccionar sugerencia de lugar (B):**
  - FlyTo a las coordenadas del lugar.
  - Pin de preview en el mapa en esa posición, label = nombre del lugar.
  - Cierra buscador y abre SpotSheet/POISheet según corresponda.

---

## Prohibiciones (guardrails)

- Prohibido: "Crear <query>" que ejecute geocoding silencioso y cree street/address por default.
- Prohibido: crear con coords "inventadas" o "primer match" sin selección explícita.
