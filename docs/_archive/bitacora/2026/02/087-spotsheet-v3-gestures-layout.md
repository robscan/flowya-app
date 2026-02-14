# Bitácora 087 (2026/02) — SpotSheet V3: X cierra, drag header, scroll único, CTAs centrados

## Qué se ajustó

- **X cierra sheet completamente**: `onOpenChange(false)` ahora llama `setSelectedSpot(null)` + `setSheetState("peek")` (antes solo peek; el sheet seguía visible).
- **Drag desde todo el header**: Handle + título + X en una sola región con `touchAction: "none"`; `data-no-drag` en Share/X para que reciban clicks; comentarios gesture/pointerEvents.
- **Scroll único**: Eliminado scroll parcial desde "A 435m...". Un solo ScrollView para el body completo (mediumCore + extras) debajo del header fijo.
- **Header compacto**: Handle como parte del header; HANDLE_HEIGHT 20px; gap reducido.
- **CTAs centrados**: Guardar y Visitado con `justifyContent: "center"` y `gap: Spacing.sm`.

## Archivos tocados

- `components/explorar/MapScreenVNext.tsx`
- `components/explorar/SpotSheetV3Web.tsx`
