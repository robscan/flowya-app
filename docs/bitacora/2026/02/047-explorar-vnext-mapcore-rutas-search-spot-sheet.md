# Bitácora 047 (2026/02) — Explorar vNext: MapCore + rutas + Search Floating + Spot Sheet

**Rama:** `feat/explorar-search-floating`  
**Objetivo:** Repo listo para commit/PR. `/` = vNext (MapCore + SearchFloating + SpotSheet + BottomDock). `/mapaV0` = mapa legacy sin cambios. Pins saved/visited + migración 011.

---

## 1) Contexto

- **Rutas:** `app/(tabs)/index.web.tsx` → `MapScreenVNext` (ruta `/`). `app/mapaV0.web.tsx` → `MapScreenV0` (ruta `/mapaV0`). Tab Explorar puede apuntar a una u otra según configuración.
- **MapCore:** `MapCoreView` + `useMapCore`; `onUserMapGestureStart` cuando el usuario hace pan/zoom (no programático) → sheet a peek.
- **Search Floating:** `SearchFloating` en MapScreenVNext; sheet con insets, pill de búsqueda; props desde `components/search/types.ts`; controller `useSearchControllerV2`, defaultItems, recentQueries, recentViewedItems, stageLabel, getItemKey.
- **Spot Sheet:** Tres estados: **peek** (solo header: Compartir, título, cerrar), **medium** (header + descripción corta + imagen + Guardar/Visitado), **expanded** (header + lo anterior + distancia, Por qué importa, dirección, Cómo llegar, Editar). Altura al contenido; scroll solo si supera tope (viewport en expanded). `onSheetHeightChange` para offset de controles. Controles de mapa ocultos en expanded.
- **BottomDock:** Perfil + pill Buscar; logout popover; reemplaza FAB. Visible cuando no hay spot seleccionado y search cerrado.
- **Filtros / perfil:** MapPinFilter: Todos | Guardados | Visitados (counts saved/visited). Perfil en BottomDock; auth/logout sin cambios de flujo.
- **Pins:** `lib/pins.ts`: `getPinsForSpots` (saved/visited), `setSaved`, `setVisited`, `getPinsForSpotsLegacy` (para v0). Migración `011_pins_saved_visited.sql`: columnas `saved`, `visited` en `pins` + backfill desde `status`.
- **Spot desde sheet:** Ningún elemento (imagen, descripción) navega a detalle. Editar → `/spot/[id]?edit=1`. Pantalla spot con `edit === '1'` abre en modo edición.

---

## 2) Archivos tocados

| Archivo | Motivo |
|---------|--------|
| app/design-system.web.tsx | MapPinFilter Guardados; copy y comillas escapadas (lint). |
| app/spot/[id].web.tsx | Query `edit` → `isEditing = edit === '1'`. |
| components/design-system/map-pin-filter.tsx | Valor/label "Guardados"; tipo y counts `saved`. |
| components/design-system/map-pins.tsx | Comentario saved/visited. |
| components/design-system/spot-card.tsx | pointerEvents en style. |
| components/explorar/BottomDock.tsx | **Nuevo.** Dock perfil + Search; pointerEvents en style. |
| components/explorar/MapScreenV0.tsx | getPinsForSpotsLegacy; pinFilter `saved`; counts saved/visited; pointerEvents en style. Comportamiento igual que antes. |
| components/explorar/MapScreenVNext.tsx | MapCore, filtros, SpotSheet, BottomDock, SearchFloating, pins (getPinsForSpots, setSaved, setVisited), sheetState/sheetHeight, onUserMapGestureStart→peek, controles ocultos en expanded, onEdit→?edit=1. |
| components/explorar/SpotSheet.tsx | **Nuevo.** 3 estados, MediumBodyContent/ExpandedExtra, altura viewport, onSheetHeightChange; hooks antes de early return. |
| components/search/SearchFloating.tsx | Sheet insets, pill; pointerEvents en style; tipos desde types. |
| components/search/SearchInputV2.tsx | Quitar import no usado. |
| components/search/index.ts | Export SearchFloatingProps desde types. |
| components/search/types.ts | **Nuevo.** SearchFloatingProps + insets. |
| components/ui/toast.tsx | Ajuste menor. |
| docs/ops/GUARDRAILS.md | Actualización. |
| docs/ops/SYSTEM_MAP.md | Referencia módulos. |
| hooks/useMapCore.ts | onUserMapGestureStart en movestart (!programático). |
| lib/pins.ts | PinState, getPinsForSpots, setSaved, setVisited, getPinsForSpotsLegacy. |
| supabase/migrations/011_pins_saved_visited.sql | **Nuevo.** saved/visited en pins + backfill idempotente. |

---

## 3) Decisiones

- Sheet no navega a detalle; Editar → `?edit=1`.
- Expanded: tope de altura = viewport (no constante fija); controles de mapa ocultos.
- pointerEvents en style (no prop).
- v0: solo getPinsForSpotsLegacy + clave de filtro/counts "saved"; lógica de filtrado igual (pinStatus === 'to_visit' para Guardados).

---

## 4) QA checklist (ejecutar antes de merge)

- [ ] `npm run lint` → 0 errores.
- [ ] **/** (vNext): Mapa carga; filtro Todos | Guardados | Visitados; abrir búsqueda desde dock → sheet con resultados y Cercanos/Vistos recientes; selección cierra y centra pin.
- [ ] **/** Pin 1er tap → sheet MEDIUM (header + descripción + imagen + Guardar/Visitado). Tap header → EXPANDED; tap header → MEDIUM. Pan/zoom → PEEK. 2º tap mismo pin → `/spot/[id]`. Editar → `/spot/[id]?edit=1` en modo edición. Imagen/descripción en sheet no navegan.
- [ ] **/** Sin pins (usuario sin pins): mapa y lista cargan; filtros Guardados/Visitados vacíos; sin crash.
- [ ] **/mapaV0:** Mapa legacy igual que antes; filtros Guardados/Visitados; búsqueda y cards intactos.

---

## 5) Riesgos y rollback

- **Migración 011:** Ejecutar en Supabase antes de prod. Backfill idempotente (solo WHERE saved = false AND visited = false).
- **Rollback:** No mergear o revertir merge. Revertir uso de SpotSheet/BottomDock en vNext; v0 sin cambios de lógica; pins: volver a getPinsForSpotsLegacy + "Por visitar" si se revierte migración.
