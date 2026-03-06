# Plan: Fix geolocalización por intención explícita (on-demand)

Fecha: 2026-03-06  
Estado: Implementado  
Prioridad: Alta (UX de privacidad y fricción inicial)

## Objetivo

Eliminar solicitudes automáticas de permiso de ubicación al cargar vistas y pedir permisos solo cuando el usuario ejecuta una acción explícita (`Mi ubicación`).

## Alcance

### In scope

1. Explore (`useMapCore` + `MapScreenVNext`):
- quitar auto-request en `onMapLoad`;
- mantener solicitud solo en `handleLocate`;
- manejar `denied/timeout/unavailable` con feedback visible.

2. Spot Detail (`app/spot/[id].web.tsx`):
- eliminar request automático al cargar;
- resolver ubicación solo en tap de `Centrar en mi ubicación`;
- mostrar distancia solo cuando existan coords válidas.

3. Map Location Picker:
- quitar auto-centrado por ubicación en `onMapLoad`;
- conservar inicio en `initial coords` o `FALLBACK_VIEW`;
- usar handler explícito de `onLocate` con feedback en denegado.

4. Capa común de geolocalización:
- helper único para permiso + request tipado;
- fallback cuando `navigator.permissions` no está disponible;
- no intentar forzar re-prompt con estado `denied` persistente.

### Out of scope

1. Deep-link directo a configuración del navegador.
2. Cambios de DB, rutas o contratos de datos.
3. Reescritura de controles contextuales no ligados a `Mi ubicación`.

## Diseño técnico

## 1) Módulo compartido

Archivo: `lib/geolocation/request-user-location.ts`

Contrato:
- `getGeolocationPermissionState(): Promise<'granted' | 'prompt' | 'denied' | 'unsupported'>`
- `requestCurrentLocation(): Promise<{status:'ok', coords} | {status:'denied'|'timeout'|'unavailable'|'unsupported'|'unknown'}>`

Reglas:
- sin soporte geoloc => `unsupported`;
- permiso `denied` vía Permissions API => cortar antes de `getCurrentPosition`;
- si Permissions API no existe => fallback a request directo.

## 2) Explore map

- `useMapCore`:
  - eliminar `tryCenterOnUser` en `onMapLoad`;
  - `handleLocate` migra a helper común y devuelve resultado tipado;
  - mantener ciclo location/north y flyTo existente.
- `MapScreenVNext`:
  - manejar `result.status` para toasts:
    - `denied` => guía para habilitar ubicación del sitio;
    - `timeout/unavailable` => error temporal.

## 3) Spot Detail

- borrar `useEffect` de geoloc en carga;
- botón `Centrar en mi ubicación` usa helper común;
- en éxito: set de `userCoords` en pantalla + flyTo;
- en `denied`/errores: toast homogéneo con Explore/Picker.

## 4) Map Location Picker

- `onMapLoad` deja de llamar geoloc automática;
- `MapControls` recibe `onLocate` explícito;
- éxito: flyTo + set de pin en coords de usuario.

## 5) MapControls

- conservar API pública `onLocate?`;
- remover fallback geolocation interno para evitar solicitudes no controladas por contenedor.

## Decisiones UX aplicadas

1. Solicitud por intención explícita en todas las superficies.
2. `denied` persistente no es silencioso: toast guía, sin modal bloqueante.
3. Distancia en Spot Detail no se anticipa sin permiso concedido.

## Criterios de aceptación

1. Explore abre sin prompt; `Mi ubicación` sí puede solicitar permiso.
2. Si permiso queda en `denied`, reintento muestra guía de habilitación.
3. Spot Detail abre sin prompt; distancia aparece solo tras obtener ubicación.
4. Picker abre sin prompt; `Mi ubicación` solicita y centra al conceder.
5. Sin regresión de ciclo location/north ni de fallback visual del mapa.

## Rollback

Revertir rama del fix restaura comportamiento previo:
- requests automáticos en carga en Explore/Spot Detail/Picker;
- ausencia de guía explícita en denegado persistente.

No hay impacto en persistencia de datos ni migraciones.
