# OPEN_LOOPS — Flowya (alcance activo)

**Fecha:** 2026-03-03

> Fuente operativa diaria del alcance activo.
> Este archivo contiene solo loops activos y dependencias inmediatas.

---

## Foco inmediato (P0 -> P2)

1. **P0 único:** `OL-CONTENT-001` — Mi diario v1 (privado) con secuencia interna `001.A -> 001.B -> 001.C`.
2. **P1:** `OL-EXPLORE-SEARCH-BATCH-001` — selección múltiple en búsqueda filtrada para marcar varios spots (`Por visitar` / `Visitados`).
3. **P2:** `OL-EXPLORE-TAGS-001` — tags personales en listados (chips en card + menú de chips + creador `#`) sin categorías Mapbox.

---

## Loops activos

- `OL-CONTENT-001` activo:
  - `001.A` foundation de persistencia privada por usuario,
  - `001.B` edición rápida accesible en SpotSheet/Search (imagen + nota breve + "por qué importa"),
  - `001.C` QA de estabilidad UX (teclado/overlays/sesión).
- Gamificación V1 activa en runtime:
  - score por países + spots,
  - niveles `X/12`,
  - chip de flows en perfil,
  - modal de niveles.
- V2 de gamificación: **solo documentación** (telemetría + calibración), sin implementación.

---

## Próxima cola (secuencial; no paralelizar)

1. `OL-CONTENT-001.A` — foundation de identidad + ownership (anon auth + tablas user-owned) para diario privado sin tocar copy global de `spots`.
2. `OL-CONTENT-001.B` — quick edit en SpotSheet/Search para `imagen pública + nota breve privada + por qué importa (diario privado)`.
3. `OL-CONTENT-001.C` — cierre QA/validación de experiencia y persistencia.
4. `OL-EXPLORE-SEARCH-BATCH-001` — batch status en búsqueda filtrada (`saved/visited`) con guardrails de sticky context + no-regresión de selección unitaria.
5. `OL-EXPLORE-TAGS-001` — tags personales por usuario para filtrar listados (sin categorías Mapbox en esta fase).
6. `OL-CONTENT-002` — Galería v1 (múltiples fotos por spot).
7. `OL-CONTENT-003` — Tourism schema v1.
8. `OL-CONTENT-004` — Entity resolution v1.
9. `OL-CONTENT-005` — Enrichment pipeline v1.
10. `OL-CONTENT-006` — Directions v1.

Reglas:
- 1 loop activo por vez.
- `OL-EXPLORE-SEARCH-BATCH-001` inicia solo después de cerrar `OL-CONTENT-001.A/B/C`.
- `OL-EXPLORE-TAGS-001` inicia solo después de cerrar `OL-EXPLORE-SEARCH-BATCH-001`.
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

- `OL-P3-002.B` cerrado y congelado; fixes `273` + `274` cerrados (Sticky Context + visibilidad labels core default en filtros activos).
- `OL-P3-002.B` hardening mini-mapa web (bloqueo zoom): bitácora `259`.
- `OL-P3-002.B` guardrails de share (snapshot/reintentos): bitácora `260`.
- `OL-P3-002.B` rediseño share card + descarga web: bitácora `261`.
- Gamificación niveles v2 (`X/12` + modal): bitácora `262`.
- Gamificación v3 (estilo barra/modal + copys): bitácora `263`.
- V2 documentada + ajuste inset horizontal mapa: bitácora `264`.
- Consolidación flows V1 (sheet/modal/share/overlay): bitácora `265`.
- Orden canónico KPI (`países -> spots -> flows`) en sheet/share + toast flows con guía mapa/buscador: bitácora `266`.
- QA fixes: toast flows simplificado + selector imagen Safari web + target nota breve ampliado + eliminación de borde mapa en share: bitácora `267`.
- Regla mapa en `Todos`: ocultar default vinculados a POI y dejar default Flowya no vinculados en azul: bitácora `268`.
- Fix de arquitectura teclado/foco en Paso 0 (owner único, blur solo en apertura): bitácora `269`.
- Ajuste visual pin default Flowya sin link (`+` y paleta base): bitácora `270`.
- Ajuste final de label default (swap relleno/sombra): bitácora `271`.
- Refactor arquitectura de capas para default no enlazado (zoom canónico sin artefactos) + contraste de contadores de filtro en light: bitácora `272`.
- Cierre definitivo de visibilidad spots core + política Sticky Context en transiciones de filtro (sin autoswitch): bitácora `273`.
- Follow-up visibilidad de labels para spots core `default` en filtros `saved/visited` (sin apagado al seleccionar): bitácora `274`.

---

## Avance de `OL-P3-002`

- `P3-002.A` completado (MVP base + locale/drilldown + reconstrucción canónica): bitácoras `236`, `237`, `238`.
- `P3-002.B` cerrado (QA/fixes consolidados; freeze de UI aplicado).

---

## Arranque activo (hoy)

1. Ejecutar `OL-CONTENT-001` como único loop activo.
2. Mantener freeze de `OL-P3-002.B` salvo bug crítico.
3. Cerrar `OL-CONTENT-001` por subfases (`001.A -> 001.B -> 001.C`) antes de abrir `OL-EXPLORE-SEARCH-BATCH-001`.
