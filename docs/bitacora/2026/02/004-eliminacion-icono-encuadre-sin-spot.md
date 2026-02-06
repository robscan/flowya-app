# Bitácora 004 (2026/02) — Eliminación del ícono de encuadre contextual sin Spot activo

**Tipo:** Micro-scope / UI  
**Estado:** Cerrado  
**Archivos tocados:** `components/design-system/map-controls.tsx`, `app/(tabs)/index.web.tsx`

---

## Objetivo

Eliminar por completo el ícono / control de encuadre contextual cuando no hay ningún Spot seleccionado. El ícono no debe renderizarse en ese caso; sin lógica muerta, flags latentes ni efectos colaterales. El encuadre automático solo puede existir cuando haya un Spot activo (no se implementa aquí; solo se asegura que sin Spot no exista el control).

---

## Cambios realizados

- **MapControls:** Nueva prop opcional `selectedSpot?: { id: string } | null`. El botón con ícono FrameWithDot (“Ver todos los spots”) se renderiza **solo cuando** `selectedSpot != null` (`showReframe`). Sin spot seleccionado, ese ícono no aparece; solo se muestra el botón de ubicación (Locate).
- **index.web.tsx:** Se pasa `selectedSpot={selectedSpot}` a `MapControls`. No se modificó lógica de selección de Spot, `handleViewAll` ni comportamiento del mapa.
- Sin nuevos estados ni listeners; sin cambios en Search, Create Spot ni comportamiento base del mapa (zoom, pan, gestos).

---

## Criterio de cierre

- Con la app cargada y **sin** Spot seleccionado: el ícono de encuadre **no aparece**.
- Sin warnings ni logs asociados.
- Al seleccionar un Spot: el ícono aparece y el comportamiento existente (Ver todos los spots) se mantiene.
- **npm run build:** OK.

---

## Rollback

Revertir el commit completo del micro-scope. No hay migraciones ni cambios persistentes; el estado previo es recuperable con `git revert <commit>`.
