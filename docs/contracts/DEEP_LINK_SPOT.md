# DEEP_LINK_SPOT — Contrato de URL (Explore + sheet)

**Última actualización:** 2026-05-18
**Status:** ACTIVE

> Explore (mapa) es el entrypoint; el detalle del spot vive como sheet. El estado del sheet depende del origen: post-edit → expanded; compartir → medium; post-create → expanded vía `created`. Search también puede abrirse por URL con `openSearch=1`, sin seleccionar spot.

---

## Formato

- **Base web pública:** ruta del mapa = `/app` (`app/app.web.tsx` renderiza `MapScreenVNext`).
- **Base nativa / tab legacy:** `/(tabs)` sigue siendo el anchor de navegación nativa; en web, `/(tabs)/index.web.tsx` es landing pública.
- **Query principal:** `spotId=<uuid>` y `sheet=<medium|extended>`.
- **Query post-create:** `created=<uuid>` (retorno tras crear spot; abre sheet en **expanded** sin usar `sheet`).
- **Query Search:** `openSearch=1` abre el buscador de Explore sin spot ni query prellenada.

| Valor    | Origen    | Estado del sheet en UI |
|----------|-----------|-------------------------|
| `extended` | Post-edit (guardar) | Expanded (más expandido) |
| `medium`   | Compartir (link)    | Medium (estado medio)    |

**URLs web:** `/app?spotId=<id>&sheet=extended` (post-edit) · `/app?spotId=<id>&sheet=medium` (share) · `/app?created=<id>` (post-create tras consumo/cleanup; ver flujo crear en `app/create-spot/index.web.tsx`) · `/app?openSearch=1` (abrir Search)

---

## Uso

| Caso | Acción |
|------|--------|
| **Post-edit** | Tras guardar → `router.replace(getMapSpotDeepLink(spot.id))` (default `sheet=extended`). Usuario ve mapa y sheet del spot en **expanded**. El **filtro de pins** (Todos / Por visitar / Visitados) **no** se resetea; si el spot no encaja en el filtro activo, la selección se preserva vía `preserveOutOfFilterSelection` / mutación reciente (mismo criterio que el sheet). |
| **Compartir** | **Link público**: `/s/<id>`. En Vercel, `api/spot-share.ts` devuelve HTML con metadata OG/Twitter para bots y redirige a humanos al mapa + sheet **medium**. En hosts estáticos sin función server-side, la ruta cae en la SPA (`app/s/[id].tsx`) y redirige al mapa sin preview enriquecida. |
| **Post-create** | Tras crear spot, el flujo web actual construye `/(tabs)?created=<id>` desde `app/create-spot/index.web.tsx`; cuando el param llega a `MapScreenVNext`, selecciona el spot, abre sheet **expanded**, aplica `ensureSpotVisibleWithActiveFilter` y limpia la URL con `router.replace("/app")`. No depende de `sheet`. |
| **Apertura en frío** | Con `spotId` + `sheet`: `extended` → expanded, `medium` → medium. |
| **Abrir buscador** | Con `openSearch=1`, `MapScreenVNext` llama `openSearchPreservingCountriesSheet()`: guarda snapshot de `CountriesSheet`/selección previa, cierra `CountriesSheet` si estaba abierto, libera foco activo y abre `SearchFloating`. Después limpia solo `openSearch` con `router.setParams({ openSearch: undefined })`. |

## Restricciones verificadas

- El intake de deep link rehace fetch del spot por id en DB cuando hace falta; no depende solo de caché en memoria para coordenadas tras edición.
- En `created=<id>`, si el spot ya está en la lista en memoria se aplica en caliente; si no, se fetchea por id (`is_hidden=false`) y luego se aplica.
- Si el spot no coincide con el `pinFilter` activo, se mantiene visible temporalmente por excepción runtime de mutación reciente; no hay auto-switch a `all`.
- Guardias separadas para `spotId` y `created` (refs distintos); una sola aplicación por id para evitar parpadeos; tras aplicar estado, `router.replace("/(tabs)")` limpia query.
- Si el spot no existe o no es visible (`is_hidden`, borrado), se limpia la URL y no se reintenta en bucle.
- `openSearch=1` es un trigger one-shot: se consume una vez mientras el param vale `1` y se rearma cuando el param desaparece.
- `openSearch=1` no transporta query, filtro ni selección. Search abre en el estado runtime actual.
- Si el overlay de nombre de Create Spot está abierto, `openSearchPreservingCountriesSheet()` retorna sin abrir Search para evitar doble dueño de teclado.

