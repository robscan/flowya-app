# Bitácora 006 (2026/02) — Jerarquía visual del pin de ubicación del usuario

**Micro-scope:** B1-MS3  
**Estado:** Cerrado  
**Archivo tocado:** `app/(tabs)/index.web.tsx`

---

## Objetivo

Restaurar la jerarquía visual correcta del pin de ubicación del usuario (pin azul) para que siempre se renderice por encima de los pins de spots, sin superponerse a la UI (search, cards, controles).

---

## Problema observado

El pin del usuario se pintaba por detrás de los spots porque en el árbol de hijos del `<Map>` el Marker de `userCoords` se renderizaba **antes** que los `filteredSpots.map`. En react-map-gl el orden de los hijos determina el orden de pintado (los posteriores quedan encima).

---

## Cambio realizado

**Orden de render dentro del Map:** se invirtió el orden de los hijos para que el pin del usuario quede por encima de los spots:

- **Antes:** 1) Marker userCoords, 2) filteredSpots.map → spots encima del usuario.
- **Después:** 1) filteredSpots.map, 2) Marker userCoords → pin del usuario encima de los spots.

No se añadió zIndex ni se movió el pin a otra capa. El contenedor del mapa sigue con zIndex 0 y la UI flotante con zIndex ≥ 10, por lo que el pin del usuario sigue debajo de la UI y solo gana prioridad sobre los demás markers del mapa.

---

## Criterio de cierre

- Con varios spots visibles, el pin del usuario queda siempre por encima.
- El pin no tapa UI flotante (search, cards, controles).
- Sin cambios en el comportamiento del mapa.
- **npm run build:** OK.

---

## Rollback

Revert del commit del micro-scope. Sin efectos persistentes; estado previo recuperable al 100%.
