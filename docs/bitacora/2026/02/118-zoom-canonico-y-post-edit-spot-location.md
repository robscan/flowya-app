# Bitácora 118 (2026/02) — Zoom canónico búsqueda + Post-edit siempre ubicación spot

**Fecha:** 2026-02-22  
**Objetivo:** (A) Zoom unificado al seleccionar spot desde card de búsqueda; (B) Tras guardar edición, mapa siempre centrado en ubicación del spot.

---

## A) Zoom canónico desde búsqueda

### Problema

Al seleccionar un spot desde la card de resultados de búsqueda, el mapa hacía `flyTo` con `zoom: 15` y `duration: 800` hardcodeados. El control "Reencuadrar" usaba `SPOT_FOCUS_ZOOM` (17) y `FIT_BOUNDS_DURATION_MS`. Comportamiento inconsistente.

### Solución

En `MapScreenVNext.tsx`, el callback `setOnSelect` de searchV2 usa ahora `SPOT_FOCUS_ZOOM` y `FIT_BOUNDS_DURATION_MS` en `programmaticFlyTo`, igual que el reencuadre.

### Archivos

- `components/explorar/MapScreenVNext.tsx`: `programmaticFlyTo` en setOnSelect con constantes canónicas.

---

## B) Post-edit: siempre mostrar ubicación del spot

### Problema

Tras guardar una edición de spot (especialmente al cambiar ubicación), el mapa podía mostrar la ubicación del usuario en lugar de la del spot. Dos causas:
1. Race: `skipCenterOnUser` dependía de `params.spotId`; si el mapa montaba antes de que los params estuvieran disponibles, se ejecutaba `tryCenterOnUser`.
2. Deep link spotId usaba `fromList` (spots en memoria); si el usuario había cambiado la ubicación en edit, las coords eran obsoletas.

### Solución

1. **skipCenterOnUser:** Fallback leyendo la URL directamente (`window.location.search`) para detectar `spotId=` o `created=` antes de que el router actualice los params.
2. **Deep link spotId:** Siempre fetch del spot en DB en lugar de usar `fromList`; así se usan coordenadas actuales para el `flyTo`.

### Archivos

- `components/explorar/MapScreenVNext.tsx`:
  - `skipCenterOnUser` con fallback URL.
  - Deep link intake para `spotId` siempre vía fetch; `applySpot` actualiza `spots` si hace falta.
  - Dependencias del `useEffect` del deep link: removido `spots` (ya no se usa `fromList`).

### Contratos

- `DEEP_LINK_SPOT.md`: El intake de spotId siempre obtiene datos frescos de DB para encuadre correcto (incl. post-edit con cambio de ubicación).
