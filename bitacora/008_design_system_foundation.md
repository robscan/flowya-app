# Bitácora: Fundación del Design System

## Paso: Pantalla y estructura del Design System

**Fecha:** 2025-02-01

### Objetivo

Definir una base de Design System: una pantalla dedicada y una estructura de componentes canónicos para albergar todo el UI reutilizable y evitar inconsistencias en el producto.

### Por qué existe el Design System

- **Fuente única de verdad:** Tipografía, botones, cards y elementos de mapa se definen una vez en `components/design-system/` y se consultan desde la pantalla Design System.
- **Consistencia:** Cualquier nueva pantalla o flujo debe usar estos componentes (o variantes documentadas aquí) en lugar de crear estilos ad hoc.
- **Evitar duplicación:** Sin Design System, cada pantalla puede inventar sus propios tamaños, colores y espaciados; con él, se reduce la deriva visual y el mantenimiento.

### Reglas para añadir nuevo UI

1. **Nuevos elementos de interfaz** deben diseñarse como componentes reutilizables y vivir en `components/design-system/` (o en subcarpetas: typography, buttons, cards, map-ui, etc.).
2. **Cada componente** debe exponerse en la pantalla Design System (`/design-system` en web) para poder revisarlo y referenciarlo.
3. **Sin lógica de negocio:** Los componentes del Design System son presentacionales; no usan Supabase ni lógica de producto.
4. **No duplicar lógica de mapa:** Los placeholders de “map-related UI” son solo contenedores/estilos; la lógica del mapa sigue en la pantalla del mapa.

### Cómo previene la inconsistencia futura

- La pantalla Design System sirve como **catálogo**: quien diseña o implementa una nueva feature puede comprobar cómo se ve y se comporta un botón, un card o un texto canónico.
- Si algo se cambia en el Design System, todas las pantallas que usen esos componentes se benefician del cambio sin tocar cada archivo.
- Obligar a “todo nuevo UI como componente canónico” evita que aparezcan botones o cards con estilos distintos en distintas partes de la app.

### Estructura creada

- **Pantalla:** `app/design-system.web.tsx` (web: catálogo completo), `app/design-system.tsx` (native: placeholder “available on web”).
- **Ruta:** `/design-system`. Acceso desde la pestaña Explore mediante el enlace “Open Design System”.
- **Componentes (placeholders):**
  - `components/design-system/typography.tsx` — Tipografía (headings, body, caption).
  - `components/design-system/buttons.tsx` — Botones primary y secondary.
  - `components/design-system/cards.tsx` — Cards / contenedores.
  - `components/design-system/map-ui.tsx` — Elementos de mapa (placeholders).
- **Barrel:** `components/design-system/index.ts` reexporta los showcases.

### Archivos y carpetas tocados

- **Creados:** `app/design-system.web.tsx`, `app/design-system.tsx`, `components/design-system/typography.tsx`, `components/design-system/buttons.tsx`, `components/design-system/cards.tsx`, `components/design-system/map-ui.tsx`, `components/design-system/index.ts`, `bitacora/008_design_system_foundation.md`.
- **Modificados:** `app/(tabs)/explore.tsx` (enlace “Open Design System”), `app/_layout.tsx` (Stack.Screen para `design-system`).
- **Sin refactor:** Las pantallas de producto (mapa, explore, tabs) no se refactorizaron; solo se añadió un enlace en Explore y una ruta nueva.
