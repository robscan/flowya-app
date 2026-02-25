# 151 — Search V2 (`Todos`): guardados primero, luego creados, luego recomendaciones

Fecha: 2026-02-25

## Contexto

QA reportó inconsistencia: en filtro `Todos`, resultados internos mostraban spots creados y recomendaciones aunque existían spots `guardados/visitados` relevantes.

Regla solicitada:

1. En `Todos`: primero spots guardados (incluye visitados), luego spots creados, luego recomendaciones.
2. Si no hay spots internos, recomendaciones suben al inicio del estado de resultados.

## Implementación

Archivos:

- `lib/search/spotsStrategy.ts`
- `hooks/search/useSearchControllerV2.ts`

Cambios:

1. `spotsStrategy` ahora prioriza en orden de sort para `pinFilter=all`:
   - `to_visit/visited` (guardados) primero.
   - `default` (creados/no guardados) después.
   - Dentro de cada grupo, mantiene orden por distancia.
2. `useSearchControllerV2` agrega guardrail de promoción de stage para `all`:
   - Si una etapa devuelve items pero ninguno guardado, avanza a la siguiente etapa (`viewport -> expanded -> global`) para intentar traer guardados antes de fijar resultados finales.
   - Se mantiene comportamiento previo de promoción cuando no hay items.

## Resultado esperado

- En `Todos`, cuando existan guardados que hagan match, deben aparecer antes que creados.
- Recomendaciones externas se mantienen después de spots internos; solo suben al bloque principal cuando no hay spots internos.

## Validación mínima

- `npm run lint` OK.

