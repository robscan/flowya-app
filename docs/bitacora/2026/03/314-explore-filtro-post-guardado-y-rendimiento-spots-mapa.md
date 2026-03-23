# 314 — Explore: filtro tras guardar, persistencia nativa y menos refetch en mapa

Fecha: 2026-03-22
Tipo: Fix UX + rendimiento (Mapbox / estado spots)

## Contexto
Tras guardar un spot desde la web, el deep link a Explore forzaba el filtro de pins a «Todos». En nativo, la preferencia de filtro no persistía (solo `localStorage` en web). Además, cada foco en Explorar disparaba un refetch completo de spots y `setData` GeoJSON en todas las capas, empeorando con ediciones repetidas.

## Cambios aplicados
- **Deep link / post-create / ver duplicado:** se deja de llamar `setPinFilter("all")`; si el spot no encaja en el filtro activo se usa `preserveOutOfFilterSelectionSpotIdRef` y `setRecentMutation` (TTL existente).
- **KV:** `lib/storage/kv.ts` con `getItemSync` / `getItemAsync` / `setItem` (web + AsyncStorage).
- **Preferencias:** `mapPinFilterPreference`, badges pendientes y recientes vuelven a persistir en iOS/Android; hidratar filtro antes de escribir en storage en nativo (`pinFilterStorageReady`).
- **Recientes:** estado `recentViewedIds` + `pushRecentViewedSpotId` para refrescar la lista en UI tras añadir en nativo.
- **Foco Explorar:** ventana mínima entre refetches completos (8 s); si se omite el completo pero hay spot seleccionado, `mergeSpotFromDbById` actualiza una fila + pins.
- **Contrato:** `docs/contracts/DEEP_LINK_SPOT.md`.

## Evidencia (archivos)
- `components/explorar/MapScreenVNext.tsx`
- `lib/storage/kv.ts`
- `lib/storage/mapPinFilterPreference.ts`
- `lib/storage/mapPinPendingBadges.ts`
- `lib/storage/recentViewedSpots.ts`
- `package.json` (`@react-native-async-storage/async-storage`)

## Validación mínima
- `npx tsc --noEmit`
- Web: filtro Por visitar/Visitados → editar → guardar → mismo filtro, sheet visible.
- Nativo: cambiar filtro, reabrir app → preferencia conservada.

## Rollback
Revertir commits tocando los archivos anteriores; desinstalar AsyncStorage si se retira por completo.
