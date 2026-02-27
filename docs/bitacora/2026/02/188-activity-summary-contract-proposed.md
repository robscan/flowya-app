# 188 — Contrato propuesto Activity Summary (países/lugares visitados/pendientes)

**Fecha:** 2026-02-26  
**Rama:** `codex/next-search-map-iteration`

## Objetivo

Documentar contrato de resumen de actividad del usuario para incorporar progreso personal sin degradar estabilidad ni performance.

## Entregable

- Nuevo contrato: `docs/contracts/ACTIVITY_SUMMARY.md`
  - Métricas canónicas (`visitedPlacesCount`, `pendingPlacesCount`, `visitedCountriesCount`)
  - Reglas de cálculo e invalidación por eventos
  - UX contract (loading/ready/partial/error)
  - Guardrails de performance y privacidad
  - Fases recomendadas (A/B/C)

- Índice actualizado: `docs/contracts/INDEX.md`

## Notas clave

- Se prioriza implementación segura por fases.
- `visitedCountriesCount` queda condicionado a fuente de país confiable para evitar datos engañosos.
