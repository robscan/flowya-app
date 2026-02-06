# Bitácora 016 (2026/02) — B2-MS2: Separación existente vs no existente (CTA solo sin resultados)

**Micro-scope:** B2-MS2  
**Rama:** `search/B2-MS2-cta-solo-sin-resultados`  
**Objetivo:** Search nunca muestre CTA de crear si hay resultados válidos por title.

---

## Qué se tocó

- `app/(tabs)/index.web.tsx`: eliminado el botón "Crear nuevo spot" que se mostraba **dentro** del bloque cuando `searchResults.length > 0` (debajo de la lista de resultados). El CTA de crear queda **solo** en el bloque cuando `searchResults.length === 0` ("¿No encontraste lo que buscas?" + botón).

---

## Qué NO se tocó

- El texto del CTA (sigue "Crear nuevo spot"; la diferenciación "Crear spot: {query}" / "Crear: {nombre}" es MS3/MS4).
- Create Spot, lib, otros componentes.
- Lógica de búsqueda o de selección de resultados.

---

## Criterio de cierre

- Con resultados válidos: solo lista seleccionable; sin botón crear.
- Sin resultados: solo mensaje + CTA crear.
- Build limpio.

---

## Rollback

- Restaurar el `ButtonPrimary` (onPress={handleCreateSpotFromSearch}, accessibilityLabel="Crear nuevo spot", children "Crear nuevo spot") dentro del `ScrollView` que mapea `searchResults`, justo después del `))}` del map.
