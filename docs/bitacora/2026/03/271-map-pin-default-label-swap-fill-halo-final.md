# 271 — Ajuste final label pin default: swap relleno/sombra para legibilidad y match visual

Fecha: 2026-03-02  
Tipo: QA visual fine-tuning  
Área: `lib/map-core/spots-layer.ts`

## Contexto

El estilo anterior del label en estado `default` quedó invertido respecto a la referencia visual solicitada.

## Cambio aplicado

Para `pinStatus=default` se invierten los roles:

- El color usado como sombra/halo pasa a ser el **relleno del texto**.
- El color usado como relleno pasa a la **sombra/halo**.

Estados `to_visit` y `visited` no cambian.

## Resultado esperado

- Label de spots Flowya sin link más legible y cercano al estilo de referencia.
- Mantiene diferenciación visual de estados con filtro (`por visitar` / `visitado`).

## Sanidad

- `npm run lint -- --no-cache` OK.
