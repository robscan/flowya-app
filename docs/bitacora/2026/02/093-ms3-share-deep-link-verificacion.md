# Bitácora 093 (2026/02) — Micro-scope 3: Share deep link — verificación y cierre

**Fecha:** 2026-02-14  
**Micro-scope:** 3 — Share deep link (strategy/EXPLORE_UX_MICROSCOPES.md)  
**Objetivo:** Al compartir un spot, el link abre Explorar y muestra SpotSheet en el estado acordado (no SpotDetail standalone). Implementación en bitácora 090; este doc cierra AC/DoD.

---

## Verificación de entregables

1. **Esquema de URL canónico**  
   Definido y documentado en `docs/contracts/DEEP_LINK_SPOT.md`: `/(tabs)?spotId=<id>&sheet=extended|medium`.

2. **Handler de share**  
   `lib/share-spot.ts` usa `getMapSpotShareUrl(spotId)` → `lib/explore-deeplink.ts` → URL con `sheet=medium`. Genera link canónico (origen + path+query).

3. **Explore (intake)**  
   MapScreenVNext lee `spotId` y `sheet` vía `useLocalSearchParams`; aplica selección + `setSheetState('expanded'|'medium')`; limpia params con `router.replace('/(tabs)')`. Sin flyTo en deep link para no colapsar el sheet.

---

## AC (Acceptance Criteria)

- [ ] Abrir link compartido muestra mapa + sheet del spot en **medium**.
- [ ] Post-edit (guardar) muestra mapa + sheet del spot en **expanded** (edit screen usa `getMapSpotDeepLink(spot.id)`).
- [ ] Back/navegación coherente con Apple Maps (no quedar atrapado en SpotDetail; el “hogar” es Explorar).

---

## DoD

- Link canónico + handler + parseo en Explore: **hecho** (bitácora 090).
- QA manual: ejecutar checklist anterior; consola sin errores nuevos relevantes.
- PR: verificación + esta bitácora + QA.

---

## Referencias

- Bitácora 090, `docs/contracts/DEEP_LINK_SPOT.md`, `lib/explore-deeplink.ts`, `lib/share-spot.ts`, MapScreenVNext (intake params).
