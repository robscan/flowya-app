# EXPLORE_RUNTIME_RULES_INDEX

Índice canónico de reglas runtime para Explorar, separadas por dominio para reducir acoplamiento y facilitar reconstrucción/reuso en web y nativo.

## Objetivo

- Centralizar reglas operativas de mapa, filtros, controles y buscador.
- Separar lógica pura (reusable) de adaptadores de plataforma (Mapbox/UI/local storage).
- Evitar mezcla de reglas en componentes de pantalla.

## Módulos

1. [MAP_RUNTIME_RULES.md](./MAP_RUNTIME_RULES.md)
2. [FILTER_RUNTIME_RULES.md](./FILTER_RUNTIME_RULES.md)
3. [CONTROLS_RUNTIME_RULES.md](./CONTROLS_RUNTIME_RULES.md)
4. [SEARCH_RUNTIME_RULES.md](./SEARCH_RUNTIME_RULES.md)

## Límites de arquitectura (cross-platform)

- **Core puro (`core/shared` / `lib/*` sin UI):**
  - ranking/ordenamiento,
  - evaluación de viewport visible vs no visible,
  - reglas de transición de filtros,
  - reglas de estado pendiente.
- **Adapters (plataforma):**
  - mapa (`flyTo`, `fitBounds`, `getBounds`),
  - UI (`sheet`, `dropdown`, `badges`),
  - persistencia local (`localStorage`/equivalente nativo).

## Referencias base

- `docs/contracts/SEARCH_V2.md`
- `docs/contracts/MAP_PINS_CONTRACT.md`
- `docs/contracts/SPOT_SELECTION_SHEET_SIZING.md`
- `docs/contracts/EXPLORE_SHEET.md`
- `docs/contracts/ANTI_DUPLICATE_SPOT_RULES.md`
