# 389 — Search Intent Recovery V1 runtime

Fecha: 2026-04-26

## Cambio

- Se crea `lib/search/intent-normalize.ts` como normalizador canónico V1 para búsqueda por intención.
- Se crea `lib/search/intent-scoring.ts` con documento runtime y scoring local para spots.
- `spotsStrategy` deja de depender solo de `includes` literal y filtra/ordena por score local.
- `spotsStrategy` ya no aplica `bbox` del viewport cuando existe query textual; primero recupera intención sobre el pool local/DB y luego desempata por score/pin/distancia.
- `mergeSearchResults` protege candidatos locales plausibles frente a ruido externo.
- Se agrega `tests/search-intent-recovery.test.mjs`.
- Se corrige intermitencia cross-filter: el cache de una etapa vacía en `Por visitar`/`Visitados` ya no corta la segunda pasada hacia el pool completo, evitando que Mapbox reemplace un spot local plausible que vive en otro filtro.
- Se corrige el aviso contradictorio de fallback: la UI ya no dice “No hay resultados en Visitados/Por visitar” cuando la lista final sí contiene resultados de ese filtro. La bandera técnica de pool ampliado no se usa como prueba de ausencia real.

## Criterio

La búsqueda debe ayudar al usuario a encontrar un spot propio/local aunque escriba tokens internos, omita acentos o cometa typos leves. V1 es runtime/in-memory: no agrega DB, RPC, `pg_trgm` ni telemetría de query cruda.

Guardrail adicional: el viewport no es fuente de verdad para búsqueda textual local. Si el usuario está mirando Barcelona y escribe `plancha`, un spot propio relevante en Mérida debe poder aparecer; Mapbox puede complementar, no sustituir la recuperación local.

## Caso semilla

`Gran Parque La Pancha` debe ser recuperable con `Plancha`, `plancha`, `placha`, `pancha` y `Gran parque` mientras no exista una decisión editorial/DB sobre alias o corrección del título visible.

## Validación

- `npm run test:regression` cubre normalización, token interno, typo leve y match secundario conservador.
- `npx tsc --noEmit`.

## Pendiente

- QA manual en web móvil con `Plancha` / `placha` / `parque`, ubicando antes el mapa en otra región para validar que la recuperación local no depende del viewport.
- QA manual: en `Visitados`, buscar `plancha`; si aparece “Gran Parque La Pancha” con badge `Visitado`, no debe aparecer el aviso “No hay resultados en Visitados”.
- Definir en Fase 4 si hacen falta aliases/canonical name en DB después de introspección y evidencia real.
