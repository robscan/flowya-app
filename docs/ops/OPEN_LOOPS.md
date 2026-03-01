# OPEN_LOOPS — Flowya (alcance activo)

**Fecha:** 2026-03-01

> Fuente operativa diaria del alcance activo.
> Este archivo contiene solo loops activos y sus dependencias.
> Cierres se registran en bitácora y trazabilidad final.

---

## Foco inmediato (P0 -> P2)

1. **P0 único:** `OL-P3-002` — Países interactivo + mapa mundial shareable (arranque por fases)
2. **P1:** definir alcance de `P3-002.A` (MVP países interactivo sin share)
3. **P2:** mantenimiento documental continuo (bitácora + contratos + guardrails)

---

## Loops activos

- `OL-P3-002` activo en arranque operativo (scoping de fase A).
- `OL-P1-003` y `OL-P2-006` están **cerrados** (solo histórico).

---

## Postergados estratégicos (no ejecutar ahora)

- `OL-P0-002` — Create Spot canónico
- `OL-P1-006` — Migración POI DB (maki/categorías)
- `OL-P1-007` — Pipeline turístico sin Google
- `OL-P3-001` — Web sheets `max-width: 720px` + alineación derecha

---

## Cierres recientes (trazabilidad)

- `OL-WOW-F2-003` — bitácora `209`.
- `OL-WOW-F2-005` — bitácora `210`.
- `OL-WOW-F2-002` — bitácora `211`.
- `OL-WOW-F2-004` — bitácora `212`.
- Gate Fase 2 cerrado — bitácora `213`.
- Saneamiento ops + arranque F3-001 — bitácora `214`.
- `OL-WOW-F3-001` MS1 smoke OK + avance MS2 — bitácora `215`.
- `OL-WOW-F3-001` cierre operativo (MS1+MS2, smoke final OK) — bitácora `216`.
- `OL-WOW-F3-002` quality gate países implementado — bitácora `217`.
- `OL-WOW-F3-002` cierre operativo (QA checklist OK) — bitácora `218`.
- `OL-WOW-F3-003` implementación base observabilidad — bitácora `219`.
- `OL-WOW-F3-003` cierre operativo (QA checklist OK) — bitácora `220`.
- `OL-P2-006` cerrado completamente — bitácora `232`.
- `OL-P1-003` cerrado + hardening post-cierre — bitácoras `233` y `234`.

## Avance del loop activo

- `OL-P3-002.A` MVP base implementado (contador interactivo + panel de países + búsqueda por país) — bitácora `236`.
- `OL-P3-002.A` hardening idioma/locale + drill-down por país + toast sobre sheet — bitácora `237`.
- `OL-P3-002.A` reconstrucción de sheet de países sobre contrato canónico reusable (sin lógica legacy inline) — bitácora `238`.
