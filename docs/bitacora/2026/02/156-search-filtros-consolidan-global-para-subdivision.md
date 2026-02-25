# 156 — Search filtros: consolidar global para habilitar subdivisión cercana/lejana

Fecha: 2026-02-25

## Contexto

Tras activar secciones `Spots cercanos` / `En todo el mapa`, QA reportó que no siempre se veían.
Causa: en filtros `saved/visited` el controller podía quedarse en etapa local y no traer el conjunto global completo.

## Implementación

Archivo:

- `hooks/search/useSearchControllerV2.ts`

Cambio:

1. Se normaliza lectura de filtro con `resolvePinFilter`.
2. Para `pinFilter = saved | visited`, la búsqueda inicial fuerza promoción de etapa hasta `global` (`viewport -> expanded -> global`) antes de fijar resultados finales.
3. Se mantienen los guardrails existentes para `all` (promoción por vacíos o falta de visitados relevantes).

## Resultado esperado

- En `Por visitar` y `Visitados`, el dataset final incluye resultados cercanos y lejanos, habilitando la subdivisión visual en dos bloques.

## Validación mínima

- `npm run lint` OK.

