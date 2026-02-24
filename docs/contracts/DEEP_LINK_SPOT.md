# DEEP_LINK_SPOT — Contrato de URL (Explore + sheet)

**Última actualización:** 2026-02
**Status:** ACTIVE

> Explore (mapa) es el entrypoint; el detalle del spot vive como sheet. El estado del sheet depende del origen: post-edit → expanded; compartir → medium.

---

## Formato

- **Base:** ruta del mapa = `/(tabs)` (pestaña index donde se renderiza MapScreenVNext).
- **Query:** `spotId=<uuid>` y `sheet=<medium|extended>`.

| Valor    | Origen    | Estado del sheet en UI |
|----------|-----------|-------------------------|
| `extended` | Post-edit (guardar) | Expanded (más expandido) |
| `medium`   | Compartir (link)    | Medium (estado medio)    |

**URLs:** `/(tabs)?spotId=<id>&sheet=extended` (post-edit) · `/(tabs)?spotId=<id>&sheet=medium` (share)

---

## Uso

| Caso | Acción |
|------|--------|
| **Post-edit** | Tras guardar → `router.replace(getMapSpotDeepLink(spot.id))` (default `sheet=extended`). Usuario ve mapa y sheet del spot en **expanded**. |
| **Compartir** | `getMapSpotShareUrl(spotId)` genera URL con `sheet=medium`. Al abrir el link, mapa + sheet en **medium**. |
| **Apertura en frío** | Según `sheet` en la URL: `extended` → expanded, `medium` → medium. |

---

## Implementación

- **URLs:** `lib/explore-deeplink.ts`
  - `getMapSpotDeepLink(spotId, sheet?)` — default `extended` (post-edit).
  - `getMapSpotShareUrl(spotId)` — usa `sheet=medium`.
- **Consumo:** MapScreenVNext lee `spotId` y `sheet`; mapea `extended` → `setSheetState('expanded')`, `medium` → `setSheetState('medium')`; luego limpia params.
- **Intake spotId:** MapScreenVNext siempre hace fetch del spot por id en DB (no usa caché local) para tener coordenadas actuales. Garantiza encuadre correcto tras post-edit con cambio de ubicación.

---

## QA

1. **Editar → Guardar:** Toast “Cambios guardados”, mapa, sheet del spot en **expanded**.
2. **Share link:** Abrir link en fresh load → mapa, sheet del spot en **medium**.
