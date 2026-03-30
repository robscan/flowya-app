# DEEP_LINK_SPOT — Contrato de URL (Explore + sheet)

**Última actualización:** 2026-03-30
**Status:** ACTIVE

> Explore (mapa) es el entrypoint; el detalle del spot vive como sheet. El estado del sheet depende del origen: post-edit → expanded; compartir → medium.

---

## Formato

- **Base:** ruta del mapa = `/(tabs)` (pestaña index donde se renderiza MapScreenVNext).
- **Query principal:** `spotId=<uuid>` y `sheet=<medium|extended>`.
- **Query post-create:** `created=<uuid>` (abre el sheet en estado `expanded`).

| Valor    | Origen    | Estado del sheet en UI |
|----------|-----------|-------------------------|
| `extended` | Post-edit (guardar) | Expanded (más expandido) |
| `medium`   | Compartir (link)    | Medium (estado medio)    |

**URLs:** `/(tabs)?spotId=<id>&sheet=extended` (post-edit) · `/(tabs)?spotId=<id>&sheet=medium` (share) · `/(tabs)?created=<id>` (retorno post-create)

---

## Uso

| Caso | Acción |
|------|--------|
| **Post-edit** | Tras guardar → `router.replace(getMapSpotDeepLink(spot.id))` (default `sheet=extended`). Usuario ve mapa y sheet del spot en **expanded**. El **filtro de pins** (Todos / Por visitar / Visitados) **no** se resetea; si el spot no encaja en el filtro activo, la selección se preserva vía `preserveOutOfFilterSelection` / mutación reciente (mismo criterio que el sheet). |
| **Compartir** | `getMapSpotShareUrl(spotId)` genera URL con `sheet=medium`. Al abrir el link, mapa + sheet en **medium**. |
| **Post-create** | Flujo crear spot devuelve a Explore con `created=<id>`. Se selecciona el spot y se abre sheet en **expanded** (sin depender de `sheet`). |
| **Apertura en frío** | Según `sheet` en la URL: `extended` → expanded, `medium` → medium. |

## Restricciones verificadas

- El intake de deep link rehace fetch del spot por id en DB; no depende de caché en memoria para coordenadas tras edición.
- En `created=<id>`, si el spot ya está en memoria se aplica directo; si no, se fetchea por id y luego se aplica.
- Si el spot no coincide con el `pinFilter` activo, se mantiene visible temporalmente por excepción runtime de mutación reciente; no hay auto-switch a `all`.
- El consumo del param es de una sola aplicación por id (`spotId` y `created` tienen guardias separadas); tras aplicar estado, la URL se limpia para evitar re-aplicación y parpadeo del sheet.
- Si el spot de `spotId` o `created` no existe (`is_hidden=true` o borrado), se limpia la URL y no se reintenta en loop.

---

## Implementación

- **URLs:** `lib/explore-deeplink.ts`
  - `getMapSpotDeepLink(spotId, sheet?)` — default `extended` (post-edit).
  - `getMapSpotShareUrl(spotId)` — usa `sheet=medium`.
- **Consumo:** MapScreenVNext lee `spotId`, `sheet` y `created`.
  - `spotId + sheet`: `extended` → `setSheetState('expanded')`, `medium` → `setSheetState('medium')`.
  - `created`: `setSheetState('expanded')` (retorno canónico tras create).
  - Tras aplicar, hace `router.replace("/(tabs)")` para cleanup de params.
- **Intake spotId:** MapScreenVNext siempre hace fetch del spot por id en DB (no usa caché local) para tener coordenadas actuales. Garantiza encuadre correcto tras post-edit con cambio de ubicación. No fuerza `pinFilter` a «Todos».

## Troubleshooting

1. **El link abre mapa pero no abre sheet**
- Validar que `sheet` sea exactamente `extended` o `medium`.
- Valores distintos se ignoran por diseño.

2. **El link “desaparece” al abrir**
- Esperado: el param se consume y luego se limpia.
- Para depurar, revisar logs previos al cleanup, no la URL final.

3. **El spot no queda visible en el filtro activo tras post-edit**
- Esperado: no se cambia filtro automáticamente.
- Revisar la excepción temporal de visibilidad (`recentlyMutatedSpotId` / TTL) y su expiración.

4. **Retorno post-create no abre en expanded**
- Revisar que la navegación de retorno use `created=<id>` (sin depender de `sheet`).
- Confirmar que el id exista en `spots` o sea fetcheable en DB.

5. **Se abre spot con coordenadas viejas**
- Es regresión. El intake debe fetchar por id en DB y no reutilizar objeto cacheado.

---

## QA

1. **Editar → Guardar:** Toast “Cambios guardados”, mapa, sheet del spot en **expanded**.
2. **Share link:** Abrir link en fresh load → mapa, sheet del spot en **medium**.
3. **Filtro sticky:** Estando en `saved`/`visited`, editar y guardar un spot que ya no cumple filtro → no saltar a `all`; mantener continuidad visual del spot.
4. **Param cleanup:** Tras aplicar deep link, confirmar que la URL se limpia sin reabrir sheet en renders siguientes.
5. **Post-create:** Volver desde create con `created=<id>` → mapa + sheet en **expanded**, URL limpia y sin re-aplicación.
