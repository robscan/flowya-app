# Bitácora 114 — Explore: Anti-duplicados, 3D y UX (MS-1 a MS-6)

**Fecha:** 2026-02-22  
**Relación:** Plan Explore Anti-duplicados y UX, [ANTI_DUPLICATE_SPOT_RULES](../contracts/ANTI_DUPLICATE_SPOT_RULES.md)

---

## Resumen

Ejecución de micro-scopes para: 3D visible por defecto, contrato anti-duplicados, match POI-spot con lista completa, detección de duplicados en todos los entry points, modal "Ver spot existente | Crear otro | Cerrar" en 2 pasos, pin visible en pasos draft, y altura sheet draft adaptativa.

---

## MS-1 — 3D visible por defecto

- Toggle `USE_CORE_MAP_STYLES` centralizado en `lib/map-core/constants.ts` (sin depender de .env).
- Default `true`; cambiar a `false` en constants para rollback a estilos FLOWYA Studio.
- Archivos: `lib/map-core/constants.ts`, `MapScreenVNext.tsx`.

---

## MS-2 — Contrato ANTI_DUPLICATE_SPOT_RULES

- Nuevo contrato `docs/contracts/ANTI_DUPLICATE_SPOT_RULES.md`.
- Regla: mismo título normalizado + distancia ≤ 150 m.
- Obligación: todo path de creación llama `checkDuplicateSpot` antes del INSERT.
- Entry points: wizard, handleCreateSpotFromPoi, handleCreateSpotFromPoiAndShare, handleCreateSpotFromDraft.
- Referencia en `docs/contracts/INDEX.md`.

---

## MS-3 — Match POI-spot con lista completa

- En `handleMapClick`: match POI-spot usa `spots` (lista completa) en lugar de `filteredSpots`.
- Evita falsos negativos cuando filtro "Visitados" oculta un spot "Por visitar" cercano al POI.
- Cumple contrato SPOT_SHEET_CONTENT_RULES.

---

## MS-4 — checkDuplicateSpot en flujos POI y Draft

- `handleCreateSpotFromPoi`, `handleCreateSpotFromPoiAndShare`, `handleCreateSpotFromDraft` llaman a `checkDuplicateSpot` antes del INSERT.
- Fail-open: si falla la validación, se permite la creación.
- Archivo: `MapScreenVNext.tsx`.

---

## MS-4b — DuplicateSpotModal (2 pasos)

- Nuevo componente `components/ui/duplicate-spot-modal.tsx`.
- Paso 1: "Ver spot existente" | "Crear otro" | "Cerrar".
- Paso 2: "¿Crear otro spot?" → "Sí, crear" | "Volver".
- Sin botón compartir.
- "Ver spot existente" abre sheet en medium con pin seleccionado (no navega a detalle).
- "Crear otro" permite confirmar creación a pesar del duplicado.
- Archivos: `DuplicateSpotModal.tsx`, `MapScreenVNext.tsx`.

---

## MS-5 — Pin visible en pasos draft

- `previewPinCoords` y `previewPinLabel` priorizan draft cuando `selectedSpot?.id.startsWith("draft_")`.
- Pin visible en "Confirmar ubicación" e "Agregar imagen" (antes solo en Paso 0).
- Archivo: `MapScreenVNext.tsx`.

---

## MS-6 — Altura sheet draft

- `effectiveBodyNeedsScroll = false` para draft con DraftInlineEditor (MEDIUM y EXPANDED).
- Anchor adaptativo: `expandedVisible` limitado a `DRAFT_BODY_HEIGHT_ESTIMATE` (260px) cuando draft.
- `bodyContentWrap` y `bodyScroll` con `flexGrow: 0` para evitar expansión y scroll innecesario.
- Archivo: `SpotSheet.tsx`.

---

## Archivos tocados

| Archivo | Cambios |
|---------|---------|
| `lib/map-core/constants.ts` | USE_CORE_MAP_STYLES = true, DRAFT_BODY_HEIGHT_ESTIMATE |
| `components/explorar/MapScreenVNext.tsx` | DuplicateSpotModal, handleViewExistingSpot, checkDuplicateSpot, match spots, previewPin draft |
| `components/explorar/SpotSheet.tsx` | effectiveBodyNeedsScroll, anchor adaptativo draft, flexGrow: 0 |
| `components/ui/duplicate-spot-modal.tsx` | Nuevo |
| `docs/contracts/ANTI_DUPLICATE_SPOT_RULES.md` | Nuevo |
| `docs/contracts/INDEX.md` | Referencia ANTI_DUPLICATE_SPOT_RULES |
