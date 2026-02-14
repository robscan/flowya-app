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

## Hoy ({today})

- Se consolida documentación para reflejar:
  - V3 UI cancelado y removido (ver `docs/ops/DEPRECATED_V3_CLEANUP.md`).
  - Plan actualizado: Gate C pausado; sprint actual es estabilización P0/P1 sobre core extraído.
  - OPEN_LOOPS actualizado con bugs detectados y nuevas prioridades.

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
