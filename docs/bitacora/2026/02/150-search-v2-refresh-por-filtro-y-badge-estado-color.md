# 150 — Search V2: refresh por cambio de filtro y badge de estado por color

Fecha: 2026-02-25

## Contexto

QA detectó un caso en Search V2 donde, con filtro `Visitados` activo, aparecía un resultado `Por visitar` en la sección "En esta zona".  
Además se solicitó ajustar el indicador visual de estado en card: icono blanco con fondo del color del estado.

## Implementación

Archivos:

- `components/explorar/MapScreenVNext.tsx`
- `components/design-system/search-list-card.tsx`

Cambio funcional (filtro):

1. Se añadió guardrail de refresh cuando cambia `pinFilter` (`all/saved/visited`) y la búsqueda está abierta con query válida (`>= 3`).
2. El refresh reutiliza `setQuery` con la query activa para re-ejecutar estrategia/cache con el filtro nuevo y evitar resultados stale cross-filter.

Cambio visual (badge):

1. Badge flotante de estado ahora usa fondo por estado:
   - `to_visit` -> `stateToVisit`
   - `visited` -> `stateSuccess`
2. Icono interno (`Pin` / `CheckCircle`) pasa a color blanco para contraste consistente.

## Resultado esperado

- Al cambiar filtro en Search V2, los resultados visibles corresponden al listado correcto del filtro activo.
- Card de resultado comunica estado con lectura rápida por color (fondo) e icono blanco.

## Validación mínima

- `npm run lint` OK.

