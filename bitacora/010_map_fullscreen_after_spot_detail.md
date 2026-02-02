# Bug: Map no vuelve a fullscreen al regresar desde Spot Detail

## Contexto

Al entrar a Spot Detail el layout se correcto. Al presionar "Volver" desde Spot Detail, el mapa ya no ocupaba el alto completo del viewport y quedaba espacio negro/encogido.

## Causa probable

Herencia de layout o del contenedor del stack al volver: el contenedor raíz del mapa dependía de `StyleSheet.absoluteFill` (position absolute + inset 0) sin altura explícita en viewport, por lo que al volver desde Spot Detail el padre (tabs/stack) no garantizaba altura completa.

## Solución aplicada

1. **MapScreenRoot canónico** (`app/(tabs)/index.web.tsx`): contenedor raíz del mapa con `data-flowya="map-screen-root"` y estilos que en **web** incluyen `height: '100vh'` y `minHeight: '100vh'` además de `position: absolute` e inset 0. Así el mapa siempre ocupa el viewport completo al volver, sin depender del padre.

2. **Mismo contenedor en placeholder**: cuando no hay `MAPBOX_TOKEN`, la pantalla usa el mismo `mapScreenRoot` para mantener altura completa.

3. **Sin cambios en Spot Detail**: no se modifica `document.body` ni `#root`; no se añadió cleanup de estilos.

4. **Navegación estándar**: "Volver" sigue usando `router.back()`; MapScreen no se renderiza como hijo de Spot Detail.

## Validación

- Entrar a un Spot → Volver al mapa: el mapa ocupa 100% del alto visible.
- Sin espacios negros; comportamiento idéntico a la primera carga.
- Funciona en mobile web (viewport real).
