# 215 — F3-001 MS1 smoke OK + avance a MS2

Fecha: 2026-02-28  
Tipo: validación + avance de micro-scope

## Validación MS1

Smoke manual ejecutado y reportado como **OK** para:
- abrir mapa,
- abrir/cerrar search,
- seleccionar spot/POI,
- cambiar filtro,
- abrir sheet en `medium`.

Resultado: MS1 validado sin regresiones observadas en recorrido base.

## Avance a MS2 (sin features nuevas)

Se inicia MS2 con extracción de reglas puras de transición a runtime modular:
- destino de filtro por cambio de estado del pin,
- criterio de limpieza de selección al cambiar filtro,
- criterio de restauración de selección al cerrar search,
- criterio de badge pending / switch de filtro / pulse de filtro.

Ubicación: `core/explore/runtime/transitions.ts` y consumo en `MapScreenVNext`.

## Guardrail vigente

- F3-002 y F3-003 siguen sin implementación runtime.
- Prioridad activa permanece en F3-001 hasta cierre de MS2/MS3.
