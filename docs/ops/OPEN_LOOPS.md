# OPEN_LOOPS — Flowya (alcance activo)

**Fecha:** 2026-04-12 — **`OL-SECURITY-VALIDATION-001` cerrado** (inventario RLS/migraciones + validación remota H1–H4). Loop activo siguiente: **`OL-PROFILE-001`**. Evidencia: bitácora [`353`](../bitacora/2026/04/353-ol-security-validation-001-cierre.md). *(Cierres previos: `OL-PRIVACY-001` — [`350`](../bitacora/2026/04/350-ol-privacy-001-politica-y-ruta-privacidad.md); `OL-CONTENT-002` — [`347`](../bitacora/2026/04/347-ol-content-002-cierre-web-galeria-paridad-deferida.md); `OL-WEB-RESPONSIVE-001` — [`345`](../bitacora/2026/04/345-ol-web-responsive-cierre-sidebar-mapa-paises-docs.md).)*

> Fuente operativa diaria del alcance activo.
> Este archivo contiene solo loops activos y dependencias inmediatas.
>
> **Estado del producto:** no existe `CURRENT_STATE.md`. El contexto operativo se deduce de **este archivo** + `docs/bitacora/*` (evidencia). Retiro de snapshot paralelo: bitácora `309`.

---

## Loop activo único (regla operativa)

- **Loop ejecutivo activo (único, ejecución):** **OL-PROFILE-001** — perfil de usuario más robusto sobre auth actual. Plan: [PLAN_OL_PROFILE_001_ROBUST_USER_PROFILE_2026-03-28.md](plans/PLAN_OL_PROFILE_001_ROBUST_USER_PROFILE_2026-03-28.md).
- **Cerrado recientemente:** **OL-SECURITY-VALIDATION-001** — inventario policies/migraciones, validación remota H1–H4, análisis en `docs/ops/analysis/`. Plan: [PLAN_OL_SECURITY_VALIDATION_001_2026-03-28.md](plans/PLAN_OL_SECURITY_VALIDATION_001_2026-03-28.md). Evidencia: bitácora [`353`](../bitacora/2026/04/353-ol-security-validation-001-cierre.md); inventario [`OL_SECURITY_VALIDATION_001_INVENTORY_2026-04-12.md`](analysis/OL_SECURITY_VALIDATION_001_INVENTORY_2026-04-12.md).
- **Cerrado recientemente (anterior):** **OL-PRIVACY-001** — política de privacidad en español, ruta `/privacy`, enlaces auth/beta. Plan: [PLAN_OL_PRIVACY_001_2026-03-10.md](plans/PLAN_OL_PRIVACY_001_2026-03-10.md). Evidencia: bitácora [`350`](../bitacora/2026/04/350-ol-privacy-001-politica-y-ruta-privacidad.md).
- **Cerrado recientemente (anterior):** **OL-CONTENT-002** — galería multi-foto (**solo web** en este cierre: crear/editar, sheet, lightbox, `spot_images` + lib). Paridad **nativa** (crear/editar en iOS/Android) **fuera de alcance** hasta decisión de producto/stack. Plan: [PLAN_OL_CONTENT_002_GALERIA_V1_2026-03-11.md](plans/PLAN_OL_CONTENT_002_GALERIA_V1_2026-03-11.md). Evidencia: bitácora [`347`](../bitacora/2026/04/347-ol-content-002-cierre-web-galeria-paridad-deferida.md); fase 1 DB/lib: [`346`](../bitacora/2026/04/346-ol-content-002-fase1-spot-images-db-lib.md).
- **Siguiente en lista (abierto para priorización; no activo en paralelo):** **OL-CONTENT-001** — Recordar-lite sobre `pins` (nota privada / entry desde SpotSheet).
- **En espera (cola — sin incluir el loop activo):**
  1. **OL-CONTENT-001** — Recordar-lite sobre `pins` (nota privada / entry desde SpotSheet).
  2. **OL-CONTENT-CLIMATE-UNITS-001** — clima por temporadas (normales en DB) + toggles °C/°F y km/mi ([PLAN_OL_CLIMATE_SEASONAL_AND_UNITS_V1.md](plans/PLAN_OL_CLIMATE_SEASONAL_AND_UNITS_V1.md)). *Dependencia suave:* perfil/settings para preferencias de unidades; puede arrancar con persistencia local web si se documenta la deuda.
  3. **OL-I18N-EN-001** — UI en inglés: **Explorar**, **auth**, **crear/editar/detalle spot** web, **mapa y geocoding** (misma fuente que `getCurrentLanguage()` — ver [`APP_LOCALE_AND_MAP_LANGUAGE.md`](../contracts/APP_LOCALE_AND_MAP_LANGUAGE.md)). **Design System (`/design-system`):** **incluido** como vitrina de componentes canónicos compartidos con Explore; conviene **preview es/en** (conmutador que no sustituye preferencia global del usuario hasta acordar UX). Sustituye la etiqueta histórica `OL-I18N-UI-001`. Ver [`PLAN_EXECUTION_POST_WR001_2026-04-12.md`](plans/PLAN_EXECUTION_POST_WR001_2026-04-12.md).
  4. **Auth** — social login (investigación / activación).
  5. **OL-METRICS-001** — actividad, retorno y comparación `Explore` vs `Recordar`.
  6. **OL-SEARCHV2-002** — fase investigación postergada (bitácora `301`).
  7. **`OL-EXPLORE-WEB-ZOOM-GUARD-001`** — postergado al final de cola: intento previo no se reflejó como esperado en sitio; el comportamiento nativo de zoom/navegador es aceptable para usuarios. Retry solo con prioridad explícita (diagnosticar deploy/cache/viewport si se retoma).

