# Bitácora 028 — Estados pressed / selected canónicos (Design System)

## Objetivo

Definir y aplicar estados canónicos de interacción para feedback visual inmediato y consistente en botones.

## Decisión de UX

- **Feedback inmediato**: El estado se muestra al hacer tap y se oculta al soltar.
- **Sin ambigüedad**: No usar opacity como feedback; usar cambio de color de fondo.
- **Consistencia**: Mismo patrón en web y mobile.

## Estados por tipo de botón

### IconButton

| Estado | Background | Icono |
|--------|------------|-------|
| Rest | Según variant (default, primary, savePin) | Según padre |
| Pressed | primary | #ffffff |
| Disabled | Rest + opacity 0.5 | — |

### Button Primary

| Estado | Background | Texto |
|--------|------------|-------|
| Rest | primary | #fff |
| Pressed | text | #fff (sin cambio) |
| Disabled | primary | #fff |

### Button Secondary

| Estado | Background | Texto |
|--------|------------|-------|
| Rest | transparent | text |
| Pressed | backgroundElevated | text |
| Disabled | transparent | text |

## Implementación técnica

- Tokens: `pressed` desde `Pressable` (style y children como función).
- IconButton: `React.cloneElement` para inyectar `color` en el icono cuando pressed.
- ButtonPrimary / ButtonSecondary: componentes canónicos exportados.
- No hardcodear estilos por pantalla; reutilizar componentes.

## Archivos tocados

| Archivo | Cambio |
|---------|--------|
| components/design-system/icon-button.tsx | Estado pressed: bg primary, icon #fff; sin opacity |
| components/design-system/buttons.tsx | ButtonPrimary, ButtonSecondary con pressed canónico |
| components/design-system/index.ts | Export ButtonPrimary, ButtonSecondary |
| components/design-system/spot-detail.tsx | Usa ButtonPrimary; Eliminar con pressed secondary |
| components/ui/confirm-modal.tsx | Cancel/Confirm con pressed canónico |
| components/design-system/map-location-picker.tsx | Confirmar con pressed canónico |
| app/create-spot/index.web.tsx | Primary buttons con pressed canónico |
| docs/bitacora/2026/01/028-estados-pressed-canonicos.md | Esta bitácora |

## Criterios de cierre

- [x] Todos los botones reaccionan visualmente al tap
- [x] Feedback claro, inmediato y consistente
- [x] Sin opacity como feedback
- [x] Sin warnings nuevos
