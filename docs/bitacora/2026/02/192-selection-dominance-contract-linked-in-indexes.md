# 192 — Selection Dominance contract linked in indexes

Fecha: 2026-02-27
Tipo: documentación / gobernanza runtime

## Contexto
Tras ajustar roadmap WOW con validación mini QA secuencial y enfoque Mapbox-first en Search, se inició Fase 1 (`OL-WOW-F1-001`) con contrato nuevo de dominancia visual de selección.

## Cambios
- Se agregó el contrato `docs/contracts/explore/SELECTION_DOMINANCE_RULES.md` como módulo en:
  - `docs/contracts/explore/EXPLORE_RUNTIME_RULES_INDEX.md`
- Se incorporó referencia canónica en:
  - `docs/contracts/INDEX.md`
- Se enlazó como referencia directa de reglas de mapa en:
  - `docs/contracts/explore/MAP_RUNTIME_RULES.md`

## Resultado
- El contrato de dominancia de selección queda indexado y trazable desde runtime Explore y desde índice global de contratos.
- Se reduce riesgo de parches aislados sobre selección POI/spot sin pasar por reglas canónicas.

## Siguiente paso
- Continuar `OL-WOW-F1-001` con checklist de implementación técnica + smoke mínimo para garantizar que no reaparezca traslape de labels externos en estados `default/to_visit/visited`.
