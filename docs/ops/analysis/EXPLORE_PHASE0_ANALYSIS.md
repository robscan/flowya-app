# Fase 0 — Análisis crítico: Explorar actual

**Fecha:** 2026-02-13  
**Objetivo:** Informe quirúrgico para escribir Fase 1 — Contratos sin improvisar.

---

## 1. Scope & Entry Points

### Pantallas principales

| Archivo | Ruta | Plataforma | Notas |
|---------|------|------------|-------|
| `app/(tabs)/index.web.tsx` | `/` | Web only | Entry principal → `MapScreenVNext` |
| `app/(tabs)/index.tsx` | `/` | Native | Placeholder "Map available on web" |
| `app/(tabs)/explore.tsx` | Tab Explore | All | Plantilla Collapsible / Design System link |
| `app/mapaV0.web.tsx` | `/mapaV0` | Web only | Legacy → `MapScreenV0` |
| `app/create-spot/index.web.tsx` | `/create-spot` | Web only | Wizard 6 pasos (ubicación→revisión) |
| `app/create-spot/index.tsx` | `/create-spot` | Native | Placeholder |
| `app/spot/[id].web.tsx` | `/spot/[id]` | Web only | Detalle spot + edición + soft delete |

### Clasificación
- **Web-only:** `MapScreenVNext`, `MapScreenV0`, `create-spot`, `spot/[id]`
- **Shared (web + native paths distintos):** `SearchFloating` (→ SearchOverlayWeb / SearchFloatingNative)
- **Native-only:** Ninguno relevante para Explore; native usa placeholders

---

## 2. Surface Map (UI vs Core vs IO)

| Tipo | Archivo | Razón |
|------|---------|-------|
| **UI shell** | `components/explorar/MapScreenVNext.tsx` | Render + layout; ~40 useState; orquestación |
| **UI shell** | `components/explorar/SpotSheet.tsx` | Render sheet; Reanimated + Gesture; layout |
| **UI shell** | `components/explorar/BottomDock.tsx` | Render dock pill + profile |
| **UI shell** | `components/search/SearchOverlayWeb.tsx` | Overlay modal web; viewport/scroll-lock |
| **UI shell** | `components/search/SearchFloatingNative.tsx` | Sheet native search |
| **UI shell** | `components/design-system/map-controls.tsx` | Controles mapa (locate, reframe, view world) |
| **Core candidate** | `hooks/useMapCore.ts` | Estado mapInstance, userCoords, zoom, activeMapControl; handlers long-press, locate, reframe |
| **Core candidate** | `lib/map-core/constants.ts` | FALLBACK_VIEW, WORLD_BOUNDS, LABEL_MIN_ZOOM; hideNoiseLayers, applyGlobeAndAtmosphere, tryCenterOnUser |
| **Core candidate** | `hooks/search/useSearchControllerV2.ts` | query, results, stage, cursor, cache; debounce, cancelación |
| **Core candidate** | `lib/search/spotsStrategy.ts` | Lógica viewport→expanded→global; bbox, filtros, cursor |
| **IO/adapter** | `lib/supabase.ts` | Cliente Supabase |
| **IO/adapter** | `lib/mapbox-geocoding.ts` | reverseGeocode, resolvePlaceForCreate |
| **IO/adapter** | `lib/pins.ts` | getPinsForSpots, setSaved, setVisited |
| **IO/adapter** | `components/explorar/MapCoreView.tsx` | Presentacional: Map + Marker; llama handlers |

**Nota:** `MapCoreView` es presentacional; el estado vive en `useMapCore`. La lógica de spots (refetch, filtros, draft) está en `MapScreenVNext`.

---

## 3. State Topology

### Dónde vive el estado hoy
- **MapScreenVNext:** `spots`, `selectedSpot`, `pinFilter`, `sheetState`, `sheetHeight`, `showCreateSpotConfirmModal`, `pendingCreateSpotCoords`, `isPlacingDraftSpot`, `draftCoverUri`, `showLogoutOption`, `showLogoutConfirm`, `isAuthUser` (+ refs).
- **useMapCore:** `mapInstance`, `userCoords`, `zoom`, `activeMapControl`, `selectedPinScreenPos`.
- **useSearchControllerV2:** `query`, `results`, `sections`, `stage`, `cursor`, `hasMore`, `isLoading`, `isOpen`.
- **Contextos:** `AuthModalProvider`, `ToastProvider`, `ThemeProvider` (react-navigation).

### Duplicaciones y acoplamientos
1. **selectedSpot duplicado:** En MapScreenVNext y pasado a useMapCore (solo id/lat/lng para selectedPinScreenPos).
2. **spots + filteredSpots + displayedSpots:** Tres derivaciones en MapScreenVNext; spotsStrategy recibe getFilteredSpots().
3. **Bbox repetido:** MapScreenVNext pasa getBbox a spotsStrategy y a useSearchControllerV2; ambos leen mapInstance.getBounds().
4. **onSelect/onCreate por ref:** useSearchControllerV2 usa setOnSelect/setOnCreate (refs); MapScreenVNext los configura en useEffect.

