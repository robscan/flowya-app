# 357 — Web: pickers de imagen, edición de chips de etiquetas, matriz de sheets y plan canon Explore

**Fecha:** 2026-04-14  
**Rama:** `fix/chips-pickers-sheets` (merge vía PR).

## Resumen

Entrega de ajustes UX/web y documentación de comportamiento de sheets en Explore; acuerdo de producto/arquitectura para **no** unificar todo en un solo componente, sino un **shell canónico + slots**, con **Search como excepción** al modelo `peek|medium|expanded`.

## Cambios de producto (código)

1. **Etiquetas / chips (modo edición tras long press)**  
   - En modo edición, el chip **«Cualquiera»** deja de renderizarse para ganar espacio horizontal en la fila de filtros.  
   - Archivos: `components/search/SearchSurface.tsx`, `components/explorar/CountriesSheet.tsx` (detalle país, paridad con búsqueda).

2. **Editar spot (web) — selector de imagen**  
   - Galería y portada usan `<input type="file">` en web (disparo directo por gesto de usuario), evitando bloqueos por `await` previos a `expo-image-picker` y fallos de apertura del diálogo.  
   - Archivo: `app/spot/edit/[id].web.tsx`.

3. **Cuenta / avatar (web) — cancelar selección**  
   - `pickProfileImageBlob()` resuelve al cerrar el file picker (p. ej. `window.focus`) en lugar de quedar pendiente hasta timeout largo; el botón deja de quedar en estado «cargando» al cancelar.  
   - Archivos: `lib/profile-avatar-upload.ts`, `app/account/index.web.tsx` (handler simplificado vía `finally`).

## Documentación

- **Matriz de comportamiento sheets/overlays:** `docs/contracts/EXPLORE_SHEETS_BEHAVIOR_MATRIX.md` (gating, web vs nativo en carga inicial, referencias a `computeExploreMapChromeLayout` y `MapScreenVNext`).

## Seguimiento acordado (no incluido en este merge como implementación)

- Plan operativo **OL-EXPLORE-SHEETS-CANON-001:** `docs/ops/plans/PLAN_OL_EXPLORE_SHEETS_CANON_2026-04-14.md` (Fase A–D: splash Welcome nativo documentado, shell compartido incremental, Search excepción formal, regression gate).

## Referencias

- Contrato sheets: `docs/contracts/CANONICAL_BOTTOM_SHEET.md`, `docs/contracts/EXPLORE_SHEET.md`, `docs/contracts/EXPLORE_CHROME_SHELL.md`.
- Etiquetas Explore: `docs/contracts/USER_TAGS_EXPLORE.md`.
