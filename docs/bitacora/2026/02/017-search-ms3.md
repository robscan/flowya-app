# Bitácora 017 (2026/02) — B2-MS3: CTA de creación diferenciada (texto)

**Micro-scope:** B2-MS3  
**Rama:** `search/B2-MS3-cta-creacion-diferenciada`  
**Objetivo:** Diferenciar el texto del CTA cuando no hay resultados: caso ambiguo → "Crear spot: {query}".

---

## Qué se tocó

- `app/(tabs)/index.web.tsx`: en el bloque "sin resultados" (cuando hay query y `searchResults.length === 0`), el botón de crear muestra ahora **"Crear spot: {query}"** usando `searchQuery.trim()`. El `accessibilityLabel` del botón usa el mismo texto.
- En MS3 no existe aún resolución de lugar; todo se trata como caso ambiguo. Tras MS4 se podrá mostrar "Crear: {nombre normalizado}" cuando haya lugar resuelto (mismo botón, texto condicional en MS5).

---

## Qué NO se tocó

- La navegación al tocar el CTA (sigue siendo `/create-spot?from=search` sin name/lat/lng hasta MS5).
- Create Spot, geocoding, orden de resultados.

---

## Criterio de cierre

- CTA cuando no hay resultados muestra "Crear spot: {query}".
- Build limpio.

---

## Rollback

- Restaurar el texto del `ButtonPrimary` a "Crear nuevo spot" y `accessibilityLabel` a "Crear nuevo spot" en el bloque `searchNoResults`.
