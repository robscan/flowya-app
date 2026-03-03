# PLAN — OL-EXPLORE-SEARCH-BATCH-001 (2026-03-03)

Estado: PLANIFICADO (no ejecutar en paralelo con `OL-CONTENT-001`)  
Owner sugerido: Explore Runtime + Search UX  
Dependencia de entrada: cierre documentado de `OL-CONTENT-001`

---

## 1) Objetivo

Permitir que el usuario marque **varios spots a la vez** como `Por visitar` o `Visitados` desde búsqueda cuando está en filtros `saved/visited`, sin romper:

- contrato de selección unitaria fuera de modo batch,
- política `Sticky Context`,
- estabilidad de SpotSheet y mapa.

---

## 2) Alcance (v1 viable)

1. Modo batch solo dentro de Search (`SearchFloating`), activado por acción explícita `Seleccionar`.
2. Selección múltiple de spots en lista de resultados para filtros `saved/visited`.
3. Barra de acciones batch:
   - `Marcar Por visitar`
   - `Marcar Visitados`
   - `Cancelar`
4. Ejecución batch con resultado agregado (`ok/fail`) y feedback único por operación.
5. Refresco de estado local (`spots`, conteos, badges) al finalizar.

---

## 3) Fuera de alcance (v1)

- Multi-selección en mapa.
- Multi-selección en `all` con POIs externos.
- Timeline/undo complejo por item.
- Cambios de arquitectura mayores en reducer runtime.

---

## 4) Contratos impactados

- `docs/contracts/explore/FILTER_RUNTIME_RULES.md`
- `docs/contracts/SEARCH_V2.md`
- `docs/contracts/SPOT_SELECTION_SHEET_SIZING.md` (aclaración: selección unitaria se mantiene fuera de modo batch)

---

## 5) Diseño de comportamiento

### 5.1 Entrada/salida

- Entrada: botón `Seleccionar` en cabecera de Search cuando `pinFilter in {saved, visited}`.
- Salida:
  - `Cancelar` limpia selección y restaura comportamiento normal.
  - al aplicar acción batch y terminar (ok total o parcial), salir de modo batch.

### 5.2 Semántica de tap

- Fuera de batch: tap en card mantiene contrato actual (selecciona spot + abre sheet `medium`).
- En batch: tap en card alterna selección (checkbox/chip visual), no abre sheet.

### 5.3 Política de filtro

- `Sticky Context` se mantiene: no auto-switch de filtro tras batch.
- Si un spot sale del subconjunto del filtro actual tras mutación, se refleja en lista al refrescar, con feedback agregado.

### 5.4 Feedback

- Un único status/toast por operación batch:
  - éxito total: `N spots actualizados`.
  - parcial: `X actualizados, Y con error`.

---

## 6) Diseño técnico (implementación sugerida)

### EP-1 — Infra de datos batch (`lib/pins.ts`)

Agregar API batch:

- `setPinStateBatch(input: { spotIds: string[]; next: { saved: boolean; visited: boolean } })`
- salida:
  - `successIds: string[]`
  - `failedIds: string[]`

Reglas:

- una sola resolución de `userId`,
- `upsert` por chunks para evitar payloads grandes,
- manejo explícito de error por chunk,
- mantener compatibilidad con `status` legacy derivado.

### EP-2 — UI batch en Search

Extender `SearchSurface` + adapters web/native:

- estado `batchMode` + `selectedSpotIds`,
- acción `Seleccionar/Cancelar`,
- barra inferior con acciones batch,
- señal visual de card seleccionada.

### EP-3 — Integración en MapScreenVNext

- handler batch que:
  1. valida auth,
  2. ejecuta `setPinStateBatch`,
  3. reconcilia estado local (`spots`, conteos, badges),
  4. hace `refetchSpots` de consolidación.
- `recentMutation` en v1: registrar el último spot mutado para compatibilidad.

### EP-4 — Contratos + docs de cierre

- actualizar contratos afectados,
- bitácora de cierre del OL con evidencia.

---

## 7) Riesgos críticos y mitigación

1. Conflicto entre selección unitaria y batch.
- Mitigación: bandera explícita `batchMode`; fuera de batch nada cambia.

2. Fallos parciales en lote.
- Mitigación: resultado agregado + reporte `ok/fail` + reconciliación final por `refetch`.

3. Desaparición de ítems en filtro activo genera confusión.
- Mitigación: copy explícito antes/después de aplicar y resumen de cambios.

4. Regresión de runtime (badges/pulse/selection).
- Mitigación: mantener integración conservadora (último spot mutado + no tocar policy sticky).

---

## 8) Criterios de aceptación

1. En `saved/visited`, usuario puede seleccionar múltiples spots y aplicar estado masivo.
2. Fuera de batch, tap en card conserva comportamiento actual.
3. No hay auto-switch de filtro tras batch.
4. Conteos y lista quedan consistentes después de operación.
5. En fallo parcial, usuario recibe resumen claro y estado final consistente.

---

## 9) Orden recomendado de ejecución (post-cierre `OL-CONTENT-001`)

1. EP-1 Infra batch en `lib/pins`.
2. EP-2 UI batch en Search (web/native parity).
3. EP-3 Integración runtime en `MapScreenVNext`.
4. EP-4 QA + contratos + bitácora + cierre de loop.

---

## 10) Validación mínima (QA)

1. Batch `saved -> visited` (n=1, n>1).
2. Batch `visited -> saved` (n=1, n>1).
3. Cancelar batch sin side effects.
4. Error parcial simulado (1 falla, resto ok).
5. Web y native sin regresión de cierre Search / apertura SpotSheet.
