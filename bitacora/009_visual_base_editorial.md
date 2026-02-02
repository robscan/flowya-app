# Bitácora: Base visual editorial

## Paso: Estilo moderno, minimalista y editorial

**Fecha:** 2025-02-01

### Objetivo

Actualizar la UI hacia un estilo limpio, ligero y contemporáneo (inspirado en apple.com e interfaces actuales de Apple), sin replicar “Liquid Glass” ni estéticas retro. Base lista para Spot Detail y el resto del producto.

### Cambios realizados

**1. Tema (`constants/theme.ts`)**  
- **Paleta:** Texto principal (#1d1d1f / #f5f5f7), texto secundario (#6e6e73 / #a1a1a6), fondos neutros (#fbfbfd / #000), superficies elevadas (#fff / #1d1d1f), acento discreto (#0071e3 / #2997ff).  
- **Espaciado:** `Spacing` (xs 4 → xxxl 64) para ritmo consistente.  
- **Sombras:** `Shadow.subtle` y `Shadow.card` muy sutiles (sin elevaciones duras).  
- **Radios:** `Radius` (sm 8 → xl 20) para bordes suaves.  
- **Fuentes:** Web con `-apple-system` y SF Pro en la pila.  
- **Nuevos tokens:** `textSecondary`, `backgroundElevated`, `border`, `borderSubtle` (compatibles con usos existentes de `icon`/`background`).

**2. Design System (componentes)**  
- **Tipografía:** Jerarquía clara (40/28/22 para H1–H3), más line-height, uso de `textSecondary` para metadata.  
- **Botones:** Bordes redondeados (Radius.lg), más padding, secondary con borde sutil; sin estilos “dashboard”.  
- **Cards:** `backgroundElevated`, borde sutil, `Shadow.subtle`, más aire (Spacing).  
- **SpotCard:** Mismo lenguaje (bordes suaves, sombra sutil, botón dismiss discreto).  
- **Map UI (placeholders):** Bordes suaves, `textSecondary`.

**3. Pantalla Design System**  
- Más aire (Spacing.xl, padding generoso).  
- Secciones con `backgroundElevated`, borde sutil y sombra muy sutil.  
- Título de página más grande y con mejor jerarquía; subtítulos y títulos de sección en `textSecondary`.

### Lo que no se cambió

- Lógica y funcionalidad (solo estilos).  
- Librerías (sin añadir dependencias visuales pesadas).  
- Comportamiento del mapa, Spot Detail ni rutas.

### Archivos tocados

- **Modificados:** `constants/theme.ts`, `components/design-system/typography.tsx`, `components/design-system/buttons.tsx`, `components/design-system/cards.tsx`, `components/design-system/spot-card.tsx`, `components/design-system/map-ui.tsx`, `app/design-system.web.tsx`.  
- **Creados:** `bitacora/009_visual_base_editorial.md`.
