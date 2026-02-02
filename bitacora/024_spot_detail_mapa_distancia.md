# Bitácora 024 — Spot Detail: ajustes de mapa + distancia

## Objetivo del ajuste

Mejorar la sección de mapa y ubicación en Spot Detail para dar mejor jerarquía (dirección como confirmación), controles útiles de mapa y distancia pasiva al spot.

## Cambio de jerarquía

- **Antes**: Dirección textual antes del mapa (dentro del contenido).
- **Después**: Dirección y distancia debajo del mapa, como información de confirmación.
- **Orden final**: Hero → Título → Descripción corta → Descripción larga → Mapa → Dirección + Distancia.

La dirección pasa a sentirse como información de confirmación, no como contenido principal.

## Archivos tocados

| Archivo | Cambio |
|---------|--------|
| components/design-system/spot-detail.tsx | Reorden: dirección bajo mapa; nueva sección locationInfo; prop distanceText |
| app/spot/[id].web.tsx | SpotDetailMapSlot: controles overlay, userCoords, user marker; userCoords + distanceText |
| lib/geo-utils.ts | Nuevo: distanceKm, formatDistanceKm, getMapsDirectionsUrl |

## Decisiones de UX

### Controles permitidos (máx. 3)

1. **Mi ubicación**: Mismo control que Home. Centra en el usuario. IconButton canónico, esquina inferior derecha.
2. **Cómo llegar**: Abre app externa (Google Maps) con deep link a direcciones al spot. Sin rutas ni navegación dentro de FLOWYA.
3. **Reencuadre usuario + spot**: fitBounds entre ubicación del usuario y el spot. Si no hay ubicación → botón deshabilitado. Específico para este spot, no es “ver todo”.

### Distancia pasiva

- Calcular **una sola vez** al entrar al Spot Detail.
- Solo si existe ubicación del usuario.
- No recalcular en re-renders, scroll ni cambios de orientación.
- No usar watchPosition.
- UI: «A 1.2 km de tu ubicación» como texto secundario.
- Si no hay ubicación: no mostrar nada, sin placeholders.

### Justificación de no recalcular distancia

- Evitar uso innecesario de geolocalización.
- El usuario no espera actualización en tiempo real en esta pantalla.
- Comportamiento pasivo e informativo.

## Decisiones de UI

- Altura del mapa: ~200 px (mobile).
- El mapa es informativo, no protagonista.
- No duplicar acciones del hero en el mapa.
- Controles: Locate, Navigation (cómo llegar), Scan (reencuadrar).

## Pendientes futuros

- Flows de navegación más avanzados.
- Soporte nativo para Apple Maps / Google Maps según plataforma.
- Posible tooltip en controles del mapa.

## Criterio de cierre

- [x] Dirección visible debajo del mapa
- [x] Controles de mapa funcionando y consistentes
- [x] Distancia visible solo cuando aplica
- [x] Consola limpia
- [x] Bitácora actualizada
