# Bitácora 049 (2026/02) — Contracts Explore vNext (OL-019)

**Rama:** `chore/contracts-explore-vnext`  
**Objetivo:** Cerrar OL-019 creando contratos mínimos en `docs/contracts/` para Explore vNext (sheet, search, DS usage). Solo documentación; sin cambios de código.

---

## 1) Contexto

- Guardrails y ops referencian `docs/contracts/*` como fuente de verdad; la carpeta canónica no existía a nivel `docs/contracts/` (sí existen `docs/definitions/contracts/` y `docs/definitions/search/`).
- OL-019: crear `docs/contracts/` con contratos mínimos de ExploreSheet, Search, DS usados por Explore vNext.
- Regla: los contratos describen **lo que ya existe** en ops/estado actual; no inventar UI ni comportamiento no documentado.

---

## 2) Archivos creados

| Archivo | Contenido |
|---------|-----------|
| `docs/contracts/EXPLORE_SHEET.md` | Estados (collapsed/medium/expanded), modos (search/spot), reglas en ops (pan/zoom colapsa, no overlay, keyboard-safe), componentes (ExploreSheet, MapScreenVNext, SearchV2). OPEN LOOP: reglas detalladas de drag no definidas en ops. |
| `docs/contracts/SEARCH_V2.md` | Entry/exit modo búsqueda en Explore vNext; persistencia y clear del texto (incl. selectedPlace en Create Spot); guardrails: no overlay, no duplicar DS. |
| `docs/contracts/DESIGN_SYSTEM_USAGE.md` | Principio: usar componentes canónicos; chips/filtros con tokens; search input según EXPLORAR_VNEXT_UI. OPEN LOOP: inventario cerrado de componentes DS para Explore vNext no existe en ops → TBD. |

---

## 3) Reglas quedadas explícitas

- Un solo ExploreSheet con 3 estados y modos search/spot.
- Search no como overlay; vive dentro del sheet.
- Pan/zoom con spot seleccionado colapsa sheet a header.
- Clear "x" en búsqueda: en Create Spot, selectedPlace se mantiene.
- DS: chips con tokens; no duplicar variantes; inventario canónico TBD hasta que ops lo defina.

---

## 4) OPEN LOOPS detectados (falta definición en ops)

- **Reglas detalladas de drag** del sheet (umbrales por estado, etc.): no documentadas en ops como contrato; cualquier extensión debe documentarse en ops primero.
- **Inventario canónico DS** para Explore vNext: no hay lista cerrada en ops; DESIGN_SYSTEM_USAGE deja TBD hasta que exista esa definición.

---

## 5) Ops actualizados

- OPEN_LOOPS: OL-019 cerrado (contratos creados); nota en "Loops activos".
- CURRENT_STATE: eliminado "Falta docs/contracts/*" de Frágil/Atención; eliminado "Crear contratos mínimos" de Next step; añadido OL-019 al historial relevante.
