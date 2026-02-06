# Bitácora 018 (2026/02) — B2-MS4: Resolución de lugar (forward geocoding)

**Micro-scope:** B2-MS4  
**Rama:** `search/B2-MS4-resolucion-lugar`  
**Objetivo:** Resolver lugar (nombre canónico + coordenadas) solo cuando hay alta certeza; no resolver si hay ambigüedad.

---

## Qué se tocó

- **lib/mapbox-geocoding.ts:** Añadida función `resolvePlace(query: string): Promise<ResolvedPlace | null>` y tipo `ResolvedPlace` ({ name, latitude, longitude }). Usa Mapbox Geocoding v6 forward (`limit=1`). Token: `EXPO_PUBLIC_MAPBOX_TOKEN` (desde .env). Una llamada por invocación; sin retries; sin cache ni persistencia.
- **app/(tabs)/index.web.tsx:**
  - Estado `resolvedPlace: ResolvedPlace | null` y ref `resolvingQueryRef` para ignorar respuestas obsoletas.
  - `useEffect`: solo cuando `searchResults.length === 0` y `searchQuery.trim() !== ''` se llama a `resolvePlace` tras debounce 400 ms. Si hay resultados o query vacío se limpia `resolvedPlace`. Cleanup cancela timeout y evita aplicar resultado si el query cambió.
  - CTA en bloque sin resultados: si `resolvedPlace` → texto "Crear: {nombre}"; si no → "Crear spot: {query}".

---

## Qué NO se tocó

- Create Spot (no resuelve ni valida; handoff con params en MS5).
- Retries, polling, store, cache, cookies.
- Orden de resultados (MS6), estados vacíos (MS7), anti-duplicados (MS8).

---

## Condiciones respetadas

- Resolución **solo** cuando `searchResults.length === 0` y query no vacío.
- Sin retries ni polling ni persistencia.
- La resolución vive **solo en Search**.
- Alta certeza: un resultado (limit=1); si la API no devuelve un lugar válido, se trata como ambiguo (no se pasa nombre ni coords; el handoff con params se hace en MS5).

---

## Criterio de cierre

- Resolución solo en las condiciones anteriores; CTA muestra "Crear: {nombre}" cuando hay lugar resuelto y "Crear spot: {query}" en caso ambiguo.
- Build limpio.

---

## Rollback

- Revertir cambios en `lib/mapbox-geocoding.ts` (eliminar `resolvePlace`, `ResolvedPlace`, `FORWARD_URL` y tipos forward).
- En `index.web.tsx`: eliminar import de `resolvePlace`/`ResolvedPlace`, estado `resolvedPlace`, ref `resolvingQueryRef`, el `useEffect` de resolución y volver el texto del CTA a solo "Crear spot: {searchQuery.trim()}".
