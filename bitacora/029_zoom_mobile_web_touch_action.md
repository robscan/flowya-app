# Bitácora 029 — Bloqueo de zoom y touch-action en mobile web

## Problema UX observado

En Safari y Chrome mobile, el doble tap sobre el mapa o los botones provocaba zoom accidental. La app FLOWYA es interactiva (mapa táctil, botones, controles) y no un sitio de lectura. El zoom interrumpía la experiencia y causaba pérdida de contexto.

## Decisiones tomadas

### 1. Viewport: desactivar zoom

**Archivo:** `app/+html.tsx`

Establecer meta viewport con `initial-scale=1`, `maximum-scale=1` y `user-scalable=no` para que el navegador no aplique zoom por doble tap ni pinch.

- **Solo web:** Este archivo solo afecta el build web; los builds nativos (iOS/Android) no lo usan.
- **Beneficio:** Evita zoom accidental al interactuar con el mapa y los controles.

### 2. touch-action: manipulation en botones

**Token:** `WebTouchManipulation` en `constants/theme.ts`

Añadir `touch-action: manipulation` a todos los botones interactivos para indicar explícitamente al navegador que son elementos de acción, no contenido que deba ampliarse.

**Alcance:**
- IconButton (controles de mapa, hero, spot detail)
- ButtonPrimary, ButtonSecondary
- Botones de confirm-modal
- Botones del wizard Create Spot
- Botón Confirmar en MapLocationPicker
- Botón Eliminar en Spot Detail

**Implementación centralizada:** Un solo token `WebTouchManipulation` en theme; se aplica vía estilo en cada Pressable. Solo activo en web (`Platform.OS === 'web'`).

**Beneficio:** Doble tap en botones no provoca zoom; el tap simple sigue funcionando con normalidad.

## Relación con Bitácora 028

Los estados pressed/selected canónicos (Bitácora 028) proporcionan feedback visual al tap. La combinación con viewport y touch-action mejora la UX mobile web:

- Sin zoom accidental
- Feedback claro al tocar
- Interacción fluida con mapa y botones

## Archivos tocados

| Archivo | Cambio |
|---------|--------|
| app/+html.tsx | Nuevo: viewport custom con maximum-scale=1, user-scalable=no |
| constants/theme.ts | WebTouchManipulation |
| components/design-system/icon-button.tsx | WebTouchManipulation |
| components/design-system/buttons.tsx | WebTouchManipulation |
| components/design-system/spot-detail.tsx | WebTouchManipulation en Eliminar |
| components/design-system/map-location-picker.tsx | WebTouchManipulation |
| components/ui/confirm-modal.tsx | WebTouchManipulation |
| app/create-spot/index.web.tsx | WebTouchManipulation en primary buttons |
| bitacora/029_zoom_mobile_web_touch_action.md | Esta bitácora |

## Implementación técnica

### Viewport (app/+html.tsx)

```html
<meta
  name="viewport"
  content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, shrink-to-fit=no"
/>
```

### WebTouchManipulation (constants/theme.ts)

```typescript
export const WebTouchManipulation =
  Platform.OS === 'web' ? { touchAction: 'manipulation' as const } : {};
```

Uso en componentes: añadir `WebTouchManipulation` al array de estilos del Pressable.

## Criterios de cierre

- [x] Doble tap no hace zoom
- [x] Scroll normal sin cambios
- [x] touch-action solo en web
- [x] Solución centralizada en design system / theme
