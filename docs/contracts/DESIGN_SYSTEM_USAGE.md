# DESIGN_SYSTEM_USAGE — Contrato mínimo (Explore vNext)

**Fuentes de verdad:** `docs/ops/strategy/EXPLORE_UX_MICROSCOPES.md`, `docs/definitions/UI/COMPONENT_LIBRARY_POLICY.md`, `docs/ops/CURRENT_STATE.md`.

---

## 1) Principio (ops)

- Explore vNext debe usar **componentes canónicos del Design System**. No crear variantes duplicadas (chips, search input, sheet). _Referencia: decisión de hygiene/DS en ops._

---

## 2) Componentes DS mencionados en ops/definitions para Explore vNext

- **Chips / filtros:** Border radius y estados (active/inactive/pressed) deben venir de tokens del sistema; consistencia con design system. Bordes totalmente redondeados (pill): usar `Radius.pill`. _Fuente: EXPLORE_UX_MICROSCOPES / CURRENT_STATE._
- **Search input:** Top bar tipo Apple Maps (input + close en una línea; clear "x" dentro del input; focus = fondo del contenedor, no línea azul). _Fuente: EXPLORE_UX_MICROSCOPES, definitions/EXPLORE_SHEET._
- **IconButton, Botones, SpotCard, etc.:** Reglas generales en COMPONENT_LIBRARY_POLICY (estados, deprecación controlada, contract primero).
- **SheetHandle (canónico):** Affordance de arrastre para sheets. `components/design-system/sheet-handle.tsx`. Usado en SpotSheet y SearchFloating (Explore vNext). Web: hover/active con cambio sutil de opacidad (sin sombras ni blur). OL-044.

---

## 3) Inventario canónico explícito

- **OPEN LOOP:** No existe en ops un inventario cerrado de "lista de componentes DS canónicos que Explore vNext debe usar". CURRENT_STATE y EXPLORE_UX_MICROSCOPES mencionan chips, top bar, sheet, pero no un catálogo único.
- **TBD:** Hasta que ops o definitions definan un inventario mínimo (p.ej. en OPEN_LOOPS o en un doc de DS), este contrato se limita a: usar componentes de librería; chips/filtros con tokens; no duplicar variantes. Cualquier ampliación debe documentarse en ops primero.
- **Map pins:** Ver `MAP_PINS_CONTRACT.md` para tamaños, jerarquía de capas y animaciones.
- **SearchPill:** Entry point para abrir búsqueda en Explore. `components/design-system/search-pill.tsx`. Pill blanco con icono y texto. En BottomDock pillOnly: solo el pill flotante (sin contenedor envolvente). `variant=onDark` para contraste sobre mapa. Props: `label`, `onPress`, `fill`, `variant`.
