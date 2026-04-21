# DEEP_LINK_SPOT — Contrato de URL (Explore + sheet)

**Última actualización:** 2026-04-06
**Status:** ACTIVE

> Explore (mapa) es el entrypoint; el detalle del spot vive como sheet. El estado del sheet depende del origen: post-edit → expanded; compartir → medium; post-create → expanded vía `created`.

---

## Formato

- **Base:** ruta del mapa = `/(tabs)` (pestaña index donde se renderiza MapScreenVNext).
- **Query principal:** `spotId=<uuid>` y `sheet=<medium|extended>`.
- **Query post-create:** `created=<uuid>` (retorno tras crear spot; abre sheet en **expanded** sin usar `sheet`).

| Valor    | Origen    | Estado del sheet en UI |
|----------|-----------|-------------------------|
| `extended` | Post-edit (guardar) | Expanded (más expandido) |
| `medium`   | Compartir (link)    | Medium (estado medio)    |

**URLs:** `/(tabs)?spotId=<id>&sheet=extended` (post-edit) · `/(tabs)?spotId=<id>&sheet=medium` (share) · `/(tabs)?created=<id>` (post-create; ver flujo crear en `app/create-spot/index.web.tsx`)

---

## Uso

| Caso | Acción |
|------|--------|
| **Post-edit** | Tras guardar → `router.replace(getMapSpotDeepLink(spot.id))` (default `sheet=extended`). Usuario ve mapa y sheet del spot en **expanded**. El **filtro de pins** (Todos / Por visitar / Visitados) **no** se resetea; si el spot no encaja en el filtro activo, la selección se preserva vía `preserveOutOfFilterSelection` / mutación reciente (mismo criterio que el sheet). |
| **Compartir** | **Link público**: `/spot/<id>?open=map` (para previsualización social/SEO). La pantalla `app/spot/[id].web.tsx` redirige a humanos al deep link `getMapSpotShareUrl(spotId)` (mapa + sheet en **medium**) y evita redirección para bots/crawlers. |
| **Post-create** | Tras crear spot, el flujo web navega con `/(tabs)?created=<id>`. MapScreenVNext selecciona el spot, abre sheet **expanded**, aplica `ensureSpotVisibleWithActiveFilter`, limpia la URL con `router.replace("/(tabs)")`. No depende de `sheet`. |
| **Apertura en frío** | Con `spotId` + `sheet`: `extended` → expanded, `medium` → medium. |

## Restricciones verificadas

- El intake de deep link rehace fetch del spot por id en DB cuando hace falta; no depende solo de caché en memoria para coordenadas tras edición.
- En `created=<id>`, si el spot ya está en la lista en memoria se aplica en caliente; si no, se fetchea por id (`is_hidden=false`) y luego se aplica.
- Si el spot no coincide con el `pinFilter` activo, se mantiene visible temporalmente por excepción runtime de mutación reciente; no hay auto-switch a `all`.
- Guardias separadas para `spotId` y `created` (refs distintos); una sola aplicación por id para evitar parpadeos; tras aplicar estado, `router.replace("/(tabs)")` limpia query.
- Si el spot no existe o no es visible (`is_hidden`, borrado), se limpia la URL y no se reintenta en bucle.

---

## Implementación

- **URLs helpers:** `lib/explore-deeplink.ts`
  - `getMapSpotDeepLink(spotId, sheet?)` — default `extended` (post-edit).
  - `getMapSpotShareUrl(spotId)` — usa `sheet=medium`.
  - El param `created` no pasa por estos helpers; lo construye el flujo de creación (`/(tabs)?created=…`).
- **Share spot:** `lib/share-spot.ts` comparte `/spot/<id>?open=map` (no el deep link directo) para permitir cards en redes; la redirección al mapa ocurre en `app/spot/[id].web.tsx`.
- **Consumo:** `components/explorar/MapScreenVNext.tsx` lee `spotId`, `sheet` y `created` (`useLocalSearchParams`).
  - `spotId` + `sheet`: `extended` → `setSheetState('expanded')`, `medium` → `setSheetState('medium')`.
  - `created`: `setSheetState('expanded')` (post-create canónico).
  - Cleanup: `router.replace("/(tabs)")` en `setTimeout(..., 0)` tras commit de estado (evita flash del sheet).
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

---

## QA

1. **Editar → Guardar:** Toast “Cambios guardados”, mapa, sheet del spot en **expanded**.
2. **Share link:** Abrir link en fresh load → mapa, sheet del spot en **medium**.
3. **Filtro sticky:** Estando en `saved`/`visited`, editar y guardar un spot que ya no cumple filtro → no saltar a `all`; mantener continuidad visual del spot.
4. **Param cleanup:** Tras aplicar deep link, confirmar que la URL se limpia sin reabrir sheet en renders siguientes.
5. **Post-create:** Volver desde crear con `created=<id>` → mapa + sheet en **expanded**, URL limpia.
