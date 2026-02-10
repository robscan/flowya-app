# Bitácora 050 (2026/02) — Spot edit mini-sheets + Mapbox maki (contracts + ops)

**Rama:** `chore/spot-contracts-maki-2026-02-09`  
**Objetivo:** Documentar contrato de edición por sección (mini-sheets), contrato de enriquecimiento Mapbox (maki), y registrar bug long-press create spot en vNext. Solo docs; sin código.

---

## 1) Decisiones documentadas

- **Edición tipo Apple Maps:** Secciones con "Editar" abren un SubSheet (mini-sheet) por sección; 1 nivel máximo; cancelar vuelve al SpotSheet principal. MVP secciones: (1) Detalles (tel/web), (2) Categoría + etiquetas.
- **Mapbox en creación:** Se importan mapbox_place_id, name, lat/lng, address (snapshot, reverse 1 vez), country/region/city/postcode si existen. **maki** como suggested_category (no verdad) y como señal para futuras categorías internas. No se importan horarios, teléfono, ratings, etc.
- **Categorías internas:** Aún no existen → OPEN LOOP (OL-023).
- **Bug:** Long press create spot no dispara en vNext map → OL-022 abierto.

---

## 2) Contratos creados

| Archivo | Contenido |
|---------|-----------|
| `docs/contracts/SPOT_EDIT_MINI_SHEETS.md` | Patrón SpotSheet + SubSheet (1 nivel); MVP secciones Detalles y Categoría+etiquetas; guardrails (keyboard-safe, no overlays, no multi-stack); user-editables vs snapshot. |
| `docs/contracts/MAPBOX_PLACE_ENRICHMENT.md` | Campos que sí se importan; maki como suggested_category e input futuro; campos que no se importan; OPEN LOOP categorías internas. |

---

## 3) Loops abiertos (OPEN_LOOPS)

- **OL-021** — Spot edit by section (mini-sheets): contrato listo, implementación pendiente.
- **OL-022** — Long press create spot no dispara en vNext map: bug registrado, pendiente diagnóstico/fix.
- **OL-023** — Categorías internas (taxonomy) alimentadas por maki: opcional, pendiente.

---

## 4) Ops actualizados

- **OPEN_LOOPS.md:** Añadidos OL-021, OL-022, OL-023.
- **CURRENT_STATE.md:** Añadido problema "Long-press create spot no funciona en vNext map"; en Next step "Implementar fix OL-022, luego OL-021 (UI)".
