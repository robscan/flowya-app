# Bitácora 026 (2026/02) — Recuperación MapControls (005 / 008 / 009)

**Tipo:** Micro-scope de recuperación (post-rollback)  
**Estado:** Cerrado  
**Archivo tocado:** `components/design-system/map-controls.tsx`

---

## Contexto

Tras el rollback **400271f**, `components/design-system/map-controls.tsx` quedó con una API antigua (orientada a `onViewAll`/`hasVisibleSpots`), mientras que `app/(tabs)/index.web.tsx` ya estaba alineado con las bitácoras **005**, **008** y **009**. Esto generó:

- Mismatch de props (errores de tipos).
- Ausencia del control **“Ver el mundo”** y del estado activo unificado.

Este scope restaura **solo** `map-controls.tsx` al comportamiento canónico documentado, sin modificar la lógica existente del mapa en `index.web.tsx`.

---

## Objetivo

Restaurar `MapControls` para implementar exactamente:

- **005:** Encadre contextual en loop (Spot ↔ Spot+Usuario).
- **008:** Botón 🌍 “Ver el mundo” visible solo sin spot seleccionado.
- **009:** Estados activos unificados por control.

---

## Cambios realizados

### 1) API de MapControls

Se actualizan props y tipos en `components/design-system/map-controls.tsx`:

- `export type ActiveMapControl = 'world' | 'spot' | 'spot+user' | 'location' | null`
- Props nuevas:
  - `onViewWorld?: () => void`
  - `onReframeSpot?: () => void`
  - `onReframeSpotAndUser?: () => void`
  - `hasUserLocation?: boolean`
  - `activeMapControl?: ActiveMapControl`
- Se eliminan definitivamente:
  - `onViewAll`
  - `hasVisibleSpots`

### 2) Botón “Ver el mundo” (008)

- Ícono: `Globe` (lucide-react-native).
- Visible solo si: `selectedSpot == null && onViewWorld`.
- Orden: 🌍 Ver el mundo → Encuadre contextual → 📍 Ubicación.

### 3) Encuadre contextual (005)

- Un solo botón visible solo cuando `selectedSpot != null`.
- Alterna con `useRef` interno:
  - Tap 1 → `onReframeSpot`
  - Tap 2 → `onReframeSpotAndUser`
  - Repite
- Si `hasUserLocation` es `false`, siempre ejecuta `onReframeSpot` (sin alternar).

### 4) Estados activos (009)

Cada control refleja estado activo vía `selected`:

- World: `activeMapControl === 'world'`
- Contextual: `activeMapControl === 'spot' || activeMapControl === 'spot+user'`
- Location: `activeMapControl === 'location'`

El reset de estado activo por pan/zoom permanece en `index.web.tsx`.

---

## Verificación

- `npm run build` termina sin errores.
- Se elimina el error de tipos asociado a `onReframeSpot`/`onReframeSpotAndUser` en `MapControlsProps`.

---

## Rollback

Revert del commit de este micro-scope.

