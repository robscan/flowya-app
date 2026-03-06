# OPEN_LOOPS — Flowya (alcance activo)

**Fecha:** 2026-03-06

> Fuente operativa diaria del alcance activo.
> Este archivo contiene solo loops activos y dependencias inmediatas.

---

## Foco inmediato (P0 -> P2)

1. **P0 crítico (bloqueante web):** `OL-EXPLORE-WEB-ZOOM-GUARD-001` — prevenir zoom del navegador por doble tap/doble click en modales/cards para evitar pérdida de controles.
2. **P0 gate de activación:** `OL-SPOTSHEET-EXPANDED-AUTH-GATE-001` — eliminar auth prematuro al expandir sheet (`medium -> expanded`); lectura libre de detalle y auth solo en mutaciones.
3. **P0 único de producto:** `OL-CONTENT-001` — Mi diario v1 (privado) con secuencia interna `001.A -> 001.B -> 001.C` (retomar solo tras cerrar gates P0).
4. **P1:** `OL-EXPLORE-LOCALE-CONSISTENCY-001` — consistencia de idioma entre mapa, nombre seleccionado y dirección (política canónica de locale + fallback).
5. **P2:** `OL-I18N-UI-001` — base de internacionalización de interfaz (ES canónico actual, EN target) para UI/sheets/copy de producto con diccionario y fallback controlado.
6. **P2 siguiente:** `OL-EXPLORE-SEARCH-BATCH-001` — selección múltiple en búsqueda filtrada para marcar varios spots (`Por visitar` / `Visitados`).
7. **P2 siguiente:** `OL-EXPLORE-TAGS-001` — tags personales en listados (chips en card + menú de chips + creador `#`) sin categorías Mapbox.

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
2. `OL-EXPLORE-WEB-ZOOM-GUARD-001` — hotfix fatal web: bloquear zoom por double-tap/double-click en modales/cards y preservar visibilidad/operabilidad de controles.
3. `OL-SPOTSHEET-EXPANDED-AUTH-GATE-001` — gate UX/activación: `medium -> expanded` sin auth, loader neutral `Cargando información...`, auth solo en mutaciones (`guardar/visitar/editar/crear`).
4. `OL-CONTENT-001.B` — quick edit en SpotSheet/Search para `imagen pública + nota breve privada + por qué importa (diario privado)`.
5. `OL-CONTENT-001.C` — cierre QA/validación de experiencia y persistencia.
6. `OL-EXPLORE-LOCALE-CONSISTENCY-001` — unificar idioma visible de nombre/dirección seleccionada con política de locale de producto (`es` actual + fallback controlado).
7. `OL-I18N-UI-001` — habilitar infraestructura i18n (`es`/`en`) en interfaz y sheets con extracción de strings, claves canónicas y fallback por locale.
8. `OL-EXPLORE-SEARCH-BATCH-001` — batch status en búsqueda filtrada (`saved/visited`) con guardrails de sticky context + no-regresión de selección unitaria.
9. `OL-EXPLORE-TAGS-001` — tags personales por usuario para filtrar listados (sin categorías Mapbox en esta fase).
10. `OL-SEARCHV2-001` — ajuste ASAP: `Todos + query vacía` con prioridad en landmarks visibles + fallback externo seguro (sin lógica paralela fuera de SearchV2).
11. `OL-SEARCHV2-002` — optimización API/costo: cache híbrida (L1+L2), TTL y frescura controlada en SearchV2.
12. `OL-CONTENT-002` — Galería v1 (múltiples fotos por spot).
13. `OL-CONTENT-003` — Tourism schema v1.
14. `OL-CONTENT-004` — Entity resolution v1.
15. `OL-CONTENT-005` — Enrichment pipeline v1.
16. `OL-CONTENT-006` — Directions v1.

