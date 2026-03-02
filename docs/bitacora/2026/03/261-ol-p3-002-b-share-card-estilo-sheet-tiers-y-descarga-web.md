# 261 — OL-P3-002.B: share card estilo sheet + tiers de viajero + descarga web

Fecha: 2026-03-01
Tipo: UX visual + share behavior

## Objetivo

Alinear la imagen compartida de países al lenguaje visual de `CountriesSheet` y mejorar salida de compartir en web.

## Cambios visuales

Archivo: `lib/share-countries-card.ts`

- Rediseño del render share card:
  - elimina contenedores/cajas de KPI y listado,
  - layout con proporciones tipo sheet (KPI arriba, mapa central, barra de progreso debajo),
  - fondo temático por filtro usando el acento recibido (`visitados` verde, `por visitar` naranja),
  - mantiene mapa y top países con presentación minimal.
- KPI de progreso mundial:
  - texto pasa de `X% del mundo` a `X% de 195`.
- Barra de progreso incluida en share card.
- Copy de progreso actualizado a tiers de viajero:
  - `Viajero inicial`
  - `Viajero en ruta`
  - `Viajero constante`
  - `Explorador global`
  - `Viajero experto`

## Cambios en sheet

Archivo: `components/explorar/CountriesSheet.tsx`

- KPI superior izquierdo cambia etiqueta de `del mundo` a `de 195`.
- Copy de progreso del sheet usa mismos tiers de viajero (sin referencia a “Primeros pasos”).

## Cambios de compartir en web

Archivos:
- `lib/share-countries-card.ts`
- `components/explorar/MapScreenVNext.tsx`

- Nuevo fallback de descarga local de imagen (`flowya-paises.png`) cuando no hay share nativo disponible.
- Share mantiene prioridad:
  1) `navigator.share` con archivo (redes/apps compatibles),
  2) `navigator.share` con texto,
  3) descarga de imagen en computadora,
  4) copy al portapapeles.
- `MapScreenVNext` muestra toast explícito cuando el resultado fue descarga local.

## Resultado esperado

- Imagen compartida más limpia, consistente con sheet y sin “cards dentro de cards”.
- Mensajería de progreso más útil y orientada al perfil de viajero.
- En web: usuario puede compartir o, si no hay soporte, guardar la imagen en computadora.

## Sanidad

- `npm run lint -- --no-cache` OK.
