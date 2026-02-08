# Bitácora 038 (2026/02) — Search Panel: estados por longitud de query (progresivo)

**Alcance:** Map Search V2 — definición exacta de estados del panel según longitud del query.

---

## Variables

- `q = searchV2.query.trim()`
- `len = q.length`
- `isEmpty = len === 0`
- `isPreSearch = len > 0 && len < 3`
- `isSearch = len >= 3`

---

## Branches UI (solo una activa)

### A) isEmpty (0 chars)

- Mostrar **solo** sección **Cercanos** (cards) dentro de un ScrollView.
- Si no hay cercanos: mensaje "No hay spots cercanos. Mantén pulsado el mapa para crear uno."

### B) isPreSearch (1–2 chars)

- Mostrar **solo**:
  - **Búsquedas recientes** (texto, máx 5). Si no hay: "No hay búsquedas recientes".
  - **Vistos recientemente** (texto, máx 10). Si no hay: "No hay spots vistos recientemente".
- **No** mostrar Cercanos.

### C) isSearch (>= 3 chars)

- Si `results.length > 0`: etiqueta de stage + lista de resultados (cards) + fetchMore.
- Si `results.length === 0`: sugerencias (solo si `suggestions.length > 0`) + CTA Crear.
- No mostrar secciones de IDLE (A/B).

---

## QA

- Query vacío: solo Cercanos.
- 1–2 chars: solo recientes + vistos (sin Cercanos).
- 3+ chars: resultados o sugerencias + CTA.

**Archivo:** `app/(tabs)/index.web.tsx` (área de resultados del overlay de búsqueda).
w
