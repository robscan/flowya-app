# Bitácora: Mapa como pantalla raíz

## Paso: Mapa en la pantalla principal (Home)

**Fecha:** 2025-02-01

### Objetivo

Mostrar un mapa a pantalla completa como pantalla raíz (Home), con spots cargados desde Supabase y controles básicos, sin navegación a detalle ni UI extra.

### Implementado

1. **Web (Mapbox)**  
   - Pantalla: `app/(tabs)/index.web.tsx`.  
   - SDK: `react-map-gl` (mapbox-legacy) + `mapbox-gl`.  
   - Mapa a pantalla completa, vista inicial por defecto (longitude, latitude, zoom).  
   - Spots: consulta a Supabase `spots` con `select('id, latitude, longitude')`.  
   - Un marcador por spot (`Marker` de react-map-gl).  
   - Controles: zoom (NavigationControl), ubicación actual (GeolocateControl), pantalla completa (FullscreenControl).  
   - Token: `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`. Si no está definido, se muestra un mensaje en pantalla en lugar del mapa.

2. **Native (iOS/Android)**  
   - Pantalla: `app/(tabs)/index.tsx`.  
   - SDK: `react-native-maps` (incluido en Expo).  
   - Mapa a pantalla completa con región inicial por defecto.  
   - Misma carga de spots desde Supabase y un marcador por spot.  
   - Controles: zoom (`zoomControlEnabled`), ubicación actual (`showsUserLocation`, `showsMyLocationButton`) solo si el usuario concede permiso.  
   - Permisos: `expo-location` `requestForegroundPermissionsAsync()`; si se deniega, no se muestra ubicación ni alertas bloqueantes.

3. **Dependencias añadidas**  
   - `react-map-gl`, `mapbox-gl` (web).  
   - `react-native-maps`, `expo-location` (native y ubicación).

### Intencionalmente excluido

- Navegación a detalle de spot al tocar un marcador.  
- Cards, popups, clustering o UI personalizada sobre el mapa.  
- Políticas RLS, auth o lógica de backend adicional en esta pantalla.  
- Alertas bloqueantes por permisos; si se deniega ubicación, simplemente no se muestra la capa de ubicación.

### Comportamiento de borrado / permisos

- No aplica borrado en esta pantalla.  
- Ubicación: si el usuario niega el permiso, la app sigue funcionando; solo se ocultan la capa de ubicación y el botón “mi ubicación”.

### Archivos tocados

- **Creados:** `app/(tabs)/index.web.tsx`, `bitacora/003_map_root_screen.md`.  
- **Modificados:** `app/(tabs)/index.tsx` (reemplazado contenido por la pantalla del mapa), `package.json` / `package-lock.json` (dependencias).  
- **Sin cambios:** resto de carpetas y archivos; no se refactorizaron nombres ni rutas.
