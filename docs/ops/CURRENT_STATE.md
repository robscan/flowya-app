# CURRENT_STATE — Flowya (operativo)

> Fuente de verdad del estado actual del proyecto.
> Snapshot operativo + memoria resumida.
> No es backlog ni planeación.
>
> 🔒 Regla: ningún chat/sprint se considera cerrado si este archivo no se actualiza.

---

## Ahora mismo

- **Sprint activo:** Explore V1 Strangler (core-first + UI replaceable).
- **Estado:** Gate A ✅, Gate B ✅ (core extraído), Gate C **PAUSADO** (V3 revertido/eliminado).
- **UI actual:** legacy (SpotSheet Reanimated + overlays existentes).
- **Core:** `core/shared/search/*` + `core/explore/*` (Search como shared capability).
- **Foco inmediato (P0→P2):**
  1) Soft delete consistente  
  2) Create Spot **siempre** desde creador mínimo (una sola ruta)  
  3) Rediseño de Edit Spot  
  4) Bugs detectados en pruebas (ver `docs/ops/OPEN_LOOPS.md`)

---

## Hoy (2026-02-22)

- **Plan Explore Anti-duplicados y UX cerrado:** Bitácora 114. MS-1 a MS-6: 3D default, contrato ANTI_DUPLICATE_SPOT_RULES, checkDuplicateSpot en todos los entry points, DuplicateSpotModal (Ver spot | Crear otro | Cerrar), pin visible en pasos draft, altura sheet draft adaptativa. Contrato `docs/contracts/ANTI_DUPLICATE_SPOT_RULES.md`.
- **Plan documentado (post-P0):** Ajustes Explore mapa + búsqueda en `docs/ops/PLAN_EXPLORE_AJUSTES_MAP_SEARCH.md` (MS-A a MS-E). MS-A, MS-B, MS-C, MS-D completados; MS-E pendiente.
- **Preview pin al seleccionar sugerencia de búsqueda (POI):** flyTo + pin en coordenadas del lugar. Bitácora 112.
- **Otros ajustes sesión:** Bitácora 113 — fix mapa post-edición (flyTo spot editado), placeholder buscador "Buscar en esta zona del mapa…", sheet POI unificado con SpotSheet, sync selectedSpot con filteredSpots, estado de carga al crear spot desde POI, nombre spot con wrap, desfase sheet expanded, controles y botón crear spot.
- Se consolida documentación y cambios de Explore/Search:
  - Search pill DS refactor; Map overlays redesign (entry icon Search derecha, FLOWYA abajo-izquierda).
  - MapPinFilterInline en Search; filtros + cerrar en fila 1, input ancho completo en fila 2.
  - Contrato KEYBOARD_AND_TEXT_INPUTS aplicado (CTA sticky, scroll cierra teclado).
  - MapControls: fix alineación (eliminado padding 4px del contenedor) para coincidir con botón Search.
  - OPEN_LOOPS actualizado con OL-FUT-001 (Galería imágenes) y OL-FUT-002 (Mi diario) — documentado para retomar.

---

## Sólido

- Explore (map-first) es público y estable (baseline).
- Search es capability shared (contratos Phase 1 vigentes).
- RLS activo en `spots`.
- Policies vigentes (esperado):
  - **SELECT:** público (`is_hidden = false`)
  - **INSERT/UPDATE:** solo usuarios autenticados
  - **DELETE físico:** deshabilitado
- Soft delete esperado vía `is_hidden` (si falta en migraciones, es OPEN LOOP).
