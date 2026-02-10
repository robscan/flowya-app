# Bitácora 071 (2026/02) — OL-050b: Search duplicate sheet layer fix

**Rama:** `chore/explore-quality-2026-02-09`  
**Objetivo:** Eliminar la capa “sheet duplicado” estática detrás del Search fullscreen.

## Síntoma

- Search fullscreen abre/cierra y drag-to-dismiss funcionaba.
- Detrás se veía una capa oscura/estática tipo “otra bandeja” que no se movía al arrastrar.

## Causa

- En SearchFloating había dos capas con fondo sólido:
  - **sheetRoot** (View): full-screen, `backgroundColor: colors.backgroundElevated`, sin animación → no se mueve.
  - **sheetPanel** (Animated.View): full-screen, mismo fondo, con `translateY` → solo este se arrastra.
- Al hacer drag-to-dismiss, el panel bajaba pero el root quedaba fijo, mostrando la “bandeja oscura estática”.

## Fix

- **sheetRoot:** pasar a contenedor de recorte sin pintar: `backgroundColor: 'transparent'`, sin borde (solo `overflow: 'hidden'`).
- **sheetPanel:** sigue siendo la única capa con fondo y borde; es el único “sheet” visible y el que se mueve con el gesto.

## Archivos tocados

- `components/search/SearchFloating.tsx` (estilos y props de sheetRoot).

## Commits

- `fix(search): remove duplicate sheet layer behind fullscreen search`
- `chore(ops): close OL-050b + bitácora 071`

## QA

- Abrir Search → una sola capa de sheet; sin banda estática detrás.
- Drag-to-dismiss → se mueve todo el sheet; no queda “resto” fijo.
- Cerrar → vuelve al pill; mapa normal.
- Scroll lista ok; body lock ok.

## QA final web

- Open/close 5 veces.
- Drag-to-dismiss lento + flick.
- Scroll lista.
- Consola limpia.
