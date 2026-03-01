# OPEN_LOOPS — Flowya (alcance activo)

**Fecha:** 2026-03-01

> Fuente operativa diaria del alcance activo.
> Este archivo contiene solo loops activos y sus dependencias.
> Cierres se registran en bitácora y trazabilidad final.

---

## Foco inmediato (P0 -> P2)

1. **P0 único:** `OL-P3-002` — Países interactivo + mapa mundial shareable (cierre visual/QA final del share card + estabilidad).
2. **P1:** preparar arranque del bloque contenido (`OL-CONTENT-001..006`) con contracts y research de riesgo API.
3. **P2:** mantenimiento documental continuo (bitácora + contratos + guardrails).

---

## Loops activos

- `OL-P3-002` activo en arranque operativo (scoping de fase A).
- Bloque UX Explore/Search (ejecución incremental desde plan `PLAN_UX_MAPA_BUSCADOR_CONTADOR_DIARIO_2026-03-01.md`):
  - estado de spot con toggles explícitos (`Por visitar` / `Visitado`),
  - toasts contextuales por origen de filtro,
  - hardening de quick actions de resultados (`Agregar imagen`, `Descripción corta`),
  - visibilidad de Flowya spots sin filtro activo.
- `OL-P1-003` y `OL-P2-006` están **cerrados** (solo histórico).

---

## Próxima cola (mañana, secuencial; no paralelizar)

1. `OL-CONTENT-001` — Mi diario v1 (notas por spot: datos + entry en SpotSheet + persistencia segura).
2. `OL-CONTENT-002` — Galería v1 (múltiples fotos por spot, orden, fullscreen y gestión mínima).
3. `OL-CONTENT-003` — Tourism schema v1 (migración DB para señales turísticas y clasificación base).
4. `OL-CONTENT-004` — Entity resolution v1 (matching Mapbox↔Wikidata con score y fallback seguro).
5. `OL-CONTENT-005` — Enrichment pipeline v1 (Wikidata/Wikipedia/Wikimedia con trazabilidad y licencia).
6. `OL-CONTENT-006` — Directions v1 (UX de ruta con costo controlado y sin lock-in prematuro).

Reglas de ejecución para esta cola:
- 1 loop activo por vez.
- No abrir implementación de `004/005` sin cierre previo de research y contrato técnico.
- No bloquear UX principal por enriquecimiento asíncrono externo.

---

## Postergados estratégicos (no ejecutar ahora)

- `OL-P0-002` — Create Spot canónico
- `OL-P1-006` — Migración POI DB (maki/categorías)
- `OL-P1-007` — Pipeline turístico sin Google
- `OL-P3-001` — Web sheets `max-width: 720px` + alineación derecha

Nota:
- `OL-P1-006` y `OL-P1-007` quedan como macro-loops históricos; su ejecución práctica se descompone en `OL-CONTENT-003..005`.

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
- Hardening teclado/foco en Explore (`Paso 0` owner único, guardrails Search, quick edit top-aligned) — bitácora `240`.
- Consolidación DS Search/paises (colores canónicos + tipografía + layout card resultados) — bitácora `241`.
- Canonización dropdown filtros + retardo hasta settle de cámara/flyTo — bitácora `242`.
- Consolidación integral de ajustes del día (Search visited card + quick actions foto/descr + hardening UX) — bitácora `243`.

## Avance del loop activo

- `OL-P3-002.A` MVP base implementado (contador interactivo + panel de países + búsqueda por país) — bitácora `236`.
- `OL-P3-002.A` hardening idioma/locale + drill-down por país + toast sobre sheet — bitácora `237`.
- `OL-P3-002.A` reconstrucción de sheet de países sobre contrato canónico reusable (sin lógica legacy inline) — bitácora `238`.
