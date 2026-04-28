# 400 — iOS Simulator: mapa nativo minimo en Explore

**Fecha:** 2026-04-27
**Tipo:** P0 operativo / Store Readiness

## Reporte

En iPhone 15 Pro Simulator, la pantalla inicial mostraba:

```text
Map available on web.
```

Hasta este punto la validacion principal habia sido web. El hallazgo bloquea V1 mobile porque FLOWYA es map-first y el mapa no puede existir solo en web.

## Diagnostico

- `app/(tabs)/index.web.tsx` monta `MapScreenVNext`.
- `app/(tabs)/index.tsx` montaba un placeholder nativo.
- El problema no era un fallo de Mapbox runtime: era falta de superficie nativa.
- El repo no versiona carpetas `ios/`/`android`; se mantiene flujo Expo.

## Decision

Agregar una superficie nativa minima para iOS/Android usando `react-native-maps`:

- render de mapa nativo;
- carga best-effort de spots publicos desde Supabase;
- pines simples con callout;
- sin pedir permiso de ubicacion;
- sin tocar DB, RLS, Storage ni contratos de datos.

## Alcance minimo

- Instalar `react-native-maps` compatible con Expo SDK 54.
- Reemplazar el placeholder nativo de `app/(tabs)/index.tsx`.
- Crear `components/explorar/NativeExploreMapScreen.tsx`.
- Crear `components/explorar/NativeExploreMapScreen.web.tsx` para que `expo export -p web` no arrastre `react-native-maps` al bundle web.
- Actualizar Store Readiness para exigir smoke de iOS Simulator cuando el PR toque shell/mapa/mobile.

## No tocado

- `MapScreenVNext` web.
- Search, sheets, Flow, Passport o Account.
- Migraciones.
- RLS.
- Storage.
- Permisos de ubicacion.

## Riesgos

- Paridad funcional limitada: iOS ya muestra mapa real, pero no tiene aun toda la experiencia Mapbox web.
- `react-native-maps` agrega dependencia nativa; en Expo Go/Simulator debe validarse runtime.
- Muchos markers pueden requerir optimizacion posterior; se limita la carga inicial a 150 spots.

## Pruebas

- `npx tsc --noEmit`
- `npm run test:regression`
- `git diff --check`
- `npm run build`
- `npx expo start --ios --localhost --port 8082 --clear` con iPhone 15 Pro Simulator: render de mapa confirmado.
- Consulta Supabase con el filtro nativo `not.is.null` verificada por anon client.

Nota: `npx expo install --check` reporta desalineaciones preexistentes (`expo`, `expo-image-picker`, `expo-linking`, `expo-web-browser`, `react-native-svg`). No se corrigen en este PR para no mezclar upgrade de SDK con el P0 del mapa.

Pendiente manual:

- confirmar con el simulador del usuario que ya no aparece el placeholder;
- confirmar pan/zoom en la sesion de validacion del usuario;
- confirmar que los pines aparecen si Supabase responde.

## Rollback

Revertir:

- `components/explorar/NativeExploreMapScreen.tsx`;
- cambio en `app/(tabs)/index.tsx`;
- dependencia `react-native-maps` en `package.json`/`package-lock.json`;
- esta bitacora y referencias documentales.
