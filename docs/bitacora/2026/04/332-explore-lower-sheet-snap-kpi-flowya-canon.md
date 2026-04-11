# 332 — Explore: snap inferior compartido, entrada KPI, canon FLOWYA

**Fecha:** 2026-04-11  
**Alcance:** `MapScreenVNext` (snap `exploreLowerSheetSnapRef`, `useLayoutEffect` países), contratos `EXPLORE_CHROME_SHELL.md`, `FILTER_RUNTIME_RULES.md`, `FLOWYA_STATUS_ROW_VISIBILITY.md`, vitrina `design-system.web` (`ExploreWelcomeSheet` peek/medium/expanded).

## Resumen

- **Snap único** entre `ExploreWelcomeSheet` y `CountriesSheet` en memoria de sesión; al ir de Todos a KPI con datos, el sheet de países abre alineado al nivel del welcome; gesto de mapa sigue forzando peek.
- **Desde Todos con count > 0:** se abre Countries; con count 0 no se fuerza.
- **FLOWYA:** documentadas reglas de `isFlowyaFeedbackVisible` (countries abierto → oculto; welcome/spot solo en peek).

## QA manual (matriz breve)

| Escenario | Esperado |
|-----------|----------|
| Todos, welcome medium → Por visitar (con pins) | Countries abierto, estado coherente con welcome (peek→medium por `coerceCountriesSheetInitialState`). |
| Mapa pan/zoom con sheet inferior | Welcome o countries pasa a peek. |
| Peek en countries → cambiar a Todos → volver a KPI | Persistencia por filtro + snap; sin saltos raros al cambiar filtro sin gesto mapa. |
| Por visitar, Countries abierto | FLOWYA oculta. |
| Todos, welcome peek | FLOWYA visible; welcome medium | FLOWYA oculta. |
