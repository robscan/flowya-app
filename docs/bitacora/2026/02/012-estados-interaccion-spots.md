# Bitácora 012 (2026/02) — Estados hover / press / selected en Spots del mapa

**Micro-scope:** B1-MS9  
**Estado:** Cerrado  
**Archivo tocado:** `components/design-system/map-pins.tsx`

---

## Objetivo

Definir feedback de interacción claro para el pin de spot: idle, hover (desktop), press (down/tap), selected. Hover y press sutiles, sin competir con selected. Sin lógica nueva; solo estilos condicionados.

---

## Cambios realizados

### MapPinSpot

- **Estado local:** `isHovered` e `isPressed` (useState false). Se usan solo para feedback visual; el click sigue manejado por el Marker en index.
- **Wrapper:** El `View` raíz (`spotPinWithLabel`) recibe `onMouseEnter`, `onMouseLeave`, `onMouseDown`, `onMouseUp`: entra/sale actualiza hover y limpia press al salir; down/up actualizan press.
- **Estilos condicionados (solo cuando !selected):**
  - **Hover:** halo con `shadowColor` (outline), `shadowOpacity: 0.25`, `shadowRadius: 5` en `spotPinOuter`.
  - **Press:** `transform: [{ scale: 0.95 }]` en `spotPinOuter`.
- **Prioridad:** `showHover = !selected && isHovered`, `showPress = !selected && isPressed`; selected no recibe estilos de hover ni press.
- **Comentario:** JSDoc indica que hover/press son solo feedback y que selected tiene prioridad.

---

## Criterio de cierre

- Hover discreto (halo), solo si no seleccionado.
- Press con scale 0.95, se limpia al soltar o al salir.
- Selected inequívoco; hover y press no compiten.
- No estados pegados (press se limpia en leave/up).
- **npm run build:** OK.

---

## Rollback

Revert del commit del micro-scope. Sin migraciones; estado previo recuperable.
