# Bitácora 100 (2026/02) — Plan Recordar, guardrails deprecación, docs

**Fecha:** 2026-02-14

**Objetivo:** Documentar Plan Recordar (Mi diario), guardrails de deprecación, contratos y open loops para retomar sin pérdida de contexto. Prioridad actual: ajustes pantalla Explore; estos docs son para ejecución futura.

---

## 1. Documentos creados/actualizados

| Documento | Acción | Propósito |
|-----------|--------|-----------|
| `docs/ops/plans/PLAN_RECORDAR_MI_DIARIO.md` | Nuevo | Plan completo Recordar: capacidad Explorar vNext, entry point SpotSheet (dos botones), modelo datos, fases EP-1 a EP-5 |
| `docs/ops/governance/GUARDRAILS_DEPRECACION.md` | Nuevo | Reglas 3 fases (Marcar → Desconectar → Eliminar); tabla elementos deprecated; checklist pre-eliminación; vigilancia |
| `docs/contracts/RECORDAR_ENTRY_SPOT_SHEET.md` | Nuevo | Contrato entry "Mi diario": visibilidad (saved\|visited), layout (misma fila, responsivo), accesibilidad |
| `docs/ops/OPEN_LOOPS.md` | Editado | OL-DEPREC-001 (limpieza deprecated); OL-FUT-002 actualizado con refs a plan y contrato |
| `docs/ops/plans/PLAN_SPOT_GALLERY_MI_DIARIO.md` | Editado | Feature 2 (Mi diario) apunta a PLAN_RECORDAR_MI_DIARIO; Feature 1 (Galería) intacta |
| `docs/contracts/INDEX.md` | Editado | Añadido RECORDAR_ENTRY_SPOT_SHEET |

---

## 2. Decisiones registradas

- **Entry point Recordar:** Desde "Por visitar" (no solo Visitado); dos botones en misma fila (estado + Mi diario); layout responsivo.
- **SpotDetail en Explorar:** No es flujo principal; todo en SpotSheet expanded; SpotDetail solo para deep links y edición.
- **Deprecados identificados:** `/mapaV0`, `onOpenDetail` (SpotSheet), `getPinsForSpotsLegacy`, flujo wizard largo create-spot.
- **Guardrails deprecación:** Siempre vigilar tabla en GUARDRAILS_DEPRECACION.md para identificar cuándo eliminar código deprecado.

---

## 3. Cómo retomar

1. **Recordar (Mi diario):** Leer `docs/ops/plans/PLAN_RECORDAR_MI_DIARIO.md` + `docs/contracts/RECORDAR_ENTRY_SPOT_SHEET.md`.
2. **Deprecación:** Leer `docs/ops/governance/GUARDRAILS_DEPRECACION.md`; revisar tabla; ejecutar Fase 2/3 según criterios.
3. **Open loops:** OL-FUT-002 (Recordar), OL-DEPREC-001 (deprecación) en `docs/ops/OPEN_LOOPS.md`.