---

## Alcances nuevos (2026-04-12) — inventario

| OL | Alcance | Plan / contrato |
|----|---------|-----------------|
| **OL-WEB-RESPONSIVE-001** (**cerrado** 2026-04-12) | WR-01–WR-05 + sidebar desktop (`setPadding`, clip KPI/listado, mini-mapa países) | [PLAN_OL_WEB_RESPONSIVE…](plans/PLAN_OL_WEB_RESPONSIVE_COMPONENTS_001_2026-03-28.md), [EXPLORE_WEB_DESKTOP_SIDEBAR_CANON.md](../contracts/EXPLORE_WEB_DESKTOP_SIDEBAR_CANON.md) |
| **OL-CONTENT-002** (**cerrado** 2026-04-12, **alcance web**) | Galería `spot_images` + UI web crear/editar/exploración; paridad nativa no incluida | [PLAN_OL_CONTENT_002…](plans/PLAN_OL_CONTENT_002_GALERIA_V1_2026-03-11.md), bitácora [`347`](../bitacora/2026/04/347-ol-content-002-cierre-web-galeria-paridad-deferida.md) |
| **OL-PRIVACY-001** (**cerrado** 2026-04-12) | Política de privacidad ES, `/privacy`, enlaces auth/beta | [PLAN_OL_PRIVACY…](plans/PLAN_OL_PRIVACY_001_2026-03-10.md), bitácora [`350`](../bitacora/2026/04/350-ol-privacy-001-politica-y-ruta-privacidad.md) |
| **OL-SECURITY-VALIDATION-001** (**cerrado** 2026-04-12) | Inventario RLS/migraciones + validación H1–H4 | [PLAN_OL_SECURITY…](plans/PLAN_OL_SECURITY_VALIDATION_001_2026-03-28.md), inventario [`OL_SECURITY_VALIDATION_001_INVENTORY…`](analysis/OL_SECURITY_VALIDATION_001_INVENTORY_2026-04-12.md), bitácora [`353`](../bitacora/2026/04/353-ol-security-validation-001-cierre.md) |
| **OL-CONTENT-CLIMATE-UNITS-001** | Normales climáticas por estación en Supabase; tap °C↔°F y km↔mi | [PLAN_OL_CLIMATE_SEASONAL_AND_UNITS_V1.md](plans/PLAN_OL_CLIMATE_SEASONAL_AND_UNITS_V1.md) |
| **OL-I18N-EN-001** | EN en Explore + auth + flujos spot + mapa + DS (preview); locale unificado | [APP_LOCALE_AND_MAP_LANGUAGE.md](../contracts/APP_LOCALE_AND_MAP_LANGUAGE.md), [PLAN_EXECUTION_POST_WR001…](plans/PLAN_EXECUTION_POST_WR001_2026-04-12.md) |

