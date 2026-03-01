# PLAN — Explore V1 Strangler (Core-first + UI replaceable)

## Objetivo
Cerrar **Explorar V1** con una experiencia map-first estable, **reduciendo superficie de bugs** y dejando un **core reutilizable** (Search shared + Explore core), manteniendo la **UI legacy** mientras resolvemos P0/P1.

> Gate C (UI nueva Radix/shadcn) está **PAUSADO**. No empujar V3 en este sprint.

## Principios (no negociables)
1. **Search es shared**: se diseña/contrata para ser usado por **Explorar**, **Fluir** y **Recordar**.
2. **No reinventar primitives**
   - Hoy: UI legacy existente (SpotSheet Reanimated).  
   - Futuro (Gate C): Web = Radix/shadcn para overlays/focus/keyboard; Native = primitives nativos (HIG/Material).
   - El **core** NO contiene lógica de animación/gesto; solo **estado + intents + efectos**.
3. **Core ≠ cajón de sastre**: core se divide en:
   - **Shared Core** (cross-module)
   - **Module Core** (explore/flow/remember)
4. **UI es desechable**: las pantallas se pueden borrar sin perder funcionalidad (porque el core queda intacto).
5. **Anti-bugs fantasma**: una sola fuente de verdad de estado, intents explícitos, invariantes en dev.
6. **Anti-paja**: todo lo reemplazado se marca para eliminación y se borra al cutover.

---

## Definición del sistema (futuro escalable)

### Módulos
- **Explore** (V1 activo)
- **Flow** (futuro)
- **Remember** (futuro)

### Capacidades shared
- **Search**
- Auth gating
- Soft delete/visibility
- Activity log (cuando aplique)

---

## Entregables por fases

### Fase 0 — Análisis crítico (Explorar actual)
**Salida:**
- Mapa de superficie: qué es **UI** vs qué es **core** vs qué es **IO**.
- Lista de deuda/bugs actuales (P0/P1/P2).

**Regla:** No se repara nada aquí; solo se clasifica.

---

### Fase 1 — Contratos (antes de mover código)
Contratos canónicos:
- Search: `docs/contracts/shared/SEARCH_STATE.md`, `SEARCH_INTENTS.md`, `SEARCH_EFFECTS.md`
- Explore: `docs/contracts/explore/EXPLORE_STATE.md`, `EXPLORE_INTENTS.md`, `EXPLORE_EFFECTS.md`

**Salida de Fase 1:** contratos listos, sin UI nueva.

---

### Fase 2 — Extracción quirúrgica de Core (sin cambiar UX) ✅
**Objetivo:** mover funcionalidad “real” fuera de pantallas sin cambiar UX.

Estructura objetivo:
- `core/shared/search/*`
- `core/shared/visibility-softdelete/*` *(si aplica; si no existe es OPEN LOOP)*
- `core/explore/*`

Reglas:
- UI solo emite intents y renderiza estado.
- IO se hace vía adapters desde efectos, no desde UI.

**Salida:** Explorar funciona igual (legacy), pero consumiendo core.

> Referencia: `docs/ops/strategy/DEPRECATED_V3_CLEANUP.md` (V3 eliminado; core retenido).

---

### Fase 2.1 — Estabilización (P0/P1) **(este sprint)**
**Objetivo:** resolver bugs críticos sin re-arquitectura adicional.

Prioridad:
1. **Soft delete consistente** (no fantasmas en pins/resultados/sheet).
2. **Create Spot siempre desde creador mínimo** (una sola ruta/capability).
3. **Rediseñar Edit Spot** (UX + estructura; sin V3).
4. Bugs restantes (ver `docs/ops/OPEN_LOOPS.md`).

Salida:
- P0/P1 cerrados con pruebas smoke + invariantes.

---

### Fase 3 — Explore V3 (UI web nueva) usando primitives (Radix + shadcn) **PAUSADO**
No se trabaja en esta fase durante el sprint actual.

---

### Fase 4 — Cutover y Delete Sprint (sin piedad)
Cuando exista UI nueva (si se retoma Gate C) y cubra JTBD, se borra legacy.

---

## Estrategia de commits / PR (anti-burocracia)
- **1 rama / 1 PR** por fase/macro-movimiento.
- Commits por **checkpoints funcionales**, no por micro-cambio.
- Merge con **Squash** (o incluso 1 commit final).
- Bitácora: **1 entrada por fase**, no por micro-cambio.

---

## Definition of Done (Explorar V1 “cerrado”)
1. JTBD de Explorar cubierto (explorar + buscar + seleccionar + crear spot mínimo + editar detalles).
2. P0/P1 resueltos:
   - soft delete consistente
   - create spot unificado (sin activaciones accidentales)
   - edit spot usable (sin fricción)
3. Contratos + invariantes respetados.
4. Search permanece como capability shared (no acoplado a Explorar).
