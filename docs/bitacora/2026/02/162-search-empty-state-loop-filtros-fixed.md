# 162 — Fix loop de empty state en filtros `Por visitar/Visitados`

Fecha: 2026-02-25

## Contexto

QA detectó bug en Search con filtros `saved/visited`:

- query sin resultados (`qwe`) mostraba empty state por un instante.
- luego entraba en ciclo de mostrar/ocultar.

## Causa

El refresh por `viewportNonce` podía re-dispararse más de una vez sin cambio real de viewport, generando toggles de `isLoading` y parpadeo de empty state.

## Implementación

Archivo:

- `components/explorar/MapScreenVNext.tsx`

Cambio:

1. Se agrega `viewportRefreshNonceRef`.
2. El efecto de refresh por viewport solo ejecuta `setQuery` cuando `viewportNonce` realmente cambió (una ejecución por `moveend`).

## Resultado esperado

- En `saved/visited` con query sin resultados, empty state permanece estable (sin loop visual).

## Validación mínima

- `npm run lint` OK.

