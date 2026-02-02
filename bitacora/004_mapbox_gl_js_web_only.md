# Bitácora: Mapbox GL JS solo en web

## Paso: Sustituir SDK nativo por Mapbox GL JS (web)

**Fecha:** 2025-02-01

### Objetivo

Eliminar cualquier uso de SDKs nativos de Mapbox y dejar el mapa únicamente en web con Mapbox GL JS, para evitar errores de codegen en el servidor y alinear con un enfoque web-first.

### Por qué el Mapbox nativo no encajaba en web

- Los SDKs nativos de Mapbox (p. ej. **@rnmapbox/maps**) están pensados para iOS/Android y usan código nativo y codegen.
- En un proyecto **web-first** con Expo, incluirlos puede provocar:
  - Errores de **native codegen** en el servidor o en el build.
  - Configuración extra (development builds, no Expo Go estándar para mapas nativos).
- Para una app que prioriza web, un SDK nativo de mapas añade complejidad y riesgo sin beneficio en la plataforma principal.

### Por qué se usa mapbox-gl (GL JS)

- **mapbox-gl** (Mapbox GL JS) es el SDK oficial de Mapbox para **navegador**: solo JavaScript/WebGL, sin código nativo.
- Funciona bien con el bundler de Expo para web y no dispara codegen ni builds nativos.
- Junto con **react-map-gl** (mapbox-legacy) se usa solo en `index.web.tsx`, así que no entra en el bundle de iOS/Android y el mapa en web sigue siendo completo (marcadores, controles, fullscreen).

### Limitación actual: solo web

- El mapa con Mapbox solo se renderiza en **web** (`app/(tabs)/index.web.tsx`).
- En **iOS/Android** (`app/(tabs)/index.tsx`) la pantalla raíz muestra un placeholder: “Map available on web.” No hay mapa nativo ni soporte para iOS/Android en esta fase.
- Variable de entorno: **EXPO_PUBLIC_MAPBOX_TOKEN** (solo necesaria en web).

### Cambios realizados

- Pantalla nativa: `index.tsx` pasa a ser un placeholder sin `react-native-maps` ni `expo-location`.
- Dependencias eliminadas: `react-native-maps`, `expo-location` (evitan codegen y builds nativos de mapas/ubicación).
- Web: `index.web.tsx` sigue usando `mapbox-gl` + `react-map-gl/mapbox-legacy` con **EXPO_PUBLIC_MAPBOX_TOKEN**.

### Archivos tocados

- **Modificados:** `app/(tabs)/index.tsx`, `app/(tabs)/index.web.tsx` (token), `package.json`, `package-lock.json`.
- **Creados:** `bitacora/004_mapbox_gl_js_web_only.md`.