### Single source of truth
- **No existe un único SoT.** MapScreenVNext concentra la lógica; selectedSpot, spots y search controller se sincronizan vía callbacks y efectos.
- **Riesgo:** Cambios en un flujo (p. ej. create draft) pueden dejar estado inconsistente si no se actualizan todos los setters.

---

## 4. Critical Flows

### 4.1 Explorar (pan/zoom, pins, select spot)
MapCoreView (Map) → onPinClick → handlePinClick  
→ setSelectedSpot(spot); setSheetState("medium")  
useMapCore: moveend → setSelectedPinScreenPos (para hit area)  
Pan/zoom: onUserMapGestureStart → setSheetState("peek")

**Archivos:** `MapScreenVNext.tsx`, `MapCoreView.tsx`, `useMapCore.ts`, `SpotSheet.tsx`

### 4.2 Search (open, query, results, select)
BottomDock onOpenSearch → searchV2.setOpen(true)  
SearchFloating → SearchOverlayWeb (web): overlay + visualViewport + scroll-lock  
controller.setQuery → debounce → runSearch (spotsStrategy)  
onSelect (ref) → setSelectedSpot, setSheetState("medium"), flyTo, addRecentViewedSpotId

**Archivos:** `SearchFloating.tsx`, `SearchOverlayWeb.tsx`, `useSearchControllerV2.ts`, `spotsStrategy.ts`, `MapScreenVNext.tsx`

### 4.3 Create spot

**A) Long-press en mapa:**
onLongPress (useMapCore) → handleMapLongPress  
→ requireAuthOrModal → CreateSpotConfirmModal o skip → navigateToCreateSpotWithCoords  
→ router.push(/create-spot?lat=...&lng=...&mapLng=...)

**B) Sin resultados en search ("Crear spot nuevo aquí"):**
controller.onCreate → handleCreateFromNoResults  
→ draft local (id draft_xxx), setSelectedSpot(draft), setSheetState("medium"), setIsPlacingDraftSpot(true)  
Tap mapa (handleMapClick) → mueve pin draft  
Confirmar ubicación → setIsPlacingDraftSpot(false)  
DraftInlineEditor: imagen opcional + "Crear spot" → handleCreateSpotFromDraft  
→ insert Supabase, upload cover, refetchSpots, setSelectedSpot(created), setSheetState("expanded")

**Archivos:** `MapScreenVNext.tsx`, `SpotSheet.tsx`, `app/create-spot/index.web.tsx`, `lib/supabase`, `lib/spot-image-upload`

### 4.4 Soft delete
spot/[id].web → handleDeleteSpot  
→ supabase.from("spots").update({ is_hidden: true, updated_at })  
→ router.back()  
refetchSpots (MapScreenVNext, spot/[id]) → .eq("is_hidden", false)

**Archivos:** `app/spot/[id].web.tsx`, `MapScreenVNext.tsx` (refetchSpots), `lib/spot-duplicate-check.ts`, `generateStaticParams`

---

## 5. Bug Inventory (repro + causa probable)

### P0 — Teclado mobile web rompe composiciones
**Repro:** iOS Safari/Chrome: abrir Search → tap input → teclado abre → segunda apertura o scroll con teclado → overlay descolocado o contenido recortado.  
**Mitigaciones actuales (bitácoras 077–078):** Overlay anclado a visualViewport; scroll-lock body (position fixed); sin animación entrada; refresh viewport al abrir.  
**Archivos sospechosos:** `SearchOverlayWeb.tsx` (viewportRect, scroll-lock, touch-action).  
**Riesgo:** visualViewport en iOS puede desincronizarse.

### P1 — Soft delete inconsistente
**Repro:** Eliminar spot → router.back() → mapa aún muestra el pin hasta refetch; o listados/cache muestran spot eliminado.  
**Hipótesis:**  
1) `is_hidden` no está en migraciones 001/002 (OPEN_LOOPS); esquema real puede divergir.  
2) refetchSpots se llama en useFocusEffect; si el usuario vuelve sin focus, no refetch.  
3) Cache de search (TTL 60s) puede devolver resultados con spot ya eliminado.  
**Archivos:** `app/spot/[id].web.tsx` (handleDeleteSpot), `MapScreenVNext.tsx` (refetchSpots), `useSearchControllerV2.ts` (cache).

