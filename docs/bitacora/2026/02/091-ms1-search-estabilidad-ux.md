# Bitácora 091 (2026/02) — Micro-scope 1: SEARCH estabilidad + UX (web móvil + sheet)

**Fecha:** 2026-02-14  
**Micro-scope:** 1 — SEARCH (strategy/EXPLORE_UX_MICROSCOPES.md)  
**Objetivo:** Buscador estable con teclado, sin saltos; patrón cerrar/abrir tipo Apple Maps.

---

## Entregables

1. **Layout/keyboard-safe (web móvil)**  
   - Overlay ya usa `--app-height` (100dvh / visualViewport) y body scroll-lock (OL-052, 076).  
   - Panel con `overflow: 'hidden'` para evitar reflow/scroll del contenedor al enfocar input.

2. **No results / chooser**  
   - Estado "Sin resultados" ya tiene Sugerencias + "Crear spot nuevo aquí" (contrato SEARCH_NO_RESULTS_CREATE_CHOOSER).  
   - **Cambio:** Contenido de no-results envuelto en **ScrollView** con `keyboardShouldPersistTaps="handled"` para que el scroll de sugerencias + chooser funcione con teclado visible (AC: scroll resultados con teclado).

3. **Interacciones**  
   - Tap en backdrop: blur si input enfocado, sino cierre (SearchOverlayWeb).  
   - MapScreenVNext: al cerrar Search se restauran `prevSelectedSpot` y `prevSheetStateRef` → vuelta al mapa sin medio estado.  
   - SpotSheet no se renderiza cuando `searchV2.isOpen` → no doble overlay/sheet.

---

## Archivos tocados

- `components/search/SearchOverlayWeb.tsx`: ScrollView en rama isNoResults; `overflow: 'hidden'` en panel.
- `components/search/SearchFloatingNative.tsx`: ScrollView en rama isNoResults (misma UX que web).

---

## QA manual (checklist)

- [ ] iPhone sim web: abrir Search → escribir → teclado aparece → sin brincos.
- [ ] Scroll de resultados (y en "Sin resultados" sugerencias + chooser) funciona con teclado visible.
- [ ] Cerrar Search (X o tap backdrop) vuelve al mapa; sheet/estado previo restaurado.
- [ ] Consola sin errores/warnings nuevos relevantes.

---

## DoD

- AC del micro-scope cubiertos; sin deuda (sin flags frágiles); QA manual documentado.
