# Bitácora 051 (2026/02) — OL-022: long-press create spot en vNext map

**Rama:** `chore/explore-quality-2026-02-09` (mismo PR del día)  
**Objetivo:** Restaurar long-press en mapa vNext para disparar creación de spot (fix mínimo).

---

## 1) Síntoma

- En Explore vNext (ruta `/`), long-press sobre el mapa no hacía nada.
- Crear spot desde Search CTA sí funcionaba.
- En v0 (`/mapaV0`) long-press sí abre confirmación y luego create-spot.

---

## 2) Causa raíz

- En `MapScreenVNext.tsx`, `useMapCore` recibía `onLongPress: () => {}` (no-op).
- El gesture y el mapa sí disparan el evento (useMapCore ya tenía la lógica de long-press con coords); el handler en VNext simplemente no estaba implementado.

---

## 3) Fix

- **Archivo tocado:** `components/explorar/MapScreenVNext.tsx`.
- Ref `onLongPressHandlerRef` para delegar desde useMapCore (estable) al handler actual.
- `useMapCore(..., { onLongPress: (coords) => onLongPressHandlerRef.current?.(coords) })`.
- `handleMapLongPress`: (1) `requireAuthOrModal(AUTH_MODAL_MESSAGES.createSpot)`; si no auth, return. (2) setSelectedSpot(null), searchV2.setOpen(false), blurActiveElement(). (3) Construir query `lat`, `lng` y si hay mapInstance: mapLng, mapLat, mapZoom, mapBearing, mapPitch. (4) `router.push(\`/create-spot?${query}\`)`.
- useEffect para asignar `onLongPressHandlerRef.current = handleMapLongPress`.
- Import añadido: `useRef` desde React.

Sin modal de confirmación en este fix (paridad mínima: navegación con coords; v0 tiene modal "¿Crear spot aquí?" que se puede añadir después si se desea).

---

## 4) Pruebas

- **Web — logged out:** Long-press en mapa vNext → auth modal, no navegación.
- **Web — logged in:** Long-press en mapa vNext → navegación a `/create-spot?lat=...&lng=...&mapLng=...` y flujo de creación con ubicación prellenada.
- Comprobar que Search CTA "Crear spot" sigue funcionando igual.
