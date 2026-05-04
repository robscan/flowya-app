# Contracts Index

Índice canónico de contratos en `docs/contracts/`. Actualizar cuando se agreguen o renombren contratos.

## Legal / privacidad (producto)

- **Política de privacidad (pantalla `/privacy`, texto canónico en código):** no hay contrato `.md` separado; OL cerrado **OL-PRIVACY-001** — bitácora [`350`](../bitacora/2026/04/350-ol-privacy-001-politica-y-ruta-privacidad.md), merge [`PR #140`](https://github.com/robscan/flowya-app/pull/140), plan [`PLAN_OL_PRIVACY_001`](../ops/plans/PLAN_OL_PRIVACY_001_2026-03-10.md).

## Contratos canónicos

- **EXPLORE_SHEET.md** — Sheet único Explore vNext: estados (collapsed/medium/expanded), modos (search/spot), no overlay, keyboard-safe.
- **EXPLORE_CHROME_SHELL.md** — Chrome inferior unificado (host único), modos welcome vs KPI, persistencia de estados, WR-01, flag de transición.
- **EXPLORE_WEB_DESKTOP_SIDEBAR_CANON.md** — Sidebar web ≥1080: variantes de ancho (400/720), animaciones, contenido por modo, checklist MapControls / capas.
- **APP_LOCALE_AND_MAP_LANGUAGE.md** — Locale canónico (`locale-config`), mapa Mapbox (`mapLanguage`), geocoding/búsqueda; rumbo a preferencia usuario + preview DS.
- **SPOT_SELECTION_SHEET_SIZING.md** — Spot selection → Sheet sizing: 1º tap MEDIUM, 2º tap mismo spot EXPANDED, cambio de spot MEDIUM, SearchResultCard MEDIUM; navegación a detalle solo desde CTA en sheet.
- **MOTION_SHEET.md** — Motion spec para sheets: duraciones, easing, snap (threshold/velocity), reduced motion, guardrails (translateY, keyboard-safe).
- **CANONICAL_BOTTOM_SHEET.md** — Contrato base reusable para cualquier sheet inferior (header, estados, drag/snap, sizing, integración con mapa/search).
- **SEARCH_V2.md** — Búsqueda V2: entry/exit en Explore, persistencia y clear, guardrails (no overlay, no duplicar DS).
- **MAPBOX_PLACE_ENRICHMENT.md** — Datos Mapbox en creación: campos que se importan (place_id, name, lat/lng, address, maki como sugerencia); campos que no.
- **GEO_IDENTITY_DEDUP_V1.md** — Identidad territorial V1: países/regiones/ciudades no son `spots`, tablas `geo_*`, aliases/refs y `user_geo_marks` owner-only.
- **SPOT_EDIT_MINI_SHEETS.md** — Edición por sección: SpotSheet + SubSheet (1 nivel), MVP Detalles y Categoría+etiquetas; guardrails (OL-021).
- **CREATE_SPOT_INLINE_SHEET.md** — Creación futura como inline sheet sobre el mapa; entry points, estados, campos MVP, capas; sin implementación hoy.
- **DESIGN_SYSTEM_USAGE.md** — Uso de componentes canónicos en Explore/Edit Spot; inventario mínimo vigente y matriz de deprecación.
- **DATA_MODEL_CURRENT.md** — Modelo de datos vigente (referencia operativa).
- **PROFILE_AUTH_CONTRACT_CURRENT.md** — Contrato de autenticación/perfil (referencia operativa).
- **PROFILE_VNEXT_MENU_KPIS.md** — Perfil vNext (web-first): menú + subpantallas + KPI “Países, lugares y flows” + niveles + desktop sidebar interactiva
- **PROFILE_KPI_STALE_WHILE_REVALIDATE.md** — KPI Perfil ↔ Explorar: caché warm en memoria, fetch deduplicado (`spots`+pins), stale-while-revalidate y UX sin salto de layout.
- **VISITED_COUNTRIES_SHARE_FLOW.md** — Compartir PNG «Países visitados»: API única (`visited-countries-share`), caché warm opcional, captura web offscreen; independiente del sheet de países.
- **MAP_PINS_CONTRACT.md** — Map pins: fuentes de verdad (`mapPinSpot`, `map-pin-metrics`, `spots-layer`), paridad DS ↔ Mapbox, `MAP_PIN_SIZES`, `defaultPinStyle`, animaciones, reglas anti-regresión (bitácora 321).
- **KEYBOARD_AND_TEXT_INPUTS.md** — Teclado y campos de texto: foco/teclado, CTA sticky sobre teclado, scroll cierra teclado.
- **RECORDAR_ENTRY_SPOT_SHEET.md** — Entry "Mi diario" en SpotSheet: condición (saved/visited), layout (dos botones en fila responsiva), accesibilidad.
- **CREATE_SPOT_LONG_PRESS.md** — Reglas long-press para create spot: solo un dedo, 3s, umbral arrastre 10px, multi-touch cancela.
- **SPOT_SHEET_CONTENT_RULES.md** — Sheet única para spots existentes; campos condicionales (mostrar si hay datos, ocultar si no).
- **ANTI_DUPLICATE_SPOT_RULES.md** — Prevención de duplicados: todo path de creación debe llamar checkDuplicateSpot antes del INSERT.
- **SYSTEM_STATUS_BAR.md** — Comunicación sistema-usuario: mensajes de estado, cola hasta 3 líneas, tono asistente de viaje; sustituye toast.
- **SYSTEM_STATUS_TOAST.md** — Implementación vigente (`system-status-bar.tsx`), anclaje Explore, política sheet `expanded` + toasts, checklist paridad **nativa** (iOS/Android).
- **ACTIVITY_SUMMARY.md** — Resumen de actividad del usuario (países visitados, lugares visitados, pendientes): métricas canónicas, reglas de cálculo, UX y guardrails.
- **PHOTO_SHARING_CONSENT.md** — Consentimiento one-shot para compartir fotos; preferencia editable en perfil; ON=fotos públicas, OFF=fotos privadas (URLs firmadas).
- **GAMIFICATION_TRAVELER_LEVELS.md** — Sistema de niveles de exploración + flows (V1 activa), fórmula canónica de score y definición V2 (eventos/telemetría/calibración).
- **explore/EXPLORE_RUNTIME_RULES_INDEX.md** — Índice modular runtime de Explore (mapa, filtros, controles, buscador) para reconstrucción/reuso cross-platform.
- **explore/SELECTION_DOMINANCE_RULES.md** — Dominancia visual de selección (spot/POI), supresión de labels competitivos y restauración de capas externas al salir de selección.

## Search

- **SEARCH_NO_RESULTS_CREATE_CHOOSER.md** — Contrato: “Sin resultados” → chooser explícito (anti-traición).
- Nota: `SEARCH_V2.md` ya está listado arriba como contrato canónico del modo búsqueda en Explore vNext.
