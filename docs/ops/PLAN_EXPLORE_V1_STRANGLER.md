# PLAN — Explore V1 Strangler (Core-first + UI replaceable)

## Objetivo
Terminar **Explorar V1** rápido con una UI decente (**Tailwind + Radix + shadcn/ui** en web), eliminando código legacy y evitando bugs fantasma, dejando un **core reutilizable** para futuro nativo.

## Principios (no negociables)
1. **Search es shared**: se diseña/contrata para ser usado por **Explorar**, **Fluir** y **Recordar**.
2. **No reinventar primitives**  
   - **Web**: Radix/shadcn manejan comportamientos (focus, overlay, keyboard nav).  
   - **Native**: componentes/gestos/transiciones nativas (HIG/Material).  
   - El **core** NO contiene lógica de animación/gesto; solo **estado + intents + efectos**.
3. **Core ≠ cajón de sastre**: core se divide en:  
   - **Shared Core** (cross-module)  
   - **Module Core** (explore/flow/remember)
4. **UI es desechable**: las pantallas se pueden borrar sin perder funcionalidad.
5. **Anti-bugs fantasma**: una sola fuente de verdad de estado, intents explícitos, invariantes en dev.
6. **Anti-paja**: todo lo reemplazado se marca para eliminación y se borra al cutover.

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
- “Mapa de superficie” de Explorar: qué es **UI** vs qué es **core** vs qué es **IO**.
- Lista de deuda/bugs actuales: **teclado mobile web**, **soft delete**, **create spot roto**.
- Lista de “primitives” que Radix debe resolver (Sheet/Dialog/Popover/Menu/Input).

**Regla:** No se repara nada aquí; solo se clasifica.

---

### Fase 1 — Contratos (antes de mover código)

#### 1) Shared Search Contracts
- `SearchState` (query, status, results, ranking metadata)
- `SearchIntents` (open/close/submit/select/filter)
- `SearchEffects` (fetch, focus map, navigate, etc.)

#### 2) Explore Contracts
- `ExploreState` (viewport, selectedSpot, overlayMode, createSpotDraft, filters)
- `ExploreIntents` (tapPin, openSpot, startCreate, dismissOverlay, applyViewport)
- `ExploreEffects` (persistDraft, softDelete, mapFocus, analytics)

#### 3) Invariantes (dev-only)
8–12 reglas que si se rompen disparan error en dev (mata “silenciosos”):
- Soft-deleted **nunca** aparece en listas/pins.
- `selectedSpot` siempre existe o es `null`.
- `createSpotDraft` siempre tiene `location + image` antes de pasar a texto.
- Overlay abierto siempre tiene “motivo” (**search** o **selected** o **create**).

**Salida de Fase 1:** contratos listos, sin UI nueva todavía.

---

### Fase 2 — Extracción quirúrgica de Core
**Objetivo:** mover funcionalidad “real” fuera de pantallas **sin cambiar UX**.

#### Estructura objetivo
- `core/shared/search/*`
- `core/shared/visibility-softdelete/*`
- `core/explore/*`

#### Reglas
- UI solo emite intents y renderiza estado.
- IO se hace vía adapters (Supabase/Mapbox) desde efectos, no desde UI.

**Salida:** Explorar actual funcionando igual (aunque feo), pero ya consumiendo core.

---

### Fase 3 — Explore V3 (UI web nueva) usando primitives (Tailwind + Radix + shadcn)
**Objetivo:** construir una tercera pantalla “limpia” que solo use core.

- Crear `ExploreV3.web.tsx` (o entrypoint equivalente).
- UI usa:
  - `ui-web` (componentes shadcn)
  - `Radix primitives` para overlays/menus/dialogs
- **Prohibido** importar componentes legacy dentro de V3.

#### Criterio de “UI decente”
- Jerarquía clara, spacing consistente, estados (loading/empty/error) bien.
- Overlays y teclado móvil sin romper layout (Radix + layout estable).

---

### Fase 4 — Cutover y Delete Sprint (sin piedad)
**Objetivo:** cuando V3 cubra el JTBD de Explorar, se borra lo viejo.

- Apagar V1/V2 (pantallas anteriores).
- Borrar componentes legacy no usados.
- Todo lo marcado `@legacy-delete` se elimina.

**Salida:** repo más chico, menos superficie de bug, core reusable.

---

## Estrategia de commits / PR (anti-burocracia)
- **1 rama / 1 PR** para todo el macro-movimiento “Explore V1 Strangler”.
- Commits solo en **checkpoints funcionales**, no por detalle mínimo.
- Merge con **Squash** (o incluso 1 commit final).
- Bitácora: **1 entrada por fase**, no por micro-cambio.

---

## Definition of Done (Explorar V1 “cerrado”)
1. JTBD de Explorar cubierto (crear spot rápido + explorar + guardar/visitar).
2. Bugs críticos mitigados:
   - teclado mobile web no rompe overlay
   - soft delete consistente
   - create spot draft no se rompe
3. Explore V3 es el entrypoint principal.
4. Legacy eliminado.
5. Contratos + invariantes existen y se respetan.
6. Search quedó como shared capability (no acoplado a Explorar).

---

## Notas sobre futuro nativo
- El **core** se reutiliza.
- Se crean shells nativos (iOS/Android) usando primitives nativos.
- Web sigue con Radix/shadcn, sin contaminar nativo.
