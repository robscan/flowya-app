# 387 — Lugares por país: cabecera compacta y encuadre consciente del sheet

**Fecha:** 2026-04-26  
**Rama:** `codex/p0-map-camera-bbox-guards`  
**Estado:** implementado en rama, pendiente de QA manual visual

## Contexto

Producto validó que, al seleccionar un país desde CountriesSheet, el listado de lugares ya aparece en `medium`, pero la cabecera ocupaba demasiado espacio: título genérico, buscador inline, botón de filtros y chip del país. Eso competía con el objetivo real de esta vista: explorar lugares en mapa o listado, no iniciar una búsqueda deliberada.

También se pidió ajustar el encuadre para que se aprecien algunos pins detrás/por encima del sheet. La iteración posterior descartó usar un filtro invisible de país para lograrlo: eso ocultaba lugares sin intención explícita y dejaba al usuario sin una forma clara de revertirlo.

## Decisión

- La vista de detalle de país usa el país como título del sheet.
- La vista `Lugares` general adopta el mismo criterio minimal: no usa buscador inline en el cuerpo.
- En detalle de país y en `Lugares`, el buscador inline se retira: la búsqueda deliberada vive en el buscador full-screen.
- El CTA `Filtrar` se mueve a la esquina superior derecha del header, ocupando el espacio de la acción de cierre retirada.
- El chip de país no se muestra cuando el país ya es el contexto principal del sheet; las etiquetas activas sí se mantienen visibles bajo el header.
- El snap `medium` usa una altura estimada menor para esta zona compacta.
- El fitBounds país→lugares reserva padding inferior moderado y acotado en mobile para que el área quede legible sin abrir demasiado el globo ni mostrar el horizonte/espacio exterior como “reflejo”; desktop sidebar conserva padding normal.
- Seleccionar un país desde ranking/listado es **navegación contextual**, no filtro explícito: acota el listado por la ruta del sheet y vuela el mapa a sus lugares, pero no filtra la visibilidad de pins, no escribe `explorePlacesCountryFilter`, no muestra chip país en el mapa ni se persiste como filtro. Solo `Filtrar → país` crea filtro explícito.
- Decisión posterior: se intentó resaltar el área del país en el mapa principal con capas Mapbox/GeoJSON, pero no fue visible de forma confiable en el style actual y agregaba complejidad de bajo valor para V1. Se retira del alcance V1; para retomarlo se requiere geometría propia simplificada o una estrategia de overlay validada.
- Tocar un país en el mini-mapa del contador pliega el sheet a `peek` y usa padding normal de mapa para priorizar ver el área seleccionada, no compensar una lista.
- El guard contra colapso por `fitBounds` programático es corto; el primer gesto real del usuario sobre el mapa colapsa el sheet, sin requerir una segunda interacción.
- Canon header: menos aire superior entre borde/handle y más separación táctil entre header y primer título de sección (`LUGARES EN EL MAPA` / `Seleccionar`).

## Archivos principales

- `components/explorar/MapScreenVNext.tsx`
- `components/explorar/CountriesSheet.tsx`
- `components/explorar/explore-places-active-filters-bar.tsx`
- `components/explorar/explore-places-list-section-title-row.tsx`
- `components/design-system/explore-context-sheet-header.tsx`
- `docs/contracts/EXPLORE_SHEETS_BEHAVIOR_MATRIX.md`
- `docs/contracts/explore/FILTER_RUNTIME_RULES.md`
- `docs/ops/EXPLORE_STABILITY_MEDIA_DB_AUDIT.md`
- `docs/ops/OPEN_LOOPS.md`

## QA pendiente

1. En móvil web, abrir `Visitados`, tocar `México`: el sheet debe quedar en `medium`, título `México`, `Filtrar` arriba derecha, sin buscador inline ni chip `México`.
2. Abrir `Lugares` general desde KPI: `Filtrar` debe estar arriba derecha y no debe aparecer buscador inline en el cuerpo.
3. Verificar que `Filtrar` abre el modal de filtros y que etiquetas activas se ven como chips bajo el header.
4. Verificar que hay más primera fila/listado visible que antes.
5. Verificar que el mapa conserva pins fuera del país visibles tras país → lugares y que no aparece chip/filtro país fantasma.
6. Repetir con otro país y en `Por visitar`.
7. Repetir desktop sidebar: el encuadre no debe sobrecompensar con padding inferior de móvil.
8. Seleccionar país desde ranking/listado: no debe aparecer chip país en mapa ni esconder pins de otros países; abrir `Filtrar` y seleccionar país sí debe mostrar/persistir chip y aplicar filtro explícito.
9. Tocar país en mini-mapa del contador: el sheet debe plegarse a `peek`.
10. Tras país → lugares, arrastrar o tocar mapa: debe colapsar en la primera interacción real.
11. Header: validar menor aire arriba del handle y separación suficiente entre header y `Seleccionar`.

## Qué no resuelve

- No reemplaza el futuro OL de shell común para todas las sheets.
- No rediseña Search.
- No cambia DB, RLS ni Storage.
