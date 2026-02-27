# Contracts Index

Índice canónico de contratos en `docs/contracts/`. Actualizar cuando se agreguen o renombren contratos.

## Contratos canónicos

- **EXPLORE_SHEET.md** — Sheet único Explore vNext: estados (collapsed/medium/expanded), modos (search/spot), no overlay, keyboard-safe.
- **SPOT_SELECTION_SHEET_SIZING.md** — Spot selection → Sheet sizing: 1º tap MEDIUM, 2º tap mismo spot EXPANDED, cambio de spot MEDIUM, SearchResultCard MEDIUM; navegación a detalle solo desde CTA en sheet.
- **MOTION_SHEET.md** — Motion spec para sheets: duraciones, easing, snap (threshold/velocity), reduced motion, guardrails (translateY, keyboard-safe).
- **SEARCH_V2.md** — Búsqueda V2: entry/exit en Explore, persistencia y clear, guardrails (no overlay, no duplicar DS).
- **MAPBOX_PLACE_ENRICHMENT.md** — Datos Mapbox en creación: campos que se importan (place_id, name, lat/lng, address, maki como sugerencia); campos que no.
- **SPOT_EDIT_MINI_SHEETS.md** — Edición por sección: SpotSheet + SubSheet (1 nivel), MVP Detalles y Categoría+etiquetas; guardrails (OL-021).
- **CREATE_SPOT_INLINE_SHEET.md** — Creación futura como inline sheet sobre el mapa; entry points, estados, campos MVP, capas; sin implementación hoy.
- **DESIGN_SYSTEM_USAGE.md** — Uso de componentes canónicos en Explore/Edit Spot; inventario mínimo vigente y matriz de deprecación.
- **DATA_MODEL_CURRENT.md** — Modelo de datos vigente (referencia operativa).
- **PROFILE_AUTH_CONTRACT_CURRENT.md** — Contrato de autenticación/perfil (referencia operativa).
- **MAP_PINS_CONTRACT.md** — Map pins: tamaños, jerarquía de capas (ubicación > seleccionado > resto), animaciones.
- **KEYBOARD_AND_TEXT_INPUTS.md** — Teclado y campos de texto: foco/teclado, CTA sticky sobre teclado, scroll cierra teclado.
- **RECORDAR_ENTRY_SPOT_SHEET.md** — Entry "Mi diario" en SpotSheet: condición (saved/visited), layout (dos botones en fila responsiva), accesibilidad.
- **CREATE_SPOT_LONG_PRESS.md** — Reglas long-press para create spot: solo un dedo, 3s, umbral arrastre 10px, multi-touch cancela.
- **SPOT_SHEET_CONTENT_RULES.md** — Sheet única para spots existentes; campos condicionales (mostrar si hay datos, ocultar si no).
- **ANTI_DUPLICATE_SPOT_RULES.md** — Prevención de duplicados: todo path de creación debe llamar checkDuplicateSpot antes del INSERT.
- **SYSTEM_STATUS_BAR.md** — Comunicación sistema-usuario: mensajes de estado, cola hasta 3 líneas, tono asistente de viaje; sustituye toast.
- **ACTIVITY_SUMMARY.md** — Resumen de actividad del usuario (países visitados, lugares visitados, pendientes): métricas canónicas, reglas de cálculo, UX y guardrails.
- **explore/EXPLORE_RUNTIME_RULES_INDEX.md** — Índice modular runtime de Explore (mapa, filtros, controles, buscador) para reconstrucción/reuso cross-platform.
- **explore/SELECTION_DOMINANCE_RULES.md** — Dominancia visual de selección (spot/POI), supresión de labels competitivos y restauración de capas externas al salir de selección.

## Search

- **SEARCH_NO_RESULTS_CREATE_CHOOSER.md** — Contrato: “Sin resultados” → chooser explícito (anti-traición).
- Nota: `SEARCH_V2.md` ya está listado arriba como contrato canónico del modo búsqueda en Explore vNext.
