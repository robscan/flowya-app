# Bitácora 055 (2026/02) — OL-028: No reload + no camera jump (Create Spot)

**Rama:** `chore/explore-quality-2026-02-09`  
**Objetivo:** (1) Navegación long-press → create-spot sin full reload (SPA). (2) En create-spot sin params de mapa, cero camera jump.

---

## 1) Causa (pruebas reales)

- **V3:** Long-press → confirm → create-spot provocaba full reload (no SPA). Se usaba `router.push(\`/create-spot?${query}\`)` (string), que en web puede forzar recarga.
- **V2:** Abrir /create-spot sin params hacía que el mapa “recentrara” ligeramente. MapLocationPicker en onMapLoad, cuando no hay preserveView ni initialCoords, llamaba a `tryCenterOnUser(map)`, que hace `flyTo` al usuario → jump.

---

## 2) Fix

**A) MapScreenVNext.tsx**
- `navigateToCreateSpotWithCoords`: dejar de construir query string y usar `router.push({ pathname: '/create-spot', params })` con objeto de params (lat, lng, mapLng, mapLat, mapZoom, mapBearing?, mapPitch? como strings). Navegación client-side sin reload.

**B) MapLocationPicker**
- En `onMapLoad`: cuando `!preserveView` y `!hasInitialCoords`, no llamar a `tryCenterOnUser`. El mapa se queda en `initialViewState` (FALLBACK_VIEW) sin flyTo posterior → cero jump.

---

## 3) Pruebas

1. **V3:** En `/`, long-press → confirmar → Crear spot. Create spot abre **sin** reload (misma sesión, sin refresh de página).
2. **V2:** Abrir `/create-spot` sin query params. El mapa **no** se recentra (sin salto perceptible; vista estable en FALLBACK_VIEW).
3. **V1:** Abrir `/create-spot?lat=...&lng=...&mapLng=...&mapLat=...&mapZoom=...`. preserveView sigue aplicado; cámara correcta.
