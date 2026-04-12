# 337 — Explore desktop sidebar: sin clip al cambiar ancho KPI ↔ listado lugares

**Fecha:** 2026-04-11

## Tipo

Seguimiento **OL-WEB-RESPONSIVE-001** / contrato sidebar desktop ([`EXPLORE_CHROME_SHELL.md`](../../contracts/EXPLORE_CHROME_SHELL.md) §8b), encadenado a bitácora [`336`](336-explore-desktop-sidebar-entrada-map-resize-persist.md).

## Problema

En web **≥1080px**, al pasar del **KPI de países** (columna **400px**, `WEB_EXPLORE_SIDEBAR_PANEL_WIDTH`) al **listado de lugares** (país o «Todos», **720px**, `WEB_EXPLORE_SIDEBAR_PLACES_LIST_PANEL_WIDTH`) — y al volver — seguía viéndose un **recorte** (“clip”) en la sheet lateral.

## Causa (resumen)

1. **`Animated.Value`** para el ancho del contenedor lateral con `skipEntranceAnimation`: al saltar `panelWidth`, el bridge podía desfasar **un frame** el ancho del contenedor respecto al contenido interior (`width: w`), con **`overflow: hidden`** en el contenedor.
2. **`CountriesSheet`** en modo desktop heredaba del sheet móvil **`overflow: hidden`** en `styles.container` y en **`listEntranceWrap`**, recortando el listado durante el cambio de layout.
3. **Flex en web:** faltaba **`minWidth: 0`** en parte de la cadena (hosts del sheet, cuerpo del sidebar), favoreciendo comportamiento raro con `min-width: auto` implícito.

## Cambios aplicados

| Archivo | Cambio |
|---------|--------|
| [`components/explorar/ExploreDesktopSidebarAnimatedColumn.tsx`](../../../components/explorar/ExploreDesktopSidebarAnimatedColumn.tsx) | Con **`skipEntranceAnimation`**, render dedicado **`ExploreDesktopSidebarStaticColumn`**: `View` con ancho fijo `w` (sin animar ancho con `Animated`). La ruta con animación de entrada (`0 → w`) queda en **`ExploreDesktopSidebarEntranceAnimatedColumn`**. Resize del mapa: doble `requestAnimationFrame` + `onStageWidthAnimationFrame` al cambiar `w`. Contenedor estático: **`overflow: 'visible'`**; hijo con **`minWidth: 0`**. |
| [`components/explorar/CountriesSheet.tsx`](../../../components/explorar/CountriesSheet.tsx) | **`containerDesktopSidebar`**: `overflow: 'visible'` (anula el `hidden` del contenedor base en columna desktop). **`listEntranceWrapDesktopSidebar`**: `overflow: 'visible'` en los listados cuando `webDesktopSidebar`. **`webSidebarColumnHost` / `webSidebarColumnInner`**: **`minWidth: 0`**. |
| [`components/explorar/MapScreenVNext.tsx`](../../../components/explorar/MapScreenVNext.tsx) | **`exploreSidebarSheetBody`** y **`exploreSidebarColumn`**: **`minWidth: 0`** (paridad flex web). |

## Contrato / OL

- Actualizado [`docs/contracts/EXPLORE_CHROME_SHELL.md`](../../contracts/EXPLORE_CHROME_SHELL.md) §8b (notas de overflow y ancho KPI ↔ lugares).
- Trazabilidad loop: [`docs/ops/OPEN_LOOPS.md`](../../ops/OPEN_LOOPS.md).

## Trazabilidad GitHub

- Merge: [**PR #135**](https://github.com/robscan/flowya-app/pull/135) (2026-04-11).
- Índice PR recientes: [`349`](349-indice-trazabilidad-pr-130-139-2026-04.md).

## QA sugerido

Web **≥1080px**, filtro **Por visitar** o **Visitados**, sheet países abierto: **KPI → tap país** (o «Todos» en lugares) → **volver**; comprobar que no hay flash/recorte horizontal en la columna ni en el listado.