---

## Implementación

- **URLs helpers:** `lib/explore-deeplink.ts`
  - `getMapSpotDeepLink(spotId, sheet?)` — default `extended` (post-edit).
  - `getMapSpotShareUrl(spotId)` — entry pública web con `sheet=medium`.
  - Los params `created` y `openSearch` no pasan por estos helpers; los construyen sus flujos (`/(tabs)?created=…`, `/app?openSearch=1`).
- **Share spot:** `lib/share-spot.ts` comparte `/s/<id>`.
- **Preview HTML server-side:** `api/spot-share.ts` + `lib/spot-share-preview.ts`.
- **Fallback SPA:** `app/s/[id].tsx` (hosts estáticos sin función server-side).
- **Consumo:** `components/explorar/MapScreenVNext.tsx` lee `spotId`, `sheet`, `created` y `openSearch` (`useLocalSearchParams`).
  - `spotId` + `sheet`: `extended` → `setSheetState('expanded')`, `medium` → `setSheetState('medium')`.
  - `created`: `setSheetState('expanded')` (post-create canónico).
  - Cleanup: `router.replace("/app")` en `setTimeout(..., 0)` tras commit de estado (evita flash del sheet).
  - `openSearch`: `openSearchPreservingCountriesSheet()` y cleanup con `router.setParams({ openSearch: undefined })`.
- **Intake `spotId`:** fetch desde DB para coords actuales. No fuerza `pinFilter` a «Todos».

## Troubleshooting

1. **El link abre mapa pero no abre sheet**
- Con `spotId`: validar que `sheet` sea exactamente `extended` o `medium`.
- Con `created`: no hace falta `sheet`; revisar que el id exista y no esté oculto.

2. **El link “desaparece” al abrir**
- Esperado: el param se consume y luego se limpia con `replace("/(tabs)")`.
- Para depurar, revisar logs previos al cleanup, no la URL final.

3. **El spot no queda visible en el filtro activo tras post-edit**
- Esperado: no se cambia filtro automáticamente.
- Revisar la excepción temporal de visibilidad (`recentlyMutatedSpotId` / TTL) y su expiración.

4. **Se abre spot con coordenadas viejas**
- Es regresión. El intake debe fetchar por id en DB y no reutilizar objeto cacheado.

5. **Retorno post-create no abre en expanded**
- Confirmar navegación con `created=<id>` y que el id sea resoluble en DB.
- Revisar que no se pisen `appliedCreatedIdRef` / efectos duplicados.

6. **`openSearch=1` no abre el buscador**
- Validar que el valor sea exactamente `1`; otros valores se ignoran.
- Revisar si Paso 0 / overlay de nombre de Create Spot está abierto; Search no se abre en ese estado.
- Esperado: tras abrir, la URL deja de mostrar `openSearch` por cleanup.
- `openSearch` no debe combinarse con `spotId` para intentar abrir Search y SpotSheet a la vez; Search domina la superficie y SpotSheet no se monta mientras Search está abierto.

---

## QA

1. **Editar → Guardar:** Toast “Cambios guardados”, mapa, sheet del spot en **expanded**.
2. **Share link:** Abrir link en fresh load → mapa, sheet del spot en **medium**.
3. **Filtro sticky:** Estando en `saved`/`visited`, editar y guardar un spot que ya no cumple filtro → no saltar a `all`; mantener continuidad visual del spot.
4. **Param cleanup:** Tras aplicar deep link, confirmar que la URL se limpia sin reabrir sheet en renders siguientes.
5. **Post-create:** Volver desde crear con `created=<id>` → mapa + sheet en **expanded**, URL limpia.
6. **Open Search:** Abrir `/(tabs)?openSearch=1` desde carga fría y desde mapa con `CountriesSheet` visible → Search abierto, contexto previo preservable al cerrar, URL limpia.
