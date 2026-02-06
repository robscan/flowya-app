# Bitácora 023 — Scope Map: botón «Ver todo»

## Objetivo del cambio

Dar libertad de navegación y encuadre global del mapa según filtros. Permitir al usuario reencuadrar rápidamente para ver todos los spots visibles (según el filtro activo) sin tener que hacer zoom/pan manual.

## Archivos tocados

| Archivo | Cambio |
|---------|--------|
| components/design-system/map-controls.tsx | Nuevo botón ViewAll (Scan), props onViewAll y hasVisibleSpots |
| app/(tabs)/index.web.tsx | handleViewAll con fitBounds/flyTo, integración con MapControls |
| app/design-system.web.tsx | Documentación del control ViewAll |
| docs/bitacora/2026/01/023-scope-map-view-all.md | Esta bitácora |

## Decisiones de UX

- **Diferencia entre «mi ubicación» y «ver todo»**: El botón de ubicación centra en el usuario. El botón «ver todo» encuadra ubicación del usuario (si existe) + spots visibles según el filtro. No dependen uno del otro.
- **Relación con filtros activos**: El encuadre respeta el filtro (Todos / Por visitar / Visitados). Si filtro «Por visitar» → solo encuadra spots to_visit. Si filtro «Todos» → encuadra todos.
- **Sin spots visibles**: El botón queda disabled; no ejecuta acción.
- **El botón no cambia filtros**: Solo encuadra lo que ya está visible.

## Decisiones de UI

- **Reutilización**: IconButton canónico (44×44 circular), mismo estilo que zoom y locate.
- **Ubicación**: Colocado sobre los controles de zoom (arriba en la columna vertical).
- **Ícono**: Scan (marco/encuadre) — semántica de «ajustar vista», no pantalla completa.
- **Padding**: 64px en fitBounds para evitar pins pegados al borde.
- **Animación**: ~1.2 s con flyTo / fitBounds.
- **1 spot**: flyTo al punto con zoom 14 en lugar de fitBounds de área cero.

## Design System: MapControlButton / ViewAll

- **Propósito**: Encuadrar el mapa para mostrar todos los spots visibles según el filtro activo.
- **Ícono**: Scan.
- **Estados**: default, pressed, disabled (cuando no hay spots visibles).

## Pendientes / futuros

- Posible feedback visual cuando el mapa ya está encuadrado (ej. botón con estado «activo»).
- Posible tooltip / ayuda contextual («Ver todos los spots»).

## Criterio de cierre

- [x] Botón visible y alineado con controles existentes
- [x] Funciona con todos los filtros (Todos, Por visitar, Visitados)
- [x] Consola limpia
- [x] Bitácora creada y clara

---

## Ajuste incremental (UX)

### Motivación del cambio

El botón original encuadraba solo los spots visibles, pudiendo dejar fuera la ubicación del usuario. Se buscó:

- Mejorar la orientación espacial (usuario siempre en contexto).
- Clarificar la semántica del ícono (encuadre/fit, no pantalla completa).

### Nueva regla de encuadre

El encuadre incluye siempre:

- **Ubicación del usuario** (si existe).
- **Spots visibles** según el filtro activo (Todos / Por visitar / Visitados).

Lógica de fallback:

| Caso | Comportamiento |
|------|----------------|
| userLocation + spots | fitBounds([userLocation, ...visibleSpots]) |
| Solo spots | fitBounds(visibleSpots) |
| Sin spots visibles | Botón deshabilitado |

Nunca se encuadran solo los spots ignorando al usuario.

### Justificación del cambio de ícono

- **Antes**: Maximize2 — sugiere pantalla completa / expandir UI.
- **Después**: Scan — marco con esquinas; comunica "encuadrar / ajustar vista" sin confusión con zoom ni pantalla completa.

### Archivos tocados (ajuste incremental)

| Archivo | Cambio |
|---------|--------|
| app/(tabs)/index.web.tsx | handleViewAll incluye userCoords en pts cuando existe |
| components/design-system/map-controls.tsx | Maximize2 → Scan |
| app/design-system.web.tsx | Documentación actualizada |
| docs/bitacora/2026/01/023-scope-map-view-all.md | Esta sección |
