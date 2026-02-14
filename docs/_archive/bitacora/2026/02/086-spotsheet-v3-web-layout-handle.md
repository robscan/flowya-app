# Bitácora 086 (2026/02) — SpotSheet V3 Web: layout, handle arrastrable, fondo unificado

## Qué se ajustó

- **Altura dinámica (Expanded)**: `height: "auto"`, `maxHeight: "86dvh"`. El sheet se adapta al contenido; solo hace scroll si el contenido supera el viewport.
- **Botones 50/50**: Guardar y Visitado comparten la fila con `flex: 1` cada uno, `gap: Spacing.md`.
- **Descripción centrada**: `textAlign: "center"` en la descripción corta.
- **Fondo unificado**: Eliminada la banda clara superior. Handle y todo el sheet usan `colors.backgroundElevated`.
- **Handle arrastrable**: Píldora centrada siempre visible (Medium y Expanded). Tap: alterna Medium ↔ Expanded. Drag (web): pointer events con `touchAction: "none"`; deltaY < -40 expande, > 40 colapsa; snap si no se supera umbral.
- **Espaciado**: `SECTION_GAP = Spacing.lg` entre bloques (header, desc, imagen, acciones, extras).

## Archivos tocados

- `components/explorar/SpotSheetV3Web.tsx`

## Cómo probar

1. `/exploreV3` web, seleccionar pin => Peek.
2. Tap en Peek => Medium. Sin scroll; desc centrada; Guardar/Visitado 50/50; handle visible.
3. Tap en handle => Expanded. Altura se adapta al contenido; si es largo, scroll.
4. Arrastrar handle hacia arriba/abajo => cambia Medium ↔ Expanded.
5. Fondo uniforme en todo el sheet.
6. `npm run lint` y `npm run build` OK.
