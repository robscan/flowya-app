# Bitácora: Controles y atribución mobile-first

## Paso: Controles y atribución optimizados para móvil

**Fecha:** 2025-02-01

### Objetivo

Ajustar la posición de los controles del mapa y de la atribución para un uso mobile-first: controles al alcance del pulgar, atribución visible pero discreta, sin solaparse con la barra de pestañas.

### Colocación mobile-first de los controles

- **Posición:** Todos los controles del mapa (zoom, geolocalización, pantalla completa) pasan de `top-right` a **bottom-right**.
- **Motivo:** En móvil, la zona inferior de la pantalla es más accesible con el pulgar (thumb reach). Agrupar zoom, ubicación y fullscreen en la esquina inferior derecha reduce el estiramiento y mejora el uso con una mano.
- **Barra de pestañas:** Se añade `paddingBottom: 56` al contenedor del mapa para que el área de controles quede por encima de la tab bar y no se solape con ella. El mapa sigue ocupando la pantalla; solo se reserva espacio en la parte inferior para que controles y atribución sigan visibles.

### Atribución: mínima pero conforme

- **Modo compacto:** Se desactiva la atribución por defecto del mapa (`attributionControl={false}`) y se añade un **AttributionControl** explícito con `compact={true}`. En modo compacto, Mapbox muestra el botón “i” y el texto de atribución al expandir (hover/tap), cumpliendo con los requisitos sin ocupar espacio fijo.
- **Posición:** El AttributionControl se coloca en **bottom-left** para no competir con los controles (bottom-right) y quedar en una esquina discreta.
- **Cumplimiento:** No se elimina ni se oculta el texto de atribución ni el botón “i”; solo se usa el modo compacto oficial de Mapbox. No se usan hacks de CSS para ocultar elementos requeridos por Mapbox.

### Comportamiento preservado

- Marcadores desde Supabase, centrado en ubicación del usuario, fallback Riviera Maya, proyección globe y atmósfera se mantienen sin cambios.

### Archivos tocados

- **Modificados:** `app/(tabs)/index.web.tsx`.
- **Creados:** `bitacora/007_map_controls_mobile.md`.
