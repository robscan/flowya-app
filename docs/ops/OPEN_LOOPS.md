# OPEN_LOOPS — Flowya (alcance activo)

**Fecha:** 2026-03-01

> Fuente operativa diaria del alcance activo.
> Este archivo contiene solo loops activos y dependencias inmediatas.

---

## Foco inmediato (P0 -> P2)

1. **P0 único:** `OL-P3-002.B` — cierre de QA visual/funcional de CountriesSheet + share card + overlays de mapa (bloque países).
2. **P1:** estabilización de gamificación V1 (`flows`) y verificación cross-theme/cross-platform.
3. **P2:** preparación de fase siguiente de contenido (`OL-CONTENT-001..006`) sin arrancar ejecución hasta cerrar P0.

---

## Loops activos

- `OL-P3-002` activo (subfase `P3-002.B`):
  - mapa mundial interactivo,
  - CountriesSheet en medium/expanded,
  - share card web con fallback de descarga,
  - hardening de overlays/animaciones/control de colisiones.
- Gamificación V1 activa en runtime:
  - score por países + spots,
  - niveles `X/12`,
  - chip de flows en perfil,
  - modal de niveles.
- V2 de gamificación: **solo documentación** (telemetría + calibración), sin implementación.

---

## Próxima cola (secuencial; no paralelizar)

1. `OL-P3-002.B` — cierre QA final y freeze de UI del bloque países.
2. `OL-CONTENT-001` — Mi diario v1 (notas por spot + persistencia).
3. `OL-CONTENT-002` — Galería v1 (múltiples fotos por spot).
4. `OL-CONTENT-003` — Tourism schema v1.
5. `OL-CONTENT-004` — Entity resolution v1.
6. `OL-CONTENT-005` — Enrichment pipeline v1.
7. `OL-CONTENT-006` — Directions v1.

Reglas:
- 1 loop activo por vez.
- No abrir `OL-CONTENT-004/005` sin cerrar contratos y research previo.
- No bloquear UX principal por dependencias externas.

---

## Postergados estratégicos (no ejecutar ahora)

- `OL-P0-002` — Create Spot canónico.
- `OL-P1-006` — Migración POI DB (maki/categorías).
- `OL-P1-007` — Pipeline turístico sin Google.
- `OL-P3-001` — Web sheets `max-width: 720px` + alineación derecha.

---

## Cierres recientes (trazabilidad)

- `OL-P3-002.B` hardening mini-mapa web (bloqueo zoom): bitácora `259`.
- `OL-P3-002.B` guardrails de share (snapshot/reintentos): bitácora `260`.
- `OL-P3-002.B` rediseño share card + descarga web: bitácora `261`.
- Gamificación niveles v2 (`X/12` + modal): bitácora `262`.
- Gamificación v3 (estilo barra/modal + copys): bitácora `263`.
- V2 documentada + ajuste inset horizontal mapa: bitácora `264`.
- Consolidación flows V1 (sheet/modal/share/overlay): bitácora `265`.
- Orden canónico KPI (`países -> spots -> flows`) en sheet/share + toast flows con guía mapa/buscador: bitácora `266`.

---

## Avance de `OL-P3-002`

- `P3-002.A` completado (MVP base + locale/drilldown + reconstrucción canónica): bitácoras `236`, `237`, `238`.
- `P3-002.B` en cierre de QA y saneamiento final de experiencia.
