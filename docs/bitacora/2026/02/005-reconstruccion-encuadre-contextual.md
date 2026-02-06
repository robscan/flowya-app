# Bitácora 005 (2026/02) — Reconstrucción del encuadre contextual (loop Spot ↔ Spot + Usuario)

**Micro-scope:** B1-MS2  
**Estado:** Cerrado  
**Archivos tocados:** `components/design-system/map-controls.tsx`, `app/(tabs)/index.web.tsx`

---

## Objetivo

Reconstruir el comportamiento del botón de encuadre contextual del mapa como un loop explícito de 2 estados: Tap 1 → solo Spot seleccionado; Tap 2 → Spot + ubicación del usuario; Tap 3 → vuelve a solo Spot. Sin encuadre “ver todos los spots”. Sin lógica heredada incompatible.

---

## Cambios realizados

### Eliminado

- **handleViewAll** en `index.web.tsx`: eliminado por completo (encuadraba todos los spots + usuario).
- **onViewAll** y **hasVisibleSpots** de MapControls: ya no se usan para el botón de encuadre.
- Cualquier dependencia del encuadre contextual en “todos los spots” o en filtros globales.

### Implementado

- **index.web.tsx**
  - **handleReframeSpot:** `flyTo(selectedSpot)` con zoom fijo (SPOT_FOCUS_ZOOM = 15) y duración FIT_BOUNDS_DURATION_MS. Solo se invoca con spot seleccionado.
  - **handleReframeSpotAndUser:** obtiene ubicación del usuario (getCurrentPosition o userCoords); construye bounds con solo `[selectedSpot, user]`; `fitBounds` o `flyTo` si un solo punto. Sin incluir el resto de spots.
  - MapControls recibe `onReframeSpot`, `onReframeSpotAndUser` y `hasUserLocation={userCoords != null}`.

- **map-controls.tsx**
  - Tipo local **ReframeMode** = `'spot' | 'spot+user'`.
  - **nextModeRef** (useRef): indica el modo del próximo tap; se resetea a `'spot'` cuando `selectedSpot` pasa a null (useEffect).
  - **handleReframePress:**  
    - Si `!hasUserLocation` → siempre llama a `onReframeSpot` (no alterna).  
    - Si `hasUserLocation` → alterna: modo `'spot'` → `onReframeSpot`, luego `nextModeRef = 'spot+user'`; modo `'spot+user'` → `onReframeSpotAndUser`, luego `nextModeRef = 'spot'`.
  - Botón de encuadre solo se renderiza cuando `selectedSpot != null` y existen ambos callbacks. accessibilityLabel: "Encuadre contextual".

---

## Criterio de cierre

- Con Spot seleccionado y ubicación activa: Tap 1 → Spot; Tap 2 → Spot + usuario; Tap 3 → Spot (loop).
- Sin ubicación de usuario: el botón siempre encuadra solo el Spot.
- Nunca se encuadran todos los spots.
- **npm run build:** OK.

---

## Rollback

Revert del commit del micro-scope. Sin migraciones ni efectos persistentes.