### P2 — Create spot roto
**Repro (referencia bitácora 082):** CTA "Crear spot nuevo aquí" usaba insert con `user_id`; spots no tiene esa columna → error. Corregido: insert sin user_id.  
**Puntos frágiles:**  
1) `handleCreateFromNoResults` usa centro del mapa, no `resolvePlaceForCreate` (SEARCH_V2.md lo recomienda para query≥3). MapScreenV0 sí usa resolvePlaceForCreate; MapScreenVNext no.  
2) Draft con cover: fetch blob desde draftCoverUri puede fallar en web.  
3) Navegación a `/create-spot` con params largos (mapLng/mapLat/mapZoom) puede truncarse en URLs muy largas.  
**Archivos:** `MapScreenVNext.tsx` (handleCreateFromNoResults, handleCreateSpotFromDraft), `lib/mapbox-geocoding.ts` (resolvePlaceForCreate — no usado en VNext).

### Riesgo de bug fantasma
- Estado disperso sin SoT: cambios en un handler pueden olvidar actualizar selectedSpot, spots o sheetState.
- Condición `selectedSpot != null && !searchV2.isOpen` para SpotSheet: si search se cierra con race, puede quedar overlay en estado raro.

---

## 6. Radix/shadcn Primitive Opportunities

| Componente actual | Primitive recomendado | Archivo actual |
|-------------------|-----------------------|----------------|
| SearchOverlayWeb (overlay full-screen) | Radix Dialog o Sheet | `components/search/SearchOverlayWeb.tsx` |
| SpotSheet (drag + snap 3 estados) | Radix Sheet (o Vaul) | `components/explorar/SpotSheet.tsx` |
| ConfirmModal | Radix Dialog | `components/ui/confirm-modal.tsx` |
| CreateSpotConfirmModal | Radix Dialog | `components/ui/create-spot-confirm-modal.tsx` |
| AuthModal | Radix Dialog | `contexts/auth-modal.tsx` |
| BottomDock logout popover | Radix Popover | `components/explorar/BottomDock.tsx` |
| SearchInputV2 | Combobox si se añade autocomplete | `components/search/SearchInputV2.tsx` |
| Focus trap / Portal | Radix FocusScope, Portal | Varios modales |

**Nota:** `package.json` no incluye vaul ni `@radix-ui` directamente; expo-router trae Radix como dependencia. Para V3 habría que añadir shadcn/ui + Radix explícitos.

---

## 7. Extraction Map (para Fase 2)

### `core/shared/search/*`
- `SearchState`: query, results, stage, cursor, hasMore, isLoading, isOpen — de `useSearchControllerV2`
- `SearchIntents`: setQuery, clear, fetchMore, setOpen, onSelect, onCreate
- `SearchEffects`: runSearch (strategy), cache get/set
- **Hoy en:** `hooks/search/useSearchControllerV2.ts`, `lib/search/spotsStrategy.ts`, `lib/search/normalize.ts`, `lib/search/suggestions.ts`

### `core/shared/visibility-softdelete/*`
- Filtro `is_hidden = false` en queries
- Mutación `update({ is_hidden: true })`
- **Hoy en:** `MapScreenVNext.tsx` (refetchSpots), `app/spot/[id].web.tsx`, `lib/spot-duplicate-check.ts`, `generateStaticParams`

### `core/explore/*`
- `ExploreState`: viewport (zoom, center), selectedSpot, overlayMode (search | spot | none), createSpotDraft, pinFilter
- `ExploreIntents`: tapPin, openSpot, startCreate, dismissOverlay, applyViewport, setPinFilter
- `ExploreEffects`: refetchSpots, persistDraft, mapFocus (flyTo)
- **Hoy en:** `MapScreenVNext.tsx` (mayoría), `useMapCore.ts`, `lib/map-core/constants.ts`

---

## 8. Legacy Delete Candidates

| Archivo/Componente | Condición de borrado |
|--------------------|----------------------|
| `MapScreenV0.tsx` | Cuando Explore V3 cubra el JTBD y `/mapaV0` se retire |
| `app/mapaV0.web.tsx`, `app/mapaV0.tsx` | Idem |
| `getPinsForSpotsLegacy` (lib/pins.ts) | Cuando MapScreenV0 se elimine |
| SpotCard (variante MapScreenV0) | Si V0 usaba SpotCard y V3 no |
| `app/(tabs)/explore.tsx` | Si el tab Explore se unifica con index y se elimina la plantilla |

---

## 9. Open Questions
- **Soft delete:** ¿Existe migración que añada `is_hidden` a spots? OPEN_LOOPS indica que no está en 001/002. Si la columna existe en prod por migración manual, alinear docs/migraciones.
- **CTA Crear desde search:** MapScreenVNext usa centro del mapa; SEARCH_V2.md recomienda resolvePlaceForCreate para query≥3. ¿Se unifica con MapScreenV0 o se deja como está?
- **No blockers for Phase 1 contracts:** Los contratos Search y Explore pueden definirse con el estado actual; las preguntas anteriores no bloquean la redacción de contratos.