---

## Decisiones producto (2026-04-12)

- **Sidebar desktop:** priorizar **transiciones** (entrada/salida, cambios de ancho) sobre incidencias puntuales en MapControls (validado: controles operativos; bug previo no reproducido).
- **`OL-I18N-EN-001`:** alcance = **Explorar + auth + crear/editar/detalle spot** + **mapa** (locale unificado) + **DS** como vitrina bilingüe de canónicos; ver contrato locale y capas API en gobernanza.
- **Login:** prioridad alta — **reducir abuso de APIs** (coste Mapbox/geocoding/etc.), además de UX; alinear con gate global de app cuando producto lo defina (`OL-PROFILE-001`, `OL-SECURITY-VALIDATION-001`, política anon). **Capas técnicas recomendadas:** [API_AND_AUTH_PROTECTION_LAYERS.md](governance/API_AND_AUTH_PROTECTION_LAYERS.md) (producto + identidad + RLS + proveedor + observabilidad).

## Seguimiento (abiertos pero no “en cola” de ejecución inmediata)

- `OL-SEARCHV2-EMPTY-K-ANONYMITY-001` (comportamiento aceptado con pocos usuarios); ítems búsqueda **OL-URGENT-MAKI-001** / **OL-URGENT-CLUSTER-001** marcados **abordados** en bitácora.
- **OL-EXPLORE-COLD-START-RETIRE-001** — Monitoreo: listas **fallback** de exploración inicial (buscador vacío + sheet bienvenida) usan `lib/search/coldStartWorldRecommendations.ts` mientras `useExploreColdStartFallback` sea verdadero (bootstrap de sesión o hasta primera carga de spots). **Objetivo de salida:** cuando haya densidad suficiente de datos/listados generados por usuarios, retirar cold-start y mostrar solo fuentes UGC/RPC; definir criterios cuantitativos (ej. volumen de spots, engagement) antes del corte. Código: `MapScreenVNext` (`useExploreColdStartFallback`, `shouldShowColdStartWorldEmpty`, `welcomeExploreListItems`).
- **Cierre de código reciente (2026-03-11):** PR #98 — lightbox en SpotSheet, ajuste de solapamiento de pin con filtro activo, plan [PLAN_OL_CONTENT_002_GALERIA_V1_2026-03-11.md](plans/PLAN_OL_CONTENT_002_GALERIA_V1_2026-03-11.md). Trazabilidad: bitácora `307`.
- **Integración reciente:** contrato SpotSheet + seguridad Supabase spots (PRs #101, #99, #100). Bitácora `308`. **Migraciones críticas** `018_spots_block_client_hard_delete.sql`, `018_spots_owner_write_guardrails.sql`: **aplicadas y verificadas** en entornos objetivo (2026-04-05).
- **Etiquetas Explore (2026-03-22):** PR #106 — `user_tags` / `pin_tags`, UI en búsqueda y sheet. Contratos `USER_TAGS_EXPLORE.md`, `SYSTEM_STATUS_TOAST.md`. Bitácora `310`. **Migraciones** `020_user_tags_pin_tags.sql`, `021_user_tags_set_user_id_trigger.sql`: **aplicadas y verificadas** en entornos objetivo (2026-04-05).
- **Follow-up etiquetas (2026-03-22):** PR #108 — fix regresión: chip de etiqueta en SpotSheet debía filtrar en `Todos` pero `pinFilter` limpiaba `selectedTagFilterId`. Sin cambio de contrato. Bitácora `311`.

---

## Estado general (contexto)

- Gates Fase 1 / Fase 2 / Fase 3 base y `OL-P2-006` / `OL-P1-003`: **cerrados** (histórico; bitácora `213` y anteriores).
- Trazabilidad reciente: bitácoras `307`–`337` (shell Explore, sidebar desktop, WR-04, etc.); **`OL-WEB-RESPONSIVE-001` cerrado** y **`OL-CONTENT-002` cerrado (web)** — 2026-04-12 — bitácoras `345`, `347`, ver § Cierres recientes.

---

## Riesgos macro vigentes

1. **Desalineación Recordar-lite vs diario expandido** — Mitigación: `OL-CONTENT-001` en nota breve + persistencia; sin timeline/feed complejo.
2. **Confusión gamificación V1 vs V2** — Mitigación: [docs/contracts/GAMIFICATION_TRAVELER_LEVELS.md](../contracts/GAMIFICATION_TRAVELER_LEVELS.md) (V1 runtime; V2 solo docs).
3. **UX map-first vs notas en SpotSheet** — Mitigación: validar overlays y transiciones de sheet (`peek/medium/expanded`).
4. **Deriva documental** — Mitigación: bitácora + `OPEN_LOOPS` en cada cierre de bloque (sin segundo snapshot).

---

## Proyecto: Experiencia de búsqueda (máxima prioridad estratégica)

- **OL-URGENT-MAKI-001** — Iconos Maki en listas: ResultRow y SearchResultCard usan `place.maki` / `spot.linked_maki` para mostrar icono de categoría. **Abordado** — bitácoras 302, 304. Allowlist Maki en spots-layer (mitigación DoS); revisión de seguridad PR #92 OK.
- **OL-URGENT-CLUSTER-001** — Clustering eliminado. Pins individuales únicos. Bitácora 303, 306.
- **OL-SEARCHV2-EMPTY-K-ANONYMITY-001** — Umbral k-anonymity `HAVING COUNT(*) >= 3` ya en 016; 017 redundante. Con pocos usuarios el empty-state puede no mostrar spots Flowya; comportamiento aceptado.
- **OL-SEARCHV2-002** — optimización API/costo: fase investigación **postergada** (inventario + instrumentación listos en bitácora `301`). Retomar sesiones + informe cuando sea prioritario.
- **Mejoras buscador (futuro):** lista de sugeridos, direcciones país/región/estado (geometría territorial para fit), base de datos curada (países/regiones/spots relevantes).

---

## Proyecto: Auth

- **Social login** — investigación y revisión para acelerar activación.

---

## Proyecto: Detalle de spot

- **Contenido:** descripción, fotos, galería — **OL-CONTENT-002 cerrado (web)**; paridad crear/editar en app nativa **diferida** (sin OL activo).
- **Diario y nota personal (OL-CONTENT-001)** — postergado; retomar tras cerrar experiencia de búsqueda y auth.
- **Otros ajustes** — según prioridad operativa.

---

## Cierres y postergados

- **OL-CONTENT-002:** cerrado 2026-04-12 (**alcance web** galería multi-foto; paridad nativa no incluida). Bitácora `347`.
- **OL-SPOTSHEET-EXPANDED-AUTH-GATE-001:** proyecto eliminado por completo. Tendencia: todo dentro de auth; por ahora anon permitido para testing. Política vigente: auth en mutaciones.
- **OL-EXPLORE-GLOBE-ENTRY-MOTION-001:** cerrado con QA en prod.
- **`OL-EXPLORE-WEB-ZOOM-GUARD-001`:** postergado al final de cola operativa; intento previo no se reflejó como esperado en sitio; comportamiento nativo de navegador aceptable. Retry solo con prioridad explícita.
- **OL-CONTENT-001:** postergado estratégicamente.
- **OL-SEARCHV2-001:** cerrado; abordado con ajustes recientes (landmarks visibles + fallback).
- **OL-SEARCHV2-EMPTY-VIEWPORT-001:** postergado (sustituido por OL-SEARCHV2-EMPTY-FLOWYA-POPULAR-001). Plan viewport/zoom descartado: preferir datos Flowya propios vs viewport sin intención de búsqueda.

---

## Loops activos / contexto

- Gamificación V1 activa en runtime: score por países + spots, niveles `X/12`, chip de flows en perfil, modal de niveles.
- V2 de gamificación: solo documentación (telemetría + calibración), sin implementación.

---

## Reglas

- 1 loop activo por vez.
- Máxima prioridad estratégica: experiencia de búsqueda.
- No abrir `OL-CONTENT-004/005` sin cerrar contratos y research previo.
- No bloquear UX principal por dependencias externas.
- **Cambios de alcance / DS / producto:** con cada ajuste cerrado, añadir entrada en `docs/bitacora/` y sincronizar este archivo (OL activo + trazabilidad).

---

## Proyecto: Política de privacidad / consentimiento

- **OL-PRIVACY-001** — **Cerrado (2026-04-12, MVP):** política en español, ruta `/privacy`, integración en modal de auth y modal beta. Bitácora [`350`](../bitacora/2026/04/350-ol-privacy-001-politica-y-ruta-privacidad.md). Plan: [PLAN_OL_PRIVACY_001_2026-03-10.md](plans/PLAN_OL_PRIVACY_001_2026-03-10.md).

---

## Proyecto: Explore shell / layout

- **OL-EXPLORE-RESTRUCTURE-001** — cerrado. Explore web ya cuenta con shell inferior `input + perfil`, filtros inline superiores responsivos, `FLOWYA` secundario, badge `países | flows`, coordinación con toast/logout y trigger de países visitados desde la banda inferior. Plan: [PLAN_OL_EXPLORE_RESTRUCTURE_001_2026-03-28.md](plans/PLAN_OL_EXPLORE_RESTRUCTURE_001_2026-03-28.md). Evidencia: bitácora `315`. Componente canónico de la pastilla `países | flows` + ajuste de anclaje de MapControls en peek: bitácora `322`.

---

## Proyecto: Seguridad / validación

- **OL-SECURITY-VALIDATION-001** — **Cerrado (2026-04-12):** inventario + validación remota H1–H4. Plan: [PLAN_OL_SECURITY_VALIDATION_001_2026-03-28.md](plans/PLAN_OL_SECURITY_VALIDATION_001_2026-03-28.md). Evidencia: bitácora [`353`](../bitacora/2026/04/353-ol-security-validation-001-cierre.md), análisis [OL_SECURITY_VALIDATION_001_INVENTORY_2026-04-12.md](analysis/OL_SECURITY_VALIDATION_001_INVENTORY_2026-04-12.md).

---

## Proyecto: Perfil / cuenta

- **OL-PROFILE-001** — Perfil de usuario más robusto sobre la auth actual: contrato de perfil, superficie web de cuenta, edición básica y logout/estado de sesión coherente. Plan: [PLAN_OL_PROFILE_001_ROBUST_USER_PROFILE_2026-03-28.md](plans/PLAN_OL_PROFILE_001_ROBUST_USER_PROFILE_2026-03-28.md).

---

## Proyecto: Métricas / retorno

- **OL-METRICS-001** — Medición de actividad, retorno y comparación `Explore` vs `Recordar`. Plan marco: [OL_METRICS_001_PROYECTO_METRICAS_TELEMETRIA.md](plans/OL_METRICS_001_PROYECTO_METRICAS_TELEMETRIA.md). Subplan detallado: [PLAN_OL_METRICS_001_ACTIVITY_RETENTION_2026-03-28.md](plans/PLAN_OL_METRICS_001_ACTIVITY_RETENTION_2026-03-28.md). Ejecutar antes de monetización y antes de `OL-SEARCHV2-002`. Vercel solo como complemento web; Supabase como fuente canónica.

---

## Postergados estratégicos (no ejecutar ahora)

- `OL-P0-002` — Create Spot canónico.
- `OL-P1-006` — Migración POI DB (maki/categorías).
- `OL-P1-007` — Pipeline turístico sin Google.
- `OL-P3-001` — superseded por `OL-WEB-RESPONSIVE-001` (**cerrado** 2026-04-12; el alcance ya no era solo `max-width: 720px` + alineación derecha).
- `OL-EXPLORE-SEARCH-BATCH-001` — tras cerrar búsqueda y auth. *`OL-I18N-UI-001` renombrado en la cola activa como* **`OL-I18N-EN-001`** *(ver inventario § Alcances nuevos).*
- **`OL-EXPLORE-TAGS-001`:** cerrado (PR #106, 2026-03-22). Evidencia: bitácora `310`, `docs/contracts/USER_TAGS_EXPLORE.md`. Follow-up de regresión QA: PR #108, bitácora `311`.

---

## Cierres recientes (trazabilidad)

- **`OL-SECURITY-VALIDATION-001` cerrado (2026-04-12):** inventario RLS/migraciones + validación H1–H4. Bitácora **`353`**. Loop activo siguiente: **`OL-PROFILE-001`**.
- **`OL-PRIVACY-001` cerrado (2026-04-12):** política de privacidad pública + enlaces UX. Bitácora **`350`**.
- **`OL-CONTENT-002` cerrado (2026-04-12, alcance web):** galería multi-foto (`spot_images`, lib, Storage), UI web crear/editar + exploración (grid, lightbox). Paridad nativa fuera de alcance. Plan: [PLAN_OL_CONTENT_002_GALERIA_V1_2026-03-11.md](plans/PLAN_OL_CONTENT_002_GALERIA_V1_2026-03-11.md). Bitácora **`347`**.
- **`OL-WEB-RESPONSIVE-001` cerrado (2026-04-12):** capa responsiva web-first (search, sheets, auth/formularios, QA multiviewport); desktop Explore con sidebar estable (`map.setPadding` vs `resize` en animación), clip 400↔720, mini-mapa países (`countries-map-preview.web`), toast estable. Plan: [PLAN_OL_WEB_RESPONSIVE_COMPONENTS_001_2026-03-28.md](plans/PLAN_OL_WEB_RESPONSIVE_COMPONENTS_001_2026-03-28.md). Bitácora **`345`**.
- Etiquetas personales Explore (`OL-EXPLORE-TAGS-001`): merge PR #106; contratos y DS actualizados. Bitácora `310`. Regresión tag filter chip → búsqueda filtrada: PR #108. Bitácora `311`.
- `OL-EXPLORE-RESTRUCTURE-001` cerrado: shell web más accionable, filtros superiores responsivos, banda inferior `input + perfil`, coordinación `FLOWYA` / toast / logout y badge `países | flows`. Bitácora `315`.
- `OL-EXPLORE-LOCALE-CONSISTENCY-001` cerrado y mergeado (PR #86). Bitácora `298`.
- `OL-SEARCHV2-EMPTY-FLOWYA-POPULAR-001` cerrado: migración 016 ejecutada, smoke OK. Bitácora `299`.
- `OL-SEARCHV2-001` cerrado: abordado con ajustes recientes (landmarks visibles + fallback). Plan OL-SEARCHV2-002 investigation-first: bitácora `300`.
- OL-SEARCHV2-002 investigación fase 1: inventario API Mapbox + instrumentación (`lib/mapbox-api-metrics.ts`): bitácora `301`.
- OL-URGENT-MAKI-001 (iconos Maki en listas ResultRow/SearchResultCard): bitácora `302`. Allowlist Maki + revisión de seguridad PR #92: bitácora `304`.
- OL-URGENT-CLUSTER-001 (clustering Mapbox pins + densidad): bitácora `303`.
- Pins por visitar/visitados: iconos Pin/CheckCircle (Lucide), tipografía clusters/chips: bitácora `305`.
- Feedback UX (distancia sin ubicación, etiqueta resultados), eliminación clustering, geoloc persiste entre sesiones: bitácora `306`. PR #97.
- SpotSheet lightbox imágenes; mitigación solapamiento pin con filtro activo; plan galería OL-CONTENT-002 guardado: bitácora `307`, PR #98.
- Contrato SpotSheet (POI/lightbox); seguridad Supabase spots (migraciones `018` — hard delete, owner writes, `hide_spot`): bitácora `308`, PRs #101, #99, #100.
- Retiro `CURRENT_STATE.md`; fuente única OPEN_LOOPS + bitácora: bitácora `309`.
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
- Paridad Design System ↔ Mapbox (`map-pin-metrics`, tokens `mapPinSpot`, `defaultPinStyle`, contrato `MAP_PINS_CONTRACT`): bitácora `321`.
- DS Explore: `TravelerLevelsList` / `TravelerLevelsModal` en vitrina; `ExploreCountriesFlowsPill` + `ExploreMapStatusRow`; MapControls elevados en peek para no tapar pastilla; `layer-z` FLOWYA sin hack de z sobre controles: bitácora `322`.
- Taxonomía vitrina: `SheetHandle` en **Componentes** (no Templates); ancla `ds-comp-sheet-handle`: bitácora `323`.
- Vitrina Explore: sin `SearchPill` / `SearchLauncherField` aislados; tab plantilla `explore` eliminado: bitácora `324`.
- `ds-pat-explore` con FLOWYA + `ExploreMapStatusRow` y logout tras tap en perfil: bitácora `325`.
- Vitrina **SearchSurface** (`ds-run-surface`, `SearchSurfaceShowcase`): bitácora `326`.
- **`SearchListCard`** layout tres filas (título+chevron; contenido; meta a ancho completo): bitácora `327`.
- **Explore welcome + cold-start + persistencia CountriesSheet + toasts**; inventario DS y contratos alineados: bitácora `329`.
- **CountriesSheet UX + toasts + filtros + banda inferior WR-01**; vitrina `ds-pat-explore` y demo filtros con conteo 0: bitácora `330`.
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
- Avance P0 entrada globo con motion de cámara (`flyTo` world con guardrails anti-regresión): bitácora `296`.
- OL-EXPLORE-LOCALE-CONSISTENCY-001 (unificar idioma mapa/buscador/dirección): bitácora `297`.
- Follow-up Explore: ghost refetch + sync contratos Explore/deep link (`316`). `mergeSpotFromDbById` y refetch seguro; contratos `DEEP_LINK_SPOT`, `FILTER_RUNTIME_RULES`, `MAP_RUNTIME_RULES`.
- Follow-up Explore: focus refresh distingue error vs missing en merge rápido (`317`); reduce reconciliación incorrecta ante fallos transitorios Supabase.

---

## Avance de `OL-P3-002`

- `P3-002.A` completado (MVP base + locale/drilldown + reconstrucción canónica): bitácoras `236`, `237`, `238`.
- `P3-002.B` cerrado (QA/fixes consolidados; freeze de UI aplicado).

---

## Arranque activo (histórico 2026-03-22; actualizado 2026-04-12)

1. **Ops sincronizada:** reconciliación calendario vs repo (bitácora `307`); integración 2026-03-21 PRs #101 / #99 / #100 (contrato + RLS spots). Bitácora `308`. Retiro snapshot `CURRENT_STATE.md` (bitácora `309`). **Integración 2026-03-22:** PRs #104–#106 (búsqueda/Mapbox, ubicación, etiquetas Explore). Bitácora `310`. **Follow-up:** PR #108 (fix chip etiqueta en sheet). Bitácora `311`.
2. **Loop activo (2026-04-12):** **`OL-PROFILE-001`**. **`OL-SECURITY-VALIDATION-001` cerrado** (bitácora `353`). **`OL-PRIVACY-001` cerrado** (bitácora `350`). **`OL-CONTENT-002` cerrado** (bitácora `347`). **`OL-WEB-RESPONSIVE-001` cerrado** (bitácora `345`).
3. **Smoke 306 cerrado:** validación post-merge (mapa sin clusters, distancia sin ubicación, etiqueta N resultados, geoloc persist).
4. **OL-SEARCHV2-002** — postergado; retomar sesiones + informe cuando prioritario.
5. Mantener freeze de `OL-P3-002.B` salvo bug crítico.
6. Perfil/actividad: si se reactiva, alinearlo con `OL-METRICS-001` y `ACTIVITY_SUMMARY`; no abrir tracking paralelo ad hoc.
7. Web-first: `OL-EXPLORE-RESTRUCTURE-001` y **`OL-WEB-RESPONSIVE-001` cerrados**; **`OL-CONTENT-002` cerrado** (galería web); **`OL-PRIVACY-001` cerrado**; **`OL-SECURITY-VALIDATION-001` cerrado**; siguiente foco: **`OL-PROFILE-001`** → **`OL-CONTENT-001`** → …
8. No mover `Auth` social login antes de cerrar **`OL-SECURITY-VALIDATION-001`** (hecho 2026-04-12) y avanzar **`OL-PROFILE-001`**.
9. **OL-WEB-RESPONSIVE-001** — **cerrado**; plan: [PLAN_OL_WEB_RESPONSIVE_COMPONENTS_001_2026-03-28.md](plans/PLAN_OL_WEB_RESPONSIVE_COMPONENTS_001_2026-03-28.md).
10. Orden de cola vigente: ver sección **Loop activo único** y lista **En espera** → … → OL-SEARCHV2-002 → **`OL-EXPLORE-WEB-ZOOM-GUARD-001` al final** (postergado).
