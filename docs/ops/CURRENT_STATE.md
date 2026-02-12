# CURRENT_STATE — Flowya (operativo)

> Fuente de verdad del estado actual del proyecto.
> Snapshot operativo + memoria resumida.
> No es backlog ni planeación.
>
> 🔒 Regla: ningún chat/sprint se considera cerrado si este archivo no se actualiza.

---

## Ahora mismo

- **Scope activo:** Create spot E2E cerrado (map-first). Merge a main en curso (rama `fix/ol-056-to-ol-061-spot-sheet-search`).
- **Branch activa:** Tras cierre del día: `main`; rama de trabajo mergeada y eliminada.
- **Estado del repo:** Código + docs versionados en commit de cierre.
- **Entorno:** Web mobile (Explore público) + Search web overlay activo.

---

## Hoy (2026-02-11)

- **Create spot E2E cerrado (map-first):** Sin resultados → “Crear spot nuevo aquí” → placing → Confirmar ubicación → BORRADOR (imagen opcional, 1 cover) → Crear spot → spot persistido → sheet expanded → “Editar detalles” → Edit Spot sin hero.
- **Auth gate:** Sin sesión, “Crear spot nuevo aquí” y “Crear spot” (BORRADOR) abren modal de auth; no se crea draft ni se inserta. Reutilizado `requireAuthOrModal` (bitácora 048).
- **CTA:** “Editar detalles” en SpotSheet/card; tap navega a `/spot/[id]?edit=1`.
- **Edit Spot:** Sin hero (back en header); mapa pasivo + Editar ubicación.
- **Imagen:** 1 cover (sin galería); pipeline existente `optimizeSpotImage` + `uploadSpotCover`; reutiliza `cover_image_url`.
- **DB:** Tabla `spots` no tiene `user_id` (solo `pins`); insert corregido para no enviar `user_id`. Ver bitácora 082.

---

## Sólido

- Explore (map-first) es público y estable.
- RLS activo en `spots`.
- Policies vigentes:
  - **SELECT:** público (`is_hidden = false`)
  - **INSERT:** solo usuarios autenticados
  - **UPDATE:** solo usuarios autenticados
  - **DELETE físico:** deshabilitado
- Soft delete activo vía `is_hidden` (columna puede no estar en migraciones 001/002; ver OPEN_LOOPS).
- Trazabilidad de creación:
  - La tabla `spots` **no** tiene columna `user_id` (solo `pins` la tiene); los INSERTs en spots no envían `user_id`. Ver bitácora 082.
- UX de creación protegida:
  - Usuarios no autenticados **no acceden** al wizard
  - Se reutiliza el modal de login existente
  - No aparecen errores técnicos de RLS en UI
- **Alineación UI ↔ RLS (2026-02-08):**
  - Usuarios no autenticados **no ejecutan mutaciones**: la UI oculta Editar y Eliminar spot cuando no hay auth; Feedback exige auth antes de enviar.
  - **Guardar pin** permanece visible como CTA de conversión: sin auth abre modal de login; con auth ejecuta mutación. No se oculta por falta de auth.
  - Handlers mutantes comprueban auth en runtime (getUser antes de mutar); sin usuario → openAuthModal y return. Errores RLS se muestran (toast), no hay éxito falso.
  - Eliminación de spots = solo soft delete (`is_hidden = true`); no hay `DELETE` real sobre `spots`. Soft delete funciona con auth válido.
- Sistema retomable sin memoria de chat.
- Reglas de cierre y ejecución formalizadas.
- **Riesgos aceptados:** Supabase Database Advisor muestra WARN por SELECT públicos (p. ej. auth_allow_anonymous_sign_ins). En FLOWYA es decisión de producto (explore/sharing); no implica mutaciones abiertas. Ver DECISIONS.md. No modificar políticas para “corregir” warnings sin decisión explícita.

---

## Frágil / Atención

- SearchSheet en iOS web (OL-052c): mitigado en web por overlay (OL-052d, bitácoras 077–078); native mantiene sheet.
- Deploy (OL-055): Vercel marca “ready” pero el alias/traffic no queda “current” (riesgo de creer que main está live).
- Ownership **no enforceado** en DB (decisión consciente).
- Soft delete **solo reversible desde Supabase** (no desde UI).
- No hay panel de moderación (fuera de alcance actual).
- Soft delete "Eliminar spot" pendiente de verificación en UI (posible caché/query/filtros).

---

## Historial relevante (memoria resumida)

- **OL-007 — RLS en `spots` (DONE)**
  - Eliminada escritura anónima.
  - SELECT público mantiene Explore.
  - DELETE físico deshabilitado.

- **Trazabilidad de spots (DONE)**
  - `user_id` agregado y poblado.
  - INSERTs envían `user_id` desde la app.

- **OL-009 — UX Auth Gate en creación de spots (DONE)**
  - Bloqueo en entry points (search, mapa).
  - Bloqueo al montar `/create-spot`.
  - Reutilización del modal de login existente.
  - Eliminado error técnico de RLS en UX.

