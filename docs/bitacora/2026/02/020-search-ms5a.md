# Bitácora 020 (2026/02) — B2-MS5a: Create Spot consume params una vez

**Micro-scope:** B2-MS5a  
**Rama:** `search/B2-MS5a-create-spot-params-una-vez`  
**Objetivo:** Create Spot lee params (name, lat, lng) solo al montar; inicializa estado local; ignora params después.

---

## Qué se tocó

- **app/create-spot/index.web.tsx:**
  - Añadido `name` y `source` al tipo de `useLocalSearchParams`.
  - Introducido `initialParamsRef` (useRef): se rellena **una sola vez** cuando es null con name, lat, lng y parámetros de vista del mapa derivados de params. A partir de ahí los valores usados son los de ese ref; params no se vuelven a leer para inicializar.
  - `initialLatitude`, `initialLongitude`, `initialView*`, `preserveView` y el estado inicial de `title` se derivan de `initialParamsRef.current`, no de params en cada render.
  - `useState(initial.name)` para el título: valor inicial tomado del ref (que a su vez se fijó en el primer render). Sin `useEffect` reactivo a params.

---

## Qué NO se tocó

- Search (index.web), MapLocationPicker, lib. Flujo del wizard (pasos, validación, duplicados).

---

## Criterio de cierre

- Create Spot abierto con name/lat/lng en la URL muestra mapa centrado en coords, pin colocado y nombre prellenado.
- Params no influyen después del primer mount (navegación atrás/adelante o cambio de URL no re-inicializan estado).
- Build limpio.

---

## Rollback

- Eliminar `initialParamsRef` y volver a derivar `initialLatitude`, `initialLongitude`, `initialView*` y `preserveView` directamente de `params` en cada render; quitar `name` del tipo de params; restaurar `useState('')` para title.
