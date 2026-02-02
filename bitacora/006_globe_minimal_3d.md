# Bitácora: Globo 3D minimal

## Paso: Proyección globe y atmósfera para experiencia 3D

**Fecha:** 2025-02-01

### Objetivo

Dejar el mapa base como un globo 3D minimal: proyección globe, atmósfera/fog, énfasis en agua y vegetación, sin POIs comerciales, manteniendo marcadores, centrado en usuario y fallback.

### Por qué se eligió la proyección globe

- **Globe** muestra el mapa como una esfera 3D en lugar de un plano Mercator.
- Mejora la orientación: se ve el planeta como un todo, con océanos y continentes reconocibles.
- Es la base para una experiencia “exploración” sin saturar con detalle comercial.
- Se mantiene el estilo **light-v11** (limpio, adecuado para exploración).

### Cómo agua y vegetación mejoran la orientación

- **Agua:** El estilo light-v11 dibuja océanos, mares y lagos en tonos azules. La **atmósfera (fog)** se configuró con `high-color` azul (`rgb(36, 92, 223)`) y `color` claro (`rgb(186, 210, 235)`), reforzando la sensación de “Tierra” y haciendo que las masas de agua se lean bien en el globo.
- **Vegetación:** Parques, bosques y zonas verdes siguen visibles en light-v11 (capas de landcover/landuse). El globo y la atmósfera no las ocultan; ayudan a distinguir costa, agua y zonas verdes para orientarse.
- No se añadieron capas ni estilos nuevos; se aprovecha el estilo base y la proyección + fog para que agua y vegetación destaquen.

### Por qué se excluyen los POIs comerciales

- **poi-label** (comercios, tiendas, restaurantes, negocios) se sigue ocultando para:
  - Reducir ruido visual y que los **spots de Flowya** y la geografía (calles, barrios, agua, parques) sean el foco.
  - Evitar que etiquetas de negocios compitan con el contenido de la app.
- Se mantienen visibles: nombres de calles, barrios, edificios públicos y elementos naturales (agua, vegetación).

### Comportamiento actual

- **Proyección:** `projection="globe"` en el Map y `setProjection('globe')` en `onLoad`.
- **Atmósfera:** `setFog()` en `onLoad` con range, color, high-color, horizon-blend, space-color y star-intensity para efecto 3D tipo Tierra.
- **Marcadores:** Sin cambios; se siguen cargando desde Supabase y mostrando en el mapa.
- **Ubicación:** Sigue el centrado en la ubicación del usuario cuando se concede permiso y el fallback (Riviera Maya) si se deniega.

### Archivos tocados

- **Modificados:** `app/(tabs)/index.web.tsx`.
- **Creados:** `bitacora/006_globe_minimal_3d.md`.
