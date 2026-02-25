# 165 — Paridad V0: remover título de etapa en resultados de Search

Fecha: 2026-02-25

## Contexto

Persistía percepción de títulos visibles en listados, posible por ejecución en flujo/componentes V0.

## Implementación

Archivo:

- `components/explorar/MapScreenV0.tsx`

Cambio:

- Se elimina render de `stageLabel` en la rama `isSearch && results.length > 0`, alineando comportamiento con VNext (resultados sin título de etapa).

## Validación mínima

- `npm run lint` OK.

