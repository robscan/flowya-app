# 180 — Documentación modular de reglas runtime (mapa/filtros/controles/buscador)

**Fecha:** 2026-02-26  
**Rama:** `codex/next-search-map-iteration`

## Objetivo

Separar reglas operativas de Explore en contratos modulares para mejorar mantenimiento, reconstrucción y reutilización entre plataformas (web/nativo).

## Cambios aplicados

Se agrega bloque documental en `docs/contracts/explore/`:

- `EXPLORE_RUNTIME_RULES_INDEX.md` (índice canónico)
- `MAP_RUNTIME_RULES.md`
- `FILTER_RUNTIME_RULES.md`
- `CONTROLS_RUNTIME_RULES.md`
- `SEARCH_RUNTIME_RULES.md`

Actualización adicional:

- `docs/contracts/INDEX.md` ahora incluye `explore/EXPLORE_RUNTIME_RULES_INDEX.md` como referencia canónica de runtime modular.

## Decisión de arquitectura documental

- Separar **core puro** (reglas/funciones reutilizables) de **adapters de plataforma** (mapa/UI/storage).
- Mantener contratos existentes como fuente funcional, y usar estos nuevos documentos como capa operativa por dominio.

## Impacto esperado

- Menor mezcla de reglas en discusiones y PRs.
- Mejor trazabilidad para QA y reconstrucción por módulo.
- Base más estable para portar comportamiento entre web y nativo sin duplicar lógica.
