# Bitácora 092 (2026/02) — Micro-scope 2: Una sola entrada para crear spot (map-first)

**Fecha:** 2026-02-14  
**Micro-scope:** 2 — Una sola entrada (strategy/EXPLORE_UX_MICROSCOPES.md)  
**Objetivo:** Todos los flujos de crear spot = **flujo mínimo** (como búsqueda sin resultados): nombre + ubicación + imagen al final; reverse geocoding una vez para dirección en DB.

---

## Decisión UX

- **Flujo canónico único:** draft en mapa → sheet con nombre + ubicación (ajustar pin) + imagen opcional → “Crear spot”. Sin wizard de múltiples pasos como flujo principal.
- **Entrada principal:** botón **(+)** en el dock → mismo flujo mínimo (draft con centro del mapa, sheet en medium).
- **Otras entradas (mismo flujo):** “Crear spot nuevo aquí” (search sin resultados), long-press en mapa (confirm → draft en ese punto). Todas usan `startDraftCreateSpot(coords, title)` → sheet → `handleCreateSpotFromDraft`.

---

## Entregables

1. **Flujo mínimo unificado**
   - Helper `startDraftCreateSpot(coords, title)`: crea draft local, cierra search, abre sheet en medium en modo “colocar ubicación”. Usado por: dock (+), long-press (confirm), search sin resultados.
   - Tap (+) en dock → auth → `startDraftCreateSpot(getFallbackCoords(), "Nuevo spot")`.
   - Long-press → confirm (o skip) → `startDraftCreateSpot(coords, "Nuevo spot")` (ya no navega a `/create-spot`).
   - Search “Crear spot nuevo aquí” → coords/título desde búsqueda o fallback → `startDraftCreateSpot(coords, title)`.
   - Al confirmar en sheet: `handleCreateSpotFromDraft` → insert mínimo (título, lat, lng, address null) + cover si hay imagen; **reverse geocoding una vez** (`resolveAddress`) → guardar `address` en DB; sheet extended del spot creado.

2. **Reverse geocoding**
   - Tras insert del spot, se llama `resolveAddress(lat, lng)` (Mapbox). Cuando hay resultado, se hace `update({ address })` en `spots`. No bloquea al usuario; la dirección se persiste y se refleja en el sheet cuando llega (actualización de `selectedSpot` en estado).

3. **Post-create**
   - Intake de `params.created` en MapScreenVNext (cuando create-spot wizard se usa por otra ruta): seleccionar spot, sheet expanded. El flujo principal ya no usa ese wizard; el mínimo se hace todo en mapa + sheet.

---

## Archivos tocados

- `components/explorar/BottomDock.tsx`: prop opcional `onCreateSpot`; botón (+) entre perfil y pill de búsqueda.
- `components/explorar/MapScreenVNext.tsx`:
  - `getFallbackCoords`, `startDraftCreateSpot(coords, title)` (flujo mínimo compartido).
  - `handleOpenCreateSpot`: auth + `startDraftCreateSpot(getFallbackCoords(), "Nuevo spot")`.
  - `handleCreateFromNoResults`: mismo flujo vía `startDraftCreateSpot`.
  - Long-press y modal confirm: `startDraftCreateSpot` en lugar de navegar a `/create-spot`.
  - `handleCreateSpotFromDraft`: después del insert, `resolveAddress(lat, lng)` → `update({ address })` en DB; actualiza `selectedSpot` en estado si sigue siendo el spot actual.
  - Intake `params.created` (para compatibilidad si se usa wizard por otro camino); eliminado `navigateToCreateSpotWithCoords` del flujo principal.
- `lib/mapbox-geocoding.ts`: ya existía `resolveAddress` (reverse geocoding); se usa desde MapScreenVNext.

---

## QA manual (checklist)

- [ ] En Explorar el CTA primario para crear spot es el **(+)** en el dock.
- [ ] Tap (+) → (auth si aplica) → **sheet en medium** con draft (nombre + ubicación); se puede ajustar el pin en el mapa; opcional imagen; “Crear spot” confirma.
- [ ] Tras “Crear spot” → **SpotSheet extended** del spot recién creado; la **dirección** aparece cuando el reverse geocoding termina (guardada en DB).
- [ ] Long-press → confirm → mismo flujo (draft en ese punto, sheet).
- [ ] Search sin resultados “Crear spot nuevo aquí” → mismo flujo mínimo.

---

## DoD

- AC del micro-scope; decisión documentada; sin deuda; QA manual.
