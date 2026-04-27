# 388 — Explore List Density Control V1

Fecha: 2026-04-26

## Cambio

- Se crea `ExploreListDensityControl` como control canónico de densidad de listados.
- `SearchListCard` / `ResultRow` ahora soporta `density="detail" | "compact" | "simple"`.
- `SearchResultCard` pasa a propagar densidad hacia la card canónica.
- Buscador y Lugares comparten la preferencia visual local.
- La versión de selección queda canonizada como estado transversal (`selectionMode` + `selected`) de la misma card.
- Se corrige iconografía del control: detallada = filas amplias, compacta = líneas densas, simple = lista mínima.
- `SearchListCard` recibe `listContext` para teñir superficie/borde según filtro activo sin alterar datos.
- `Seleccionar` sale del header de sección y pasa a un riel de controles junto a densidad.
- La portada se normaliza como rail vertical full-height en `detail`/`compact` y thumbnail circular en `simple`.
- El header de Lugares recibe más padding inferior para separar `Filtrar` del riel de controles.
- La densidad `simple` se optimiza como fila mínima: sin borde de card, padding reducido y alto visual menor.
- El modal `Filtrar` incorpora categorías Maki calculadas desde el listado actual.
- Las categorías Maki activas se muestran como chips removibles y acotan lista/buscador/pines sin crear taxonomía propia.
- Revisión final de `SearchListCard`: el chevron/check/círculo de selección pasa a un slot derecho fijo y se eliminan offsets manuales para proteger `selected`, `selectionMode` y `disabled`.
- Corrección de centrado real: `compact/simple` anulan el `alignSelf: flex-start` del icono base y vuelven a centro vertical de card.
- En `Visitados`, `compact/simple` usan `ImagePlus` accionable cuando no hay imagen visible y existe acción `add_image`: replica el CTA de media pendiente sin label y sube foto sin disparar el `onPress` de la card. En `selectionMode` se oculta para preservar selección dominante.
- Buscador: la fila `Buscar` + `Filtrar` y el riel `Seleccionar` + densidad aplican también en `Todos`; el fallback cross-filter queda con copy mínimo: “No hay resultados en [filtro], buscando en el mapa.”

## Criterio arquitectónico

La densidad es presentación, no filtro. Cambiarla no debe alterar query, pines, selección, etiquetas ni estado del mapa.
Maki es señal de proveedor para acotar resultados V1; no es todavía categoría editorial de FLOWYA.

## Trazabilidad

- Contrato: `docs/contracts/DESIGN_SYSTEM_USAGE.md` §6.2.2.
- Plan: `docs/ops/plans/PLAN_EXPLORE_LIST_DENSITY_CONTROL_V1_2026-04-26.md`.
