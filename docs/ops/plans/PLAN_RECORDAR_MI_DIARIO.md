# Plan: Recordar — Mi diario (sección)

**Estado:** Documentado para retomar. No implementar aún. Prioridad: después de ajustes Explore.

**Última actualización:** 2026-02-14

> Plan completo para la sección Recordar (JTBD-03). Al retomar, leer este documento + contrato `docs/contracts/RECORDAR_ENTRY_SPOT_SHEET.md`.

---

## 1. Contexto y capacidad actual

### Explorar vNext (flujo vigente)

| Aspecto | Situación actual |
|---------|------------------|
| **Entry principal** | `/` → MapScreenVNext |
| **Selección de spot** | Mapa → tap pin → SpotSheet (peek ↔ medium ↔ expanded) |
| **Contenido del spot** | SpotSheet expanded muestra todo: descripción, cover, Por visitar/Visitado, distancia, Por qué importa, dirección, Cómo llegar, Editar detalles |
| **SpotDetail (/spot/[id])** | **No** se usa como flujo principal en Explorar. Solo para: deep links (compartir), edición (`/spot/edit/[id]`) |
| **Crear spot** | Draft (long-press o no-results) → Paso 0 → confirmar ubicación → persist → sheet → "Editar detalles" |
| **Búsqueda** | Search V2 (useSearchControllerV2) |
| **Mapa legacy** | `/mapaV0` → deprecated; entry real es `/` |

### JTBD-03 — Recordar lo vivido

> Cuando ya visité un lugar, quiero marcarlo como visitado y asociar recuerdos (nota/foto), para construir mi mapa personal y mi historia.

- "Visited" es un estado con peso (no cosmético)
- Notas personales por spot (solo visibles para el usuario)
- Entry point: cuando el usuario marca "Por visitar" o "Visitado"

---

## 2. Entry point: Mi diario en SpotSheet

### Momento de aparición

- **Desde "Por visitar"** (no solo desde "Visitado"): en cuanto el usuario marca el spot como guardado, ya puede acceder a notas.
- Requiere pin existente: `saved === true` O `visited === true`.

### Ubicación en UI

- **Misma fila** que el botón principal (Por visitar / Visitado).
- **Dos botones** lado a lado: estado (Por visitar|Visitado) + Mi diario (o Notas).
- Ambos comparten el ancho disponible de forma **responsiva**.
- Ver contrato: `docs/contracts/RECORDAR_ENTRY_SPOT_SHEET.md`.

### Wording (pendiente de decisión)

| Opción | Pros | Contras |
|--------|------|---------|
| **Mi diario** | Personal, narrativo, viaje | Puede sonar a "log diario" |
| **Notas** | Neutro, utilitario | Menos evocador |

---

## 3. Modelo de datos

### Tabla `pins` (extensión)

| Columna | Tipo | Notas |
|---------|------|-------|
| `notes` | `text` | Contenido de las notas personales |
| `notes_updated_at` | `timestamptz` | Última actualización |

- RLS existente ya protege por `user_id`; no cambios de políticas.
- Requiere pin (saved o visited); al guardar primera nota, crear pin con `saved=true` si no existe.

### Lib: `lib/pins.ts`

- `PinState.notes` (tipo extendido)
- `updatePinNotes(spotId, notes)`

---

## 4. Fases de implementación (orden sugerido)

| Fase | Alcance | DoD |
|------|---------|-----|
| **EP-1 — Foundation** | Migración `pins.notes` + `notes_updated_at`; `lib/pins` (updatePinNotes, getPinNotes) | Migración aplicada; lib probada |
| **EP-2 — Entry en sheet** | Botón "Mi diario" en SpotSheet cuando `saved \|\| visited`; misma fila que Por visitar/Visitado; layout responsivo | Contrato RECORDAR_ENTRY_SPOT_SHEET cumplido |
| **EP-3 — Flujo de notas** | UI para ver/editar notas (modal, sheet o pantalla dedicada según definición) | Usuario puede escribir y persistir notas |
| **EP-4 — Filtro/lista** (opcional) | Filtro o lista de spots con notas en Recordar | TBD |
| **EP-5 — Fluir teaser** (opcional) | Integración con Fluir si aplica | TBD |

---

## 5. Referencias cruzadas

- **Contrato entry point:** `docs/contracts/RECORDAR_ENTRY_SPOT_SHEET.md`
- **JTBD base:** `docs/ops/analysis/JTBD.md` (JTBD-03)
- **Galería (futuro):** `docs/ops/plans/PLAN_SPOT_GALLERY_MI_DIARIO.md` (Feature 1; independiente)
- **OPEN_LOOPS:** OL-RECORDAR-001 en `docs/ops/OPEN_LOOPS.md`

---

## 6. Criterios para retomar

1. Prioridades P0/P1 de Explore resueltas o pausadas.
2. Contratos RECORDAR_ENTRY_SPOT_SHEET y EXPLORE_SHEET al día.
3. Wording ("Mi diario" vs "Notas") decidido.
