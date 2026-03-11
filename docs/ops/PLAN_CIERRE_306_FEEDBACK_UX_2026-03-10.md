# Plan cierre 306 — Feedback UX, clustering, geoloc persist (2026-03-10)

## Objetivo

Documentar, commitear, subir y abrir PR para cerrar el día con los cambios de la rama `feat/feedback-ux-clustering-geoloc-persist`.

## Estado actual

- **Sanidad local:** hecha. `main` actualizado (PR 96 mergeado), rama `feat/feedback-ux-clustering-geoloc-persist` creada, cambios aplicados.
- **Bitácora:** creada `docs/bitacora/2026/03/306-feedback-ux-clustering-geoloc-persist.md`.

## Pasos para cerrar

### 1. Revisar diff

```bash
git status
git diff
```

### 2. Commit atómico

```bash
git add lib/map-core/constants.ts lib/map-core/spots-layer.ts
git add components/explorar/MapScreenVNext.tsx components/search/types.ts components/search/SearchSurface.tsx
git add components/search/SearchOverlayWeb.tsx components/search/SearchFloatingNative.tsx
git add hooks/useMapCore.ts app/spot/[id].web.tsx
git add docs/bitacora/2026/03/306-feedback-ux-clustering-geoloc-persist.md docs/ops/PLAN_CIERRE_306_FEEDBACK_UX_2026-03-10.md
git commit -m "feat: feedback UX (distancia sin ubicación, etiqueta resultados), eliminar clustering, geoloc persiste entre sesiones

- Eliminar clustering: capas y constantes en map-core
- Distancia solo cuando userCoords: MapScreenVNext renderItem
- Etiqueta 'N resultados de query' en Search (resultsSummaryLabel)
- Si permiso granted: obtener coords al cargar sin prompt (useMapCore, spot/[id])
- Bitácora 306"
```

### 3. Push y PR

```bash
git push -u origin feat/feedback-ux-clustering-geoloc-persist
```

Luego abrir PR en GitHub con:

- **Título:** feat: feedback UX, eliminación clustering, geoloc persiste entre sesiones
- **Descripción:** Resumen de bitácora 306 + lista de archivos + validación mínima.

### 4. Post-merge

- Actualizar OPEN_LOOPS si aplica (OL-URGENT-CLUSTER-001: cerrado con eliminación).
- Verificar CI en PR antes de merge.
