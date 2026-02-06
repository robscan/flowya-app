# Bitácora 008 (2026/02) — Control de mapa "Ver el mundo"

**Micro-scope:** B1-MS6  
**Estado:** Cerrado  
**Archivos tocados:** `app/(tabs)/index.web.tsx`, `components/design-system/map-controls.tsx`

---

## Objetivo

Añadir un control de mapa dedicado para reencuadrar a vista global (fitBounds(world)), con visibilidad clara (solo cuando no hay card seleccionada) y estado activo que se desactiva al interactuar con el mapa (pan/zoom).

---

## Cambios realizados

### index.web.tsx

- **Constante WORLD_BOUNDS:** bounds globales para Mapbox (límites Web Mercator): `[[-180, -85.051129], [180, 85.051129]]`.
- **Estado y ref:** `activeViewWorld` (useState) y `viewWorldFlyingRef` (useRef) para distinguir animación programática de interacción del usuario.
- **handleViewWorld:** pone `viewWorldFlyingRef.current = true`, `setActiveViewWorld(true)` y `mapInstance.fitBounds(WORLD_BOUNDS, { duration: FIT_BOUNDS_DURATION_MS })`.
- **Listener moveend (reutilizado):** en `onMoveEnd`, si `viewWorldFlyingRef.current` se pone a false (animación de "ver mundo" terminada); si no, `setActiveViewWorld(false)` (usuario movió el mapa).
- **MapControls:** nuevas props `onViewWorld={handleViewWorld}` y `activeViewWorld={activeViewWorld}`.

### map-controls.tsx

- **Props nuevas:** `onViewWorld?: () => void`, `activeViewWorld?: boolean`.
- **Visibilidad:** botón globo solo cuando `selectedSpot == null && onViewWorld` (no se muestra con card seleccionada; Search y Create Spot ya ocultan todo el bloque desde index).
- **Botón "Ver el mundo":** ícono `Globe` (lucide-react-native), `IconButton` con `selected={activeViewWorld}`, orden: primero globo, luego encuadre contextual (si hay spot), luego ubicación.

---

## Criterio de cierre

- Sin card: botón globo visible; con card: no se muestra.
- Al tocar globo: mapa hace fitBounds(world); botón en estado activo (azul).
- Al mover el mapa manualmente: estado activo se desactiva.
- **npm run build:** OK.

---

## Rollback

Revert del commit del micro-scope. Sin migraciones; estado previo recuperable.