- **OL-019 — Contracts Explore vNext (DONE, 2026-02-09)**
  - Creada carpeta canónica `docs/contracts/` con EXPLORE_SHEET.md, SEARCH_V2.md, DESIGN_SYSTEM_USAGE.md.
  - Contratos describen lo ya definido en ops/definitions; OPEN LOOP explícito donde no hay definición (inventario DS, reglas detalladas de drag). Ver bitácora 049.

- **OL-022 — Long-press create spot en vNext map (DONE, 2026-02-09)**
  - Causa: onLongPress en MapScreenVNext era no-op `() => {}`. Fix: handler con requireAuthOrModal + navegación a /create-spot con lat/lng y params de mapa. Ver bitácora 051.

- **OL-024 — Confirmación long-press create spot (DONE, 2026-02-09)**
  - Paridad con v0: modal "¿Crear spot aquí?" con checkbox "No volver a mostrar". Key localStorage: `flowya_create_spot_skip_confirm` (misma que v0). Ver bitácora 052.

- **OL-025 — Create spot prefill coords from query (DONE, 2026-02-09)**
  - Al abrir /create-spot?lat=...&lng=... el wizard inicializa `location` con esas coords (address null; sin reverse aquí). Ver bitácora 053.

- **OL-026 — Create spot map camera from query (DONE, 2026-02-09)**
  - Cuando vienen mapLng/mapLat/mapZoom (y opc. mapBearing/mapPitch), el mapa del paso 1 usa esa cámara vía preserveView + initialViewState en MapLocationPicker. Sin params, flujo igual. Ver bitácora 054.

- **OL-028 — No reload / no camera jump (DEFERRED)** — Intento revertido; creación será inline sheet; no prioritario.

- **Alineación UI ↔ RLS (DONE, 2026-02-08)**
  - Editar / Eliminar spot ocultos sin auth; Feedback solo con auth. Guardar pin visible siempre (CTA; sin auth → modal login).
  - Comprobaciones defensivas en runtime (getUser antes de mutar); sin usuario → openAuthModal. Toast de error ante fallo RLS; nunca éxito falso.
  - Soft delete como única vía de eliminación de spots; handleDeleteSpot abre modal si no auth.
  - Bitácoras: `042-ui-rls-alignment.md`, `043-pin-cta-publico.md`, `043-soft-delete-auth-alignment.md`.

- **OL-052 — SearchSheet keyboard-safe (DONE)**
  - Con teclado abierto en mobile/web: input + lista visibles sin empalme. SearchFloating usa visualViewport en web (paddingBottom) + KeyboardAvoidingView en iOS. PR #28 merge 851e690. Ver bitácora 075.

- **Search web overlay rebuild (2026-02-10, rama fix/search-web-rebuild-overlay)**
  - Web: Search pasa a overlay fijo (no sheet); transparencia overlayScrim, scroll-lock body, X cierra con teclado abierto. Native: sheet sin cambios. Ver bitácora 077 y OL-052d.
- **Search web overlay fix móvil (2026-02-10, misma rama)**
  - Overlay anclado al visual viewport; scroll-lock con body position fixed + restauración scrollY; animación de entrada eliminada (estabilidad 2ª apertura); refresh de viewport al abrir. Ver bitácora 078.

- **OL-056..061 — Spot sheet + Search UX (DONE, 2026-02-11)**
  - OL-056: State machine spot→sheet (1º tap MEDIUM, 2º tap mismo EXPANDED; fix 3er spot invisible). OL-057: SearchResultCard → MEDIUM. OL-058: SpotSheet padding/safe-area collapsed. OL-059: Gap recientes. OL-060: Sin empty cuando no hay recientes/resultados. OL-061: Contrato SPOT_SELECTION_SHEET_SIZING.md. Ver bitácora 080.

---

## Guardrails activos

- `main` protegido: NO direct commit / NO direct push.
- Todo cambio va por **rama + PR** (incluido docs-only).
- `OPEN_LOOPS.md` solo se entrega cuando define alcance diario.
- No abrir Flow ni Recordar completos sin decisión explícita.
- Seguridad primero; UX después, sin romper Explore.

---

## Next step sugerido (no obligatorio)

- **Top 1:** Implementar OL-021 (UI spot edit mini-sheets; contrato en docs/contracts/SPOT_EDIT_MINI_SHEETS.md). Hoy no se ejecutó.
- OL-023 (categorías internas / maki): pendiente; hoy no se ejecutó.
- Explore quality hardening (docs-only hoy): OL-050..054 formados; no implementados.
- Create spot inline sheet: contrato listo (docs/contracts/CREATE_SPOT_INLINE_SHEET.md); implementación pendiente.
- UX copy: mensaje humano previo al login (“Inicia sesión para crear spots”).
- Definir heurísticas simples de spam (volumen por `user_id`).
- Continuar con flows / producto.