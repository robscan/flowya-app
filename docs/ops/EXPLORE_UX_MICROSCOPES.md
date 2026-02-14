# Explore UX — 3 micro-scopes (Apple Maps vibe)

**Última actualización:** 2026-02-14  
**Regla:** 1 PR = 1 micro-scope. DoD/AC por PR. Sin deuda innecesaria.

**Ejecución (bitácoras):** MS1 → [091-ms1-search-estabilidad-ux.md](../bitacora/2026/02/091-ms1-search-estabilidad-ux.md) · MS2 → [092-ms2-una-entrada-crear-spot.md](../bitacora/2026/02/092-ms2-una-entrada-crear-spot.md) · MS3 → [093-ms3-share-deep-link-verificacion.md](../bitacora/2026/02/093-ms3-share-deep-link-verificacion.md).

Contexto producto: **map-first**, overlays claros, sheets limpias; crear spot = primero ubicación + imagen, luego textos en pantalla dedicada; edición/eliminación y compartir vuelven a **Explorar + SpotSheet** (no SpotDetail standalone).

---

## Micro-scope 1 — SEARCH: estabilidad + UX (web móvil + sheet)

**Objetivo:** Buscador estable con teclado, sin saltos ni ruptura de gestos; patrón de navegación cerrar/abrir tipo Apple Maps.

### Entregables

1. **Layout/keyboard-safe (web móvil)**
   - El teclado no debe “empujar” ni romper overlay/sheet.
   - Focus en input sin scroll raro ni reflow agresivo.

2. **No results / chooser**
   - Si no hay resultados: UI clara para “Crear spot” o “Buscar sugerencias”.
   - Patrón minimalista (sin CTA gigante; control circular tipo mapas junto al input si aplica).

3. **Interacciones**
   - Tap fuera / drag-dismiss naturales y consistentes.
   - No doble estado “overlay + sheet” peleando por z-index/gestos.

### AC (Acceptance Criteria)

- [ ] iPhone sim web: abrir Search → escribir → teclado aparece → **sin brincos**.
- [ ] Scroll de resultados funciona con teclado visible.
- [ ] Cerrar Search vuelve al mapa sin quedar “medio estado”.
- [ ] Consola sin errores/warnings nuevos relevantes (ignorar warnings de libs que no afecten UX).

### DoD

- PR con: cambios + breve bitácora + checklist QA manual.

### Referencias

- Search actual: SearchFloating / SearchOverlayWeb; contratos SEARCH_V2, SEARCH_NO_RESULTS_CREATE_CHOOSER.
- Bitácoras relacionadas: 076, 077, 078, 081.

---

## Micro-scope 2 — Una sola entrada para crear spot (map-first)

**Objetivo:** Eliminar ambigüedad; **solo una forma primaria** de iniciar “Crear spot” desde Explorar, consistente con Apple Maps.

### Decisión UX (propuesta por defecto)

- **Entrada principal:** botón circular **(+)** estilo controles del mapa, junto al input de búsqueda.
- **(Opcional secundario)** Long-press en mapa como “power user”; no duplicar flujos ni rutas distintas.

### Entregables

1. **Flujo canónico**
   - Tap (+) → CreateSpot step 1 (ubicación + imagen).
   - Tras crear → navegar a Explorar + SpotSheet **extended** del nuevo spot.

2. **Remover/redirect entradas duplicadas**
   - Rutas viejas/alternativas redirigen a la canónica (sin romper links).
   - No dejar “crear spot” escondido en menús que dupliquen el flujo.

3. **Estados y navegación**
   - “Cancel” vuelve al mapa sin side effects.
   - “Create ok” abre sheet extended del spot recién creado.

### AC

- [ ] Solo existe **un CTA primario** para crear spot visible en Explorar.
- [ ] Crear spot deja al usuario en **Explorar + SpotSheet extended** del spot creado.
- [ ] No hay rutas duplicadas que creen el mismo spot con payload diferente.

### DoD

- PR con: decisión explícita documentada, rutas actualizadas, QA manual.

### Referencias

- Create spot: `app/create-spot/`; MapScreenVNext (long-press, dock). Contrato CREATE_SPOT_INLINE_SHEET, SEARCH_NO_RESULTS_CREATE_CHOOSER.

---

## Micro-scope 3 — Share deep link: abrir Explorar + SpotSheet extended

**Objetivo:** Al compartir un spot, el link abre la app (o web) en **Explorar** y muestra el **SpotSheet** en el estado acordado (extended para post-edit, medium para share).

### Estado actual (implementado en bitácora 090)

- **URL canónica:** `/(tabs)?spotId=<id>&sheet=extended|medium`
  - Post-edit: `sheet=extended` → sheet **expanded**.
  - Share: `sheet=medium` → sheet **medium**.
- **Handler share:** `getMapSpotShareUrl(spotId)` en `lib/share-spot.ts` → URL con `sheet=medium`.
- **Explore:** MapScreenVNext lee `spotId` y `sheet`; selecciona spot, aplica estado del sheet, limpia params. Sin flyTo en deep link para no colapsar el sheet.
- Contrato: `docs/contracts/DEEP_LINK_SPOT.md`.

### Entregables (verificación / ajustes finos)

1. Esquema de URL canónico: **definido y documentado** (ver arriba).
2. Handler de share: **genera link canónico** (sheet=medium).
3. Explore: **si llega spotId (+ sheet), carga spot y abre sheet en el estado indicado.**

### AC

- [ ] Abrir link compartido muestra mapa + sheet del spot en **medium**.
- [ ] Post-edit (guardar) muestra mapa + sheet del spot en **expanded** (ya implementado).
- [ ] Back/navegación coherente con Apple Maps (no quedar atrapado en detalle raro).

### DoD

- PR con: link + handler + parseo en Explore + QA. _(Mayoría ya hecha en 090; PR puede ser verificación + doc + QA.)_

### Referencias

- Bitácora 090, `docs/contracts/DEEP_LINK_SPOT.md`, `lib/explore-deeplink.ts`, `lib/share-spot.ts`, MapScreenVNext (intake params).

---

## Notas de implementación (arquitectura)

- **Rutas canónicas** y redirects limpios; evitar flags tipo `?edit=1` para flujos principales.
- No nuevas pantallas innecesarias; sí separar responsabilidades (Explore vs Detail vs Edit).
- UX minimal: header limpio, CTAs claros, sheets consistentes.
- Entrega: **3 PRs** (uno por micro-scope), cada uno con DoD/AC y QA rápido.
