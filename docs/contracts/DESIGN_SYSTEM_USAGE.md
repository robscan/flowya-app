# DESIGN_SYSTEM_USAGE — Contrato mínimo (Explore vNext)

**Fuentes de verdad:** `docs/ops/EXPLORAR_VNEXT_UI.md`, `docs/definitions/UI/COMPONENT_LIBRARY_POLICY.md`, `docs/ops/CURRENT_STATE.md`.

---

## 1) Principio (ops)

- Explore vNext debe usar **componentes canónicos del Design System**. No crear variantes duplicadas (chips, search input, sheet). _Referencia: decisión de hygiene/DS en ops._

---

## 2) Componentes DS mencionados en ops/definitions para Explore vNext

- **Chips / filtros:** Border radius y estados (active/inactive/pressed) deben venir de tokens del sistema; consistencia con design system. Bordes totalmente redondeados (pill): usar `Radius.pill`. _Fuente: EXPLORAR_VNEXT_UI._
- **Search input:** Top bar tipo Apple Maps (input + close en una línea; clear "x" dentro del input; focus = fondo del contenedor, no línea azul). _Fuente: EXPLORAR_VNEXT_UI, definitions/EXPLORE_SHEET._
- **IconButton, Botones, SpotCard, etc.:** Reglas generales en COMPONENT_LIBRARY_POLICY (estados, deprecación controlada, contract primero).
- **SheetHandle (canónico):** Affordance de arrastre para sheets. `components/design-system/sheet-handle.tsx`. Usado en SpotSheet y SearchFloating (Explore vNext). Web: hover/active con cambio sutil de opacidad (sin sombras ni blur). OL-044.

---

## 3) Inventario canónico explícito

- **OPEN LOOP:** No existe en ops un inventario cerrado de "lista de componentes DS canónicos que Explore vNext debe usar". CURRENT_STATE y EXPLORAR_VNEXT_UI mencionan chips, top bar, sheet, pero no un catálogo único.
- **TBD:** Hasta que ops o definitions definan un inventario mínimo (p.ej. en OPEN_LOOPS o en un doc de DS), este contrato se limita a: usar componentes de librería; chips/filtros con tokens; no duplicar variantes. Cualquier ampliación debe documentarse en ops primero.
