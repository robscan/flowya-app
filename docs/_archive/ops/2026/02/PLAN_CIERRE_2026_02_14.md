# Plan: Cierre sesión 2026-02-14

**Estado:** DEPRECATED / ARCHIVED (movido desde `docs/ops/plans` el 2026-02-25)  
**Motivo:** Plan operativo de una sesión ya cerrada.

**Objetivo:** Actualizar documentación con todos los ajustes del día, incluir features futuras en Open Loops, y ejecutar merge/push a prod sin perder cambios.

---

## Fase 1: Actualizar documentos (ejecutar PRIMERO)

Orden de actualización:

### 1.1 Bitácora 099
- **Archivo:** `docs/bitacora/2026/02/099-map-overlays-search-entry-flowya-keyboard.md`
- **Contenido:** Rediseño overlays (entry icon Search derecha, FLOWYA abajo-izquierda), paddings, contrato teclado, **fix MapControls alineación** (eliminar padding 4px horizontal del contenedor).

### 1.2 Bitácora 098
- **Archivo:** `docs/bitacora/2026/02/098-search-pill-ds-refactor.md`
- **Cambio:** Fecha `2026-02-21` → `2026-02-14`.

### 1.3 OPEN_LOOPS
- **Archivo:** `docs/ops/OPEN_LOOPS.md`
- **Añadir** sección "Futuro (no prioritario)" con:
  - **OL-FUT-001** — Galería de imágenes por spot (múltiples imágenes públicas, grid, galería estilo Apple Maps).
  - **OL-FUT-002** — Mi diario (notas personales por spot, solo visibles para el usuario).

### 1.4 Plan futuro (Galería + Mi diario)
- **Archivo:** `docs/ops/plans/PLAN_SPOT_GALLERY_MI_DIARIO.md`
- **Contenido:** Plan detallado para retomar después (tabla spot_images, pins.notes, UI SpotImageGrid, ImageFullscreenModal galería, etc.).

### 1.5 CURRENT_STATE
- **Archivo:** `docs/ops/CURRENT_STATE.md`
- **Sección "Hoy":** Snapshot: Search pill DS, Map overlays redesign, MapPinFilterInline, contrato teclado, **MapControls alineación**, Open Loops futuro (galería + diario).

### 1.6 PLAN_KEYBOARD_CTA_CONTRACT
- **Archivo:** `docs/ops/plans/PLAN_KEYBOARD_CTA_CONTRACT.md`
- **Cambio:** Marcar fases implementadas en checklist; añadir notas de estado.

---

## Fase 2: Ejecutar merge/push

### 2.1 Backup
```bash
git stash push -u -m "backup-$(date +%Y%m%d-%H%M)"
```

### 2.2 Crear rama
```bash
git checkout -b feat/day-2026-02-14-explore-search-keyboard
```

### 2.3 Añadir todo
```bash
git add -A
git status   # Verificar que TODO esté staged
```

### 2.4 Commits (docs primero, luego código)
- Commit 1: docs (bitácora + ops)
- Commit 2: contratos
- Commit 3: componentes
- Commit 4: app + lib + contexts

### 2.5 Push y PR
```bash
git push -u origin feat/day-2026-02-14-explore-search-keyboard
```

### 2.6 Merge a main y push prod
- Revisar PR en remoto.
- Merge a main.
- `git checkout main && git pull && git push origin main`.

---

## Archivos que NO deben quedar fuera

- `components/design-system/map-controls.tsx` (fix padding)
- `components/design-system/map-pin-filter-inline.tsx`
- `components/design-system/search-pill.tsx`
- `docs/bitacora/2026/02/095-*.md` … `099-*.md`
- `docs/contracts/KEYBOARD_AND_TEXT_INPUTS.md`
- `docs/contracts/MAP_PINS_CONTRACT.md`
- `docs/ops/plans/PLAN_KEYBOARD_CTA_CONTRACT.md`
- `docs/_archive/ops/2026/02/PLAN_CIERRE_2026_02_14.md`
- `docs/ops/plans/PLAN_SPOT_GALLERY_MI_DIARIO.md` (nuevo)
- Todos los modificados en app/, components/, contexts/, lib/
