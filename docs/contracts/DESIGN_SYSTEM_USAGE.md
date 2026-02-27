# DESIGN_SYSTEM_USAGE — Canon operativo (Explore + Edit Spot)

**Fecha:** 2026-02-26

**Fuentes de verdad:**
- Runtime Explore: `components/explorar/MapScreenVNext.tsx`
- Runtime Edit Spot: `app/spot/edit/[id].web.tsx`
- Contratos Explore runtime: `docs/contracts/explore/*_RUNTIME_RULES.md`
- Política de librería: `docs/definitions/UI/COMPONENT_LIBRARY_POLICY.md`

---

## 1) Alcance activo

El diseño canónico actual cubre solo:
- Ventana **Explorar** (map/filter/controls/search/sheet).
- Ventana **Edit Spot** (formulario + mapa de ubicación + acciones).

Cualquier UI fuera de ese alcance se considera candidata a deprecación hasta nueva decisión de producto.

---

## 2) Inventario canónico mínimo (obligatorio)

### Explore
- `IconButton`
- `MapControls`
- `MapPinFilter`
- `MapPinFilterInline`
- `MapPinSpot` / `MapPinLocation`
- `SearchInputV2`
- `SearchResultsListV2`
- `SearchListCard`
- `SheetHandle`
- `SpotSheet`

### Edit Spot
- `IconButton`
- `SpotImage`
- `ImagePlaceholder`
- `MapLocationPicker`
- `ConfirmModal`

Regla: si un flujo activo necesita un nuevo patrón, primero se extiende este inventario y luego se implementa.

### Nota de arquitectura (listas)

Se mantiene separación obligatoria entre:
- **Infra de listado** (scroll, secciones, paginación, keyboard-safe): hoy `SearchResultsListV2`.
- **Elemento de listado** (presentación visual de item): hoy `SearchListCard`.

No se fusionan en un único componente monolítico.

### Naming canónico propuesto (sin implementación en este scope)

- `SearchResultsListV2` -> `ListView` (alias transitorio permitido: `SearchResultsListV2`).
- `SearchListCard` -> `ResultRow` (alias transitorio permitido: `SearchListCard`).

Objetivo: usar nomenclatura genérica DS para escalar a futuros listados sin acoplar al dominio Search.

---

## 3) Reglas UX/arquitectura (Apple Maps-like)

- Top bar de búsqueda simple: 1 fila de filtros + cerrar, 1 fila de input ancho completo.
- Un solo patrón de "result row" para búsqueda (evitar variantes de card paralelas).
- Controles de mapa con prioridad contextual: `world` solo sin selección activa.
- Sheet y mapa no compiten por foco: una interacción debe tener una respuesta dominante.
- Sin sobre-anidaciones: componentes de DS con responsabilidad única y APIs acotadas.

### Estados de interacción (cross-platform)

Todo primitivo interactivo debe cubrir:
- `default`
- `hover` (web)
- `pressed` (web + mobile)
- `focus-visible` (web)
- `selected` (si aplica)
- `disabled`
- `loading` (si aplica)

Regla visual solicitada:
- En mobile, `pressed` debe comunicar la misma intención visual que `hover` en web (misma familia de feedback, adaptada por plataforma).

### Primitivos base a consolidar

- `ActionButton`
- `IconButton`
- `TextField` (input/textarea + estados)
- `ListView` (infra)
- `ResultRow` (item visual)
- `SurfaceCard`
- `SheetHandle`

Estos primitivos deben consumir tokens del tema y funcionar de forma nativa en `light` y `dark` sin hardcodes de color.

---

## 4) Candidatos a deprecación (pre-eliminación)

- `components/explorar/MapScreenV0.tsx`
- `app/mapaV0.tsx`
- `app/mapaV0.web.tsx`
- `components/design-system/map-ui.tsx` (placeholder no usado por runtime)
- Secciones legacy/no operativas en `/design-system` que no correspondan a Explore/Edit Spot.

---

## 5) Guardrails de implementación

- No crear componentes "one-off" dentro de pantallas activas.
- Si una estructura aparece 2+ veces, crear template canónico en `components/design-system/`.
- Evitar componentes > 300 líneas; si se excede, separar en subcomponentes por dominio.
- Estados visuales deben salir de tokens (`constants/theme.ts`), no de colores inline por componente.
- Todo deprecado debe tener:
  - etiqueta `@deprecated`,
  - reemplazo recomendado,
  - fecha objetivo de retiro.
