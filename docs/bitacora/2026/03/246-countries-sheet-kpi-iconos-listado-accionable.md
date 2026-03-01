# 246 — CountriesSheet KPI: iconos de listado en acciones (sin flecha)

Fecha: 2026-03-01  
Tipo: ajuste UX puntual en KPI de CountriesSheet

## Objetivo

Alinear affordance visual de KPI con la intención real de interacción:

- Reemplazar flecha (`ChevronRight`) por icono de listado seleccionable en los KPI accionables.
- Mantener comportamiento condicional existente por estado de sheet.

## Cambio aplicado

Archivo: `components/explorar/CountriesSheet.tsx`

- KPI `países`:
  - Cuando es accionable y aplica visualmente, el icono ahora es `List`.
- KPI `spots`:
  - Cuando es accionable, el icono ahora es `List`.

## Reglas preservadas

- Se mantiene la regla de visibilidad para países:
  - En `expanded`, el icono accionable de `países` no se muestra.
- No se modifica la lógica de `onCountriesKpiPress` / `onSpotsKpiPress`, solo el affordance visual.

## Validación

- Sanidad focal ejecutada:
  - `expo lint components/explorar/CountriesSheet.tsx`
- Estado: OK.

## Resultado

KPI con semántica visual más consistente: cuando hay acción de drilldown/listado, se muestra icono de listado en vez de flecha, respetando el contrato de visibilidad por estado.
