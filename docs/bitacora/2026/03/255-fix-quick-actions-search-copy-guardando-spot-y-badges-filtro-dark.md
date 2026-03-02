# 255 — Fix: Quick Actions Search, copy “Guardando spot” y badges de filtro en dark

Fecha: 2026-03-01
Tipo: bugfix UX + hardening interacción + saneamiento visual DS

## Síntomas

- Al crear spot desde POI, el estado de carga mostraba `Creando spot…` (copy ambiguo para usuario).
- En resultados visitados del buscador, al tocar `Agregar imagen` podía detonar también apertura del spot sheet.
- `Agregar imagen` emitía warning deprecado de `expo-image-picker` por `MediaTypeOptions`.
- En dark mode, badges de conteo en filtros usaban colores en duro y no respetaban el sistema de diseño canónico.

## Causas

- Copy heredado de fase anterior sin ajuste semántico de guardado.
- Acción inline dentro de card interactiva requería hardening adicional para suprimir press padre en Web/React Native Web.
- Uso de API deprecada de `expo-image-picker`.
- Constantes hardcodeadas en componentes de filtro (`COUNT_BADGE_BG_DARK`, `COUNT_BADGE_TEXT_LIGHT`).

## Fix

### 1) Copy de loading POI
Archivo: `components/explorar/SpotSheet.tsx`

- Se actualiza texto de estado de `Creando spot…` a `Guardando spot…`.

### 2) Hardening de quick actions en cards de búsqueda
Archivo: `components/design-system/search-list-card.tsx`

- Se agrega guardia `suppressCardPressRef` para evitar que acciones inline propaguen y activen el `onPress` de card.
- Se incorpora `markInlineActionIntent()` en captura de responder de:
  - placeholder `Agregar imagen`
  - CTA `Agregar una descripción corta.`
- `onPress` de card ahora pasa por `handleCardPress()` y cancela navegación si hubo intención de quick action.
- Se resetea guardia en micro-delay para evitar bloquear taps subsecuentes.

### 3) Migración de `expo-image-picker` (deprecación)
Archivos:
- `components/explorar/MapScreenVNext.tsx`
- `components/explorar/SpotSheet.tsx`

- Se reemplaza `mediaTypes: ImagePicker.MediaTypeOptions.Images` por `mediaTypes: ["images"]`.

### 4) Badges de conteo en filtros sin colores en duro
Archivos:
- `components/design-system/map-pin-filter.tsx`
- `components/design-system/map-pin-filter-inline.tsx`

- Se eliminan constantes hardcodeadas de badge.
- Badge ahora usa tokens del tema:
  - fondo: `colors.surfaceOnMap` (claro también en dark)
  - texto: `colors.pin.default` (oscuro)
- Resultado: contador consistente entre modos y ligado a fuente canónica de color.

## Resultado esperado

- Usuario ve `Guardando spot…` durante persistencia desde POI.
- `Agregar imagen` y `Agregar una descripción corta` en buscador operan como quick action sin abrir spot sheet por propagación.
- Sin warning deprecado por `MediaTypeOptions`.
- Badges de conteo en filtros se renderizan con tokens DS, incluyendo dark mode (fondo claro + texto oscuro).

## Sanidad

- `npm run lint -- --no-cache` OK.
