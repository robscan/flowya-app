# 270 — Ajuste visual pin default Flowya (sin link): azul grisáceo + borde oscuro + símbolo +

Fecha: 2026-03-01  
Tipo: UX/UI map pin styling  
Área: `lib/map-core/spots-layer.ts`

## Objetivo

Alinear el pin `default` de spots Flowya no vinculados al estilo de referencia: apariencia más neutra (azul grisáceo), borde oscuro y símbolo `+` centrado.

## Cambios

- Color `default` actualizado a azul grisáceo (`#9CB2C8`) en light/dark.
- Borde del círculo en `default` pasa a oscuro (`#1A2330` / `#0E1520` según tema).
- Se añade capa `symbol` para `default` con `text-field: '+'` centrado sobre el pin.
- Estados `to_visit` y `visited` sin cambios.

## Resultado esperado

- El pin default de Flowya se diferencia mejor de POIs y replica el lenguaje visual solicitado.
- Mejor legibilidad del estado “spot propio sin filtro activo”.

## Sanidad

- `npm run lint -- --no-cache` OK.