Reglas:
- 1 loop activo por vez.
- `OL-EXPLORE-WEB-ZOOM-GUARD-001` es gate de seguridad web: no continuar `OL-CONTENT-001` si el bug fatal de pérdida de controles sigue reproducible.
- `OL-SPOTSHEET-EXPANDED-AUTH-GATE-001` es gate de activación: no continuar `OL-CONTENT-001.B/C` ni abrir features nuevas mientras se reproduzca auth en expansión `medium -> expanded` sin mutación explícita.
- `OL-EXPLORE-SEARCH-BATCH-001` inicia solo después de cerrar `OL-CONTENT-001.A/B/C` y `OL-SPOTSHEET-EXPANDED-AUTH-GATE-001`.
- `OL-EXPLORE-LOCALE-CONSISTENCY-001` inicia solo después de cerrar `OL-CONTENT-001.A/B/C` y antes de abrir batch/tags para evitar propagar strings/direcciones inconsistentes.
- `OL-I18N-UI-001` inicia solo después de cerrar `OL-EXPLORE-LOCALE-CONSISTENCY-001`.
- `OL-EXPLORE-SEARCH-BATCH-001` inicia solo después de cerrar `OL-I18N-UI-001`.
- `OL-EXPLORE-TAGS-001` inicia solo después de cerrar `OL-EXPLORE-SEARCH-BATCH-001`.
- `OL-SEARCHV2-001` inicia después de cerrar `OL-EXPLORE-TAGS-001` o antes solo si se aprueba excepción por bug UX crítico (sin abrir paralelo con P0 activo).
- `OL-SEARCHV2-002` inicia solo después de cerrar `OL-SEARCHV2-001`.
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
- Search empty local sin fallback API + ajustes de Map Controls (`reframe`/world) + fallback inicial Torre Eiffel: bitácora `285`.
- Fix transversal permisos geoloc on-demand (sin prompt en carga) + guía en `denied` persistente: bitácora `286`.
- Fix transversal copy auth (guardar/marcar + enlace seguro sin contraseña): bitácora `287`.
- Fix transversal copy buscador (placeholder/entry): `países, regiones o lugares`: bitácora `288`.
- Fix runtime de búsqueda en cold-start global: tendencias de `paises/lugares` con desactivación por primera interacción: bitácora `289`.
- Fix UX de selección geográfica en búsqueda: `country/region` ahora encuadra territorio completo (`fitBounds` + fallback seguro): bitácora `290`.
- Ajuste UX/branding en Explore: slogan de entrada `SIGUE LO QUE TE MUEVE...` con fade temporal y posicionamiento bajo filtros: bitácora `291`.
- Follow-up visual de slogan en Explore: ajuste de tipografía/sombra para legibilidad sobre fondo oscuro: bitácora `292`.
- Cierre visual/copy de slogan en Explore: versión final en dos líneas `SIGUE LO QUE` / `TE MUEVE`: bitácora `293`.
- Fix técnico de `Mi ubicación` en Explore: estado programático solo cuando existe movimiento real de cámara: bitácora `294`.
- Plan de gate de activación SpotSheet (`expanded` sin auth + loader neutral): bitácora `295`.

---

## Avance de `OL-P3-002`

- `P3-002.A` completado (MVP base + locale/drilldown + reconstrucción canónica): bitácoras `236`, `237`, `238`.
- `P3-002.B` cerrado (QA/fixes consolidados; freeze de UI aplicado).

---

## Arranque activo (hoy)

1. Cerrar `OL-CONTENT-001.A`.
2. Ejecutar `OL-EXPLORE-WEB-ZOOM-GUARD-001` como hotfix bloqueante y validar no-regresión web.
3. Ejecutar `OL-SPOTSHEET-EXPANDED-AUTH-GATE-001` como gate de activación (sin auth prematuro en `expanded`).
4. Retomar `OL-CONTENT-001.B -> 001.C`.
5. Ejecutar `OL-EXPLORE-LOCALE-CONSISTENCY-001`.
6. Ejecutar `OL-I18N-UI-001` (infra de idioma UI/sheets).
7. Mantener freeze de `OL-P3-002.B` salvo bug crítico.
8. Abrir `OL-EXPLORE-SEARCH-BATCH-001` solo después de cerrar los gates anteriores.
