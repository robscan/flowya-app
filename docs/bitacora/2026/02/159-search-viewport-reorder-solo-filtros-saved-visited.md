# 159 — Reorden por viewport solo para `Por visitar` y `Visitados`

Fecha: 2026-02-25

## Contexto

Se aclaró alcance funcional:

- Reorden dinámico por viewport aplica a resultados filtrados (`saved`/`visited`).
- En `Todos`, se mantiene ranking previo.

## Implementación

Archivos:

- `components/explorar/MapScreenVNext.tsx`
- `lib/search/spotsStrategy.ts`

Cambio:

1. Refresh por `viewportNonce` (moveend) solo se ejecuta si filtro activo es `saved` o `visited`.
2. En `spotsStrategy`, stage `global` para `pinFilter=all` conserva centro legacy (`0,0`).
3. Stage `global` para `saved/visited` mantiene orden por centro de viewport.

## Validación mínima

- `npm run lint` OK.

