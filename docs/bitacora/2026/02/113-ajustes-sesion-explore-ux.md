# Bitácora 113 — Ajustes sesión Explore y UX

**Fecha:** 2026-02-23  
**Relación:** MapScreenVNext, SpotSheet, Search, Create Spot

---

## Cambios documentados

### 1. Fix mapa post-edición

- Tras guardar un spot editado, la cámara encuadra en el spot (no en ubicación del usuario).
- `skipCenterOnUser` condicional cuando hay `params.spotId` o `params.created`.
- Efecto `programmaticFlyTo` para deep link post-edit y post-create.
- Plan: `fix_mapa_post-edición_spot`.

### 2. Placeholder del buscador

- Texto: "Buscar en esta zona del mapa…" (antes "Buscar spots…").
- Indica que la búsqueda opera en la zona visible del mapa.
- Archivos: SearchInputV2, SearchOverlayWeb, SearchFloatingNative.

### 3. Sheet POI unificado con SpotSheet

- POI no agregado usa SpotSheet (modo POI) en lugar de POISheetMedium con Modal/backdrop.
- Misma animación, gestos y contenedor que spot creado.
- Sync `selectedSpot` con `filteredSpots` para mostrar datos actualizados tras edición.
- POISheetMedium deprecado/eliminado.

### 4. Estado de carga al crear spot desde POI

- Al crear spot desde POI (Por visitar o expanded), la sheet muestra loader en lugar de desaparecer.
- El contenido aparece cuando el spot está creado.

### 5. Otros ajustes UX

- Botón "Por visitar" en sheet POI: estado no seleccionado por defecto.
- Crear spot desde POI expanded: no marcar "por visitar" salvo que el usuario lo pulse explícitamente.
- Gap entre título y botón "Por visitar" en sheet POI.
- Sugerencia de búsqueda seleccionada → card medium con flujo POI (flyTo + pin preview).
- Sheets ocultos cuando CreateSpotNameOverlay abierto.
- Nombre del spot en sheet: wrap en vez de ellipsis (nombres largos visibles).
- Desfase corregido: sheet expanded llega al borde inferior.
- Controles: botón crear spot fuera del grupo, se oculta cuando sheet activa.

---

## Archivos principales

- `components/explorar/MapScreenVNext.tsx`
- `components/explorar/SpotSheet.tsx`
- `components/search/SearchInputV2.tsx`
- `components/search/SearchOverlayWeb.tsx`
- `components/search/SearchFloatingNative.tsx`
