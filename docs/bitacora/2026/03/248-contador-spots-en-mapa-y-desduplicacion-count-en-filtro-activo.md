# 248 — Contador de spots en mapa + desduplicación de count en filtro activo

Fecha: 2026-03-01
Tipo: ajuste UX puntual (Bloque A)

## Objetivo

- Mostrar contador de spots en mapa con el mismo formato visual del contador de países (`valor + etiqueta`).
- Evitar redundancia de conteo cuando el filtro activo ya está representado por contador sobre mapa.

## Cambios

Archivos:
- `components/explorar/MapScreenVNext.tsx`
- `components/design-system/map-pin-filter.tsx`

Implementación:
- Se reemplaza badge pequeño por botón completo de spots en overlay (`N + spots`), mismo estilo base del contador de países.
- El botón de spots mantiene la acción existente: abrir listado de spots del filtro activo.
- Se agrega prop `hideActiveCount` al `MapPinFilter` para ocultar el count del trigger activo cuando el overlay de contadores está visible.

## Resultado

- Sobre mapa se ven dos contadores consistentes (países y spots).
- En dropdown activo no se repite el mismo número, reduciendo ruido visual.

## Sanidad

- `npm run lint -- --no-cache` OK.
