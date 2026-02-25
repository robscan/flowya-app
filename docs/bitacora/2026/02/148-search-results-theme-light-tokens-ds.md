# 148 — Search results: migración de estilo hardcoded a tokens DS (Light/Dark)

Fecha: 2026-02-25

## Contexto

Hallazgo QA: cards de resultados de búsqueda en web quedaban en estilo oscuro fijo, sin adaptarse a modo `light`.

## Cambio aplicado

Archivo:

- `components/design-system/search-list-card.tsx`

Ajustes:

1. Se elimina hardcode de colores oscuros (`rgba(20,22,28,...)`, `#F4F7FB`, `#AAB2BF`, etc.).
2. Se integra `useColorScheme` + `Colors` para pintar por tema:
   - superficie/borde con tokens (`backgroundElevated`, `borderSubtle`);
   - texto y subtítulo con `text` / `textSecondary`;
   - íconos (pin/chevron) con `textSecondary`.
3. Estado pressed usa `borderSubtle` en lugar de color oscuro fijo.

## Resultado esperado

- Modo Light: cards legibles y consistentes con DS.
- Modo Dark: mantiene jerarquía visual sin colores hardcode.

## Estado

- Implementación técnica: completada.
- Validación técnica: `npm run lint` OK.
- Pendiente QA visual final en web Light/Dark.
