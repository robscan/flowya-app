# 258 — Post-QA v3: tonos activos, contraste y retención de sheet al limpiar filtro

Fecha: 2026-03-01
Tipo: ajuste UX/UI + accesibilidad + regla de interacción de selección

## Contexto

En revisión final se solicitaron tres ajustes de cierre:

1. Unificar tonos activos `Por visitar` / `Visitados` en light y dark usando el tono más vivo (referencia dark).
2. Alinear botones activos de estado (`Por visitar`, `Visitado`) para usar esos mismos tonos con contenido negro.
3. Al quitar estado activo desde el botón del sheet (ej. `Por visitar ×`), mantener spot seleccionado y sheet visible.

## Cambios aplicados

### 1) Tonos activos unificados (light + dark)
Archivos:
- `components/design-system/map-pin-filter.tsx`
- `components/design-system/map-pin-filter-inline.tsx`

- Se fija fuente única de color activo en ambos modos:
  - `saved / Por visitar` => `Colors.dark.stateToVisit`
  - `visited / Visitados` => `Colors.dark.stateSuccess`

### 2) Botones activos con foreground negro
Archivos:
- `components/explorar/SpotSheet.tsx`
- `components/design-system/icon-button.tsx`
- `components/design-system/spot-detail.tsx`
- `components/design-system/spot-card.tsx`

- Pills activas del sheet (`Por visitar`, `Visitado`) usan:
  - fondo: tonos vivos anteriores
  - texto + icono: negro (`Colors.light.text`)
- `IconButton` variante `savePin` y sus consumidores (`SpotDetail`, `SpotCard`) se alinean al mismo criterio para estado activo persistente.

### 3) Regla de selección al limpiar estado desde sheet
Archivo:
- `components/explorar/MapScreenVNext.tsx`

- Nueva excepción controlada:
  - si usuario ejecuta `clear_to_visit` o `clear_visited` desde el sheet,
  - y el spot queda fuera del filtro activo,
  - **no se cierra sheet ni se limpia selección**.
- La selección preservada se limpia cuando:
  - el usuario cierra sheet/selección, o
  - cambia a otro spot.

## Accesibilidad (contraste)

Se verificaron pares críticos de botones activos:

- `Por visitar` activo (`#ff9f0a`) + texto/icono negro (`#1d1d1f`) => **8.19:1** ✅
- `Visitado` activo (`#30d158`) + texto/icono negro (`#1d1d1f`) => **8.32:1** ✅

Cumplen WCAG AA/AAA para texto normal.

## Resultado

- Estados activos más claros visualmente y consistentes entre modos.
- Contenido legible y accesible en botones activos.
- Interacción de usuario más estable al quitar estado: no pierde el contexto de spot abierto.

## Sanidad

- `npm run lint -- --no-cache` OK.
