# Bitácora 090 (2026/02) — Explore: deep link, post-edit y share (Apple Maps vibe)

**Fecha:** 2026-02-14  
**Objetivo:** Canonizar Explore (mapa) como “hogar”; post-edit y compartir llevan a mapa + SpotSheet en estado definido por origen. Contrato de URL único.

---

## Contexto

- **Regla producto:** Edición al guardar/eliminar → usuario vuelve a **Explorar (mapa)** con SpotSheet mostrando el spot afectado. Compartir debe usar **deep link que abre Explorar + SpotSheet**, no SpotDetail standalone.
- **UX Apple Maps:** Map-first; detalle como overlay/sheet; jerarquía mínima.

---

## Implementado

### 1. Contrato de URL

- **Base:** `/(tabs)` (ruta del mapa, MapScreenVNext).
- **Query:** `spotId=<uuid>` y `sheet=medium|extended`.
- **Post-edit (guardar):** `sheet=extended` → sheet en estado **expanded**.
- **Compartir:** `sheet=medium` → sheet en estado **medium** (más pequeño que expanded).

Documentación: `docs/contracts/DEEP_LINK_SPOT.md`.

### 2. Módulo y uso

- **`lib/explore-deeplink.ts`**
  - `getMapSpotDeepLink(spotId, sheet?)` — default `extended` (post-edit).
  - `getMapSpotShareUrl(spotId)` — genera URL con `sheet=medium`.
- **Post-edit:** `app/spot/edit/[id].web.tsx` — tras guardar OK → `router.replace(getMapSpotDeepLink(spot.id))`.
- **Share:** `lib/share-spot.ts` — usa `getMapSpotShareUrl(spotId)` en lugar de `/spot/${spotId}`.
- **Intake:** `MapScreenVNext` — `useLocalSearchParams` lee `spotId` y `sheet`; aplica selección + `setSheetState('expanded'|'medium')`; fuerza `pinFilter='all'` para que el spot no se limpie; limpia params con `router.replace('/(tabs)')` (defer con `setTimeout(0)`).

### 3. FlyTo y sheet

- El `flyTo` de Mapbox dispara `movestart`; en `useMapCore` eso llamaba `onUserMapGestureStart` → sheet a peek. Se añadió `programmaticFlyTo` en el hook y se usó en selección desde búsqueda.
- En **deep link** (post-edit/share) se **no** hace flyTo: prioridad a que el sheet quede en expanded/medium; el mapa no se centra automáticamente en el spot para evitar colapso del sheet.

### 4. Eliminación de spot

- Tras eliminar (soft delete) el usuario ya volvía a `/(tabs)`; sin cambios en este scope.

---

## Archivos tocados

| Área        | Archivos |
|------------|----------|
| Contrato   | `docs/contracts/DEEP_LINK_SPOT.md` |
| Deep link  | `lib/explore-deeplink.ts` (nuevo), `lib/share-spot.ts` |
| Post-edit  | `app/spot/edit/[id].web.tsx` |
| Intake     | `components/explorar/MapScreenVNext.tsx` |
| Map core   | `hooks/useMapCore.ts` (`programmaticFlyTo`, defer reset ref en moveend) |

---

## QA rápido

- **Editar → Guardar:** Toast “Cambios guardados”, navegación a mapa, sheet del spot en **expanded** (sin flyTo; mapa no centra).
- **Compartir → abrir link:** Mapa + sheet del spot en **medium**.
- **Consola:** Sin errores nuevos atribuibles a este cambio.

---

## Seguimiento

- Micro-scopes UX pendientes (Search estable, una entrada crear spot, share deep link AC) en `docs/ops/EXPLORE_UX_MICROSCOPES.md`.
