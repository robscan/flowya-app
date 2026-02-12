# SEARCH — No Results → Create Chooser (anti-traición)

**Objetivo:** Evitar que el usuario se sienta traicionado cuando no hay resultados.
**Principio:** “Crear” nunca debe resolver texto y terminar creando un match inesperado (p.ej. una calle homónima).

---

## Disparador

Estado aplica cuando:

- `query.length >= threshold` (p.ej. 3)
- `results.length === 0` (internos + externos)
- `isLoading === false`

---

## UI canónica (chooser explícito)

En vez de “Crear <query>” único, mostrar:

### A) Sugerencias (con coordenadas)

- Lista de 3–8 sugerencias con coords (si existen).
- Cada item debe mostrar:
  - **Título**
  - **Tipo** (Landmark/POI/Ciudad/Calle)
  - **Ubicación** (Ciudad, País)

- Acción:
  - Tap en item = **Preview + Crear desde este lugar**
  - Debe ser claro que “esto va a crear un spot con estas coordenadas”.

**Ranking v0 de sugerencias:**

1. `poi_landmark`
2. `poi`
3. `place`
4. `address`
5. `street`

### B) Crear spot nuevo (UGC, sin resolver texto)

CTA: **“Crear spot nuevo aquí”**

- Coordenadas:
  1. Centro del mapa (viewport center) si está disponible
  2. Fallback: ubicación actual

- Nombre:
  - Usar `query` como nombre provisional permitido, pero sin resolverlo.
  - Recomendación UX: hint “Nombre provisional (puedes editarlo)”.

---

## Comportamiento al seleccionar (map-first)

- Se mantiene el usuario en el mismo mapa.
- Seleccionar sugerencia o crear nuevo:
  - Cierra buscador
  - Abre SpotSheet en **MEDIUM** del spot creado/seleccionado (contrato `SPOT_SELECTION_SHEET_SIZING`)

---

## Prohibiciones (guardrails)

- Prohibido: “Crear <query>” que ejecute geocoding silencioso y cree street/address por default.
- Prohibido: crear con coords “inventadas” o “primer match” sin selección explícita.
