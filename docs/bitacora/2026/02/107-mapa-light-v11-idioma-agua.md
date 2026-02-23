# Bitácora 107 — Mapa light-v11 + idioma + agua/naturaleza + Standard predeterminado

**Fecha:** 2026-02-23

## Objetivo

Probar estilos Mapbox core (light-v11/dark-v11) en Explore, con plugin de idioma y colores más intensos para agua y zonas verdes. Toggle de seguridad para rollback sin redeploy. En feb 2026 se adoptó Mapbox Standard como predeterminado y se añadió flujo tap POI.

---

## Estado final (tras ajustes)

- **Estilos por defecto:** Mapbox Standard — `EXPO_PUBLIC_USE_CORE_MAP_STYLES=true` (toggle preservado para rollback)
- **pointerEvents deprecation:** corregidos en CreateSpotNameOverlay, SearchOverlayWeb, SearchFloatingNative (uso de `style.pointerEvents` en lugar de `props.pointerEvents`)
- Mapbox Standard genera alertas (`featureNamespace place-labels`, `Ignoring unknown image variable`, `Cutoff terrain`); FLOWYA las evita
- **Access token:** no hace falta aportar nada adicional; el token está en `.env` como `EXPO_PUBLIC_MAPBOX_TOKEN`. Los estilos FLOWYA se gestionan en Mapbox Studio.

### Feb 2026 — Standard predeterminado, 3D, flujo POI y pines

- **Parte 1:** Mapbox Standard como predeterminado; 3D (buildings + terrain); NavigationControl.
- **Parte 2:** Tap en POI del mapa → sheet con nombre → botones "Agregar spot" y "Agregar a por visitar" (usa `queryRenderedFeatures`).
- **Parte 4:** Pines alineados visualmente con Mapbox: tamaño 14/32 (reposo/seleccionado), halo en labels, gap 3, maxWidth 90.

---

## Cambios aplicados

### 1. Toggle de seguridad

- Variable de entorno `EXPO_PUBLIC_USE_CORE_MAP_STYLES`:
  - `true` (default desde feb 2026): Mapbox Standard, 3D, flujo tap POI.
  - `false`: estilos FLOWYA (Mapbox Studio); rollback sin redeploy.

### 2. Dependencia

- `@mapbox/mapbox-gl-language` — plugin para etiquetas según idioma del navegador.

### 3. Estilo y constantes ([lib/map-core/constants.ts](lib/map-core/constants.ts))

- `MAP_STYLE_STANDARD` = `mapbox://styles/mapbox/standard` (en vez de light-v11/dark-v11): light-v11 es clásico, no tiene basemap; Standard sí y permite showLandmarkIcons, hideCommercialPOIs, etc.
- Nueva función `hideCommercialPOIsViaConfig(map)`: setConfigProperty showPointOfInterestLabels=false.
- Nueva función `applyWaterAndGreenspaceColors(map, isDark)`: colores más intensos vía `setConfigProperty('basemap', ...)`:
  - Light: agua `#7eb8da`, greenspace `#6fa86f`
  - Dark: agua `#4a7ba7`, greenspace `#4a7a4a`

### 4. MapScreenVNext

- Toggle condicional para elegir estilos.
- Pasa `useCoreMapStyles` e `isDarkStyle` a useMapCore.

### 5. useMapCore ([hooks/useMapCore.ts](hooks/useMapCore.ts))

- Opciones `useCoreMapStyles`, `isDarkStyle`.
- **Plugin de idioma:** siempre activo (FLOWYA y Mapbox Standard).
- Cuando `useCoreMapStyles === true`: colores + `hideCommercialPOIsViaConfig` (oculta POIs comerciales vía config; landmarks se mantienen visibles).
- Cuando FLOWYA: `hideNoiseLayers` (capas) + `showLandmarkLabels`.

---

## Verificación pendiente

- Activar con `EXPO_PUBLIC_USE_CORE_MAP_STYLES=true` y probar Explore (modo claro y oscuro).
- Comprobar etiquetas del mapa en español según idioma del navegador.
- Verificar colores agua y zonas verdes más visibles.
- Confirmar landmarks visibles y no POIs comerciales.
- Revisar consola: ver si desaparecen alertas Mapbox (OL-MAPBOX-001) con Standard.

### 6. MapCoreView

- Nuevo prop `mapConfig` para pasar config del basemap (lightPreset day/night) al Map de Mapbox Standard.
