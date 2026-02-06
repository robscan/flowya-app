# Bitácora 025 — Spot Detail: iteración fina (UX/UI)

## Objetivo del ajuste

Refinar jerarquía visual, claridad de iconografía y micro-copy conversacional en Spot Detail. Ajustes incrementales sin modificar lógica ni flujos.

## Ajustes visuales del botón «Agregar pin»

- **Cambio**: Background = color Text, Icono = color Background.
- **Alcance**: Solo el botón Agregar pin (variant savePin, savePinState default), en Spot Detail hero y SpotCardMapSelection.
- **Motivación**: Relación visual directa con los pins negros del mapa; destacar frente a otros botones circulares sin competir con primarios globales.
- **Implementación**: IconButton — cuando variant=savePin y savePinState=default, backgroundColor=colors.text; padres pasan iconColor=colors.background.

## Micro-copy conversacional

- **¿Dónde está?**: Heading 3 inmediatamente antes del mapa. Ancla semántica de la sección. Tono conversacional. Sin ícono.
- **¿Por qué importa?**: Heading 3 antes de la descripción larga. Solo si existe descripción larga.

## Mejora de jerarquía de distancia

- **Antes**: Distancia en sección debajo del mapa, baja jerarquía.
- **Después**: Distancia debajo del heading «¿Dónde está?», como texto secundario pero legible (15px). Estructura: ¿Dónde está? → distancia → mapa → dirección.
- Sin recalcular distancia. Sin cambios de lógica.

## Decisiones de iconografía en mapa

| Control        | Antes    | Después | Motivación                                      |
|----------------|----------|---------|-------------------------------------------------|
| Cómo llegar    | Navigation | Route  | Evitar confusión con «Mi ubicación». Route = rutas/direcciones. |
| Reencuadrar    | Scan     | Frame   | Scan sugería pantalla completa. Frame = encuadre/ajuste. |

## Otras decisiones

- **Altura del mapa**: 320px (antes 200px). Navegación cómoda, mapa no decorativo.
- **Borde savePin**: Transparente para todos los estados (fondo sólido).

## Motivación UX

- Claridad: iconos inequívocos.
- Lectura: headings conversacionales guían el escaneo.
- Orientación: distancia visible en contexto de ubicación.
- Consistencia: botón Agregar pin alineado con semántica de pins del mapa.

## Archivos tocados

| Archivo                 | Cambio                                   |
|-------------------------|-------------------------------------------|
| components/design-system/icon-button.tsx | savePin default: bg=text, border transparent |
| components/design-system/spot-detail.tsx | Headings, reorden, distancia, mapa 320px |
| components/design-system/spot-card.tsx   | savePinIconColor=background en default  |
| app/spot/[id].web.tsx   | MAP_SPOT_HEIGHT 320, Route, Frame        |

## Criterio de cierre

- [x] Botón Agregar pin visualmente diferenciado
- [x] Secciones con headings conversacionales
- [x] Distancia claramente visible
- [x] Mapa cómodo (320px)
- [x] Iconos inequívocos
- [x] Consola limpia
