# Bitácora 024 (2026/02) — B2-MS9: Limpieza y cierre BLOQUE 2 — Search

**Micro-scope:** B2-MS9  
**Rama:** `search/B2-MS9-cierre`  
**Objetivo:** Revisar params y estados; sin residuos; rollback definido; cerrar BLOQUE 2 sin deuda.

---

## Revisión params y estados

- **Search (index.web.tsx):** Params enviados a Create Spot: `name`, `lat`, `lng`, `source=search` (caso resoluble) o solo `source=search` (ambiguo). No se leen params en el mapa; solo se envían. Estado de Search: `searchQuery`, `searchActive`, `resolvedPlace`, `resolvingQueryRef`, `showCreateSpotDuplicateWarning`, `duplicateWarningSpotTitle`, `pendingCreateFromSearchRef`. Todos con uso definido; sin estados huérfanos.
- **Create Spot (create-spot/index.web.tsx):** Params leídos una vez al montar vía `initialParamsRef`: `name`, `lat`, `lng`, `mapLng`, `mapLat`, `mapZoom`, `mapBearing`, `mapPitch`. Tipo de `useLocalSearchParams` incluye `name` y `source`. Sin lectura reactiva de params; sin residuos.
- **Lib:** `resolvePlace` y `ResolvedPlace` usados solo en Search; `checkDuplicateSpot` y `normalizeSpotTitle` usados en Search (MS8) y en Create Spot (duplicados al crear). Sin código muerto añadido en BLOQUE 2.

---

## Qué se tocó en B2-MS9

- Solo esta bitácora de cierre y documento de rollback. No se modificó código.

---

## Rollback por rama (deshacer por micro-scope)

| Rama | Revertir / descartar |
|------|----------------------|
| `search/B2-MS0-fuente-verdad-search` | Eliminar `docs/bitacora/2026/02/014-search-ms0.md`. |
| `search/B2-MS1-auditoria-hardening-search` | Eliminar `docs/bitacora/2026/02/015-search-ms1.md`. |
| `search/B2-MS2-cta-solo-sin-resultados` | Restaurar botón "Crear nuevo spot" dentro del ScrollView cuando `searchResults.length > 0`. |
| `search/B2-MS3-cta-creacion-diferenciada` | Restaurar texto del CTA a "Crear nuevo spot" en el bloque sin resultados. |
| `search/B2-MS4-resolucion-lugar` | Revertir `lib/mapbox-geocoding.ts` (quitar `resolvePlace`, `ResolvedPlace`) y en `index.web.tsx` quitar estado/efecto/CTA diferenciada por resolución. |
| `search/B2-MS5-handoff-search-create-spot` | Restaurar `handleCreateSpotFromSearch` a navegación única a `/create-spot?from=search`. |
| `search/B2-MS5a-create-spot-params-una-vez` | En Create Spot: quitar `initialParamsRef`, volver a derivar initial* de `params` en cada render y `useState('')` para title. |
| `search/B2-MS6-prioridad-viewport` | Quitar `orderedSearchResults` y usar `searchResults` en el `.map()` de la lista con query. |
| `search/B2-MS7-estados-vacios` | Restaurar bloque query vacío a un único ScrollView con `defaultSpots.map` sin estado vacío "No hay spots cercanos". |
| `search/B2-MS8-anti-duplicados-soft` | Quitar import checkDuplicateSpot/normalizeSpotTitle, estado y ref de advertencia, modal y handlers; restaurar navegación directa en `handleCreateSpotFromSearch`. |

Para deshacer todo el BLOQUE 2: volver a la rama anterior a la primera de Search (p. ej. `main` o `scope/cleanup-shadow-deprecated-v1`) y no incorporar las ramas `search/B2-MS*`.

---

## Criterio de cierre

- Params y estados revisados; sin residuos detectados.
- Rollback documentado por rama.
- BLOQUE 2 cerrado sin deuda técnica.

---

## Cierre BLOQUE 2

BLOQUE 2 — Search (FLOWYA) queda cerrado con los micro-scopes MS0–MS9 ejecutados, bitácoras 014–024 y ramas correspondientes. Search: fuente de verdad documentada, CTA solo sin resultados, CTA diferenciada, resolución de lugar (forward geocoding), handoff con params, Create Spot consumiendo params una vez, prioridad viewport, estados vacíos canónicos y anti-duplicados soft. Gobierno: un MS por rama, build limpio y bitácora por cada uno.
