# 244 — Map controls + contador de países: alineación, anclajes y transiciones

Fecha: 2026-03-01  
Tipo: ajuste UX/runtime de overlays en Explore

## Objetivo

Mejorar accesibilidad y estabilidad visual de la columna derecha de overlays en mapa:

- Reubicar `MapControls` a altura media (más thumb-friendly) cuando aplica.
- Mantener comportamiento canónico de controles pegados al sheet cuando corresponde.
- Separar claramente grupos: contador de países vs controles.
- Eliminar saltos bruscos por cambios de anclaje durante animaciones/filtros.

## Cambios implementados

### 1) Baseline y organización por estado

Archivo: `components/explorar/MapScreenVNext.tsx`

- Se introdujo cálculo explícito de baseline/offset para overlays de controles y contador.
- En `pinFilter=all`, los controles usan altura media asignada (sin mostrar contador).
- En `pinFilter=saved|visited`, se muestra `contador + controles` con separación (`COUNTRIES_AND_CONTROLS_GAP`).

### 2) Contrato con sheet (peek/medium/expanded)

- Se preserva el contrato de runtime existente:
  - con SpotSheet visible, `MapControls` permanecen anclados por `bottom` al sheet.
- Ajuste específico solicitado:
  - en `sheetState=peek`, el contador se mantiene en altura media asignada para mejorar alcance táctil.

### 3) Estabilidad de animaciones (sin “barridos”)

Se corrigieron saltos visuales detectados al cambiar filtros y/o abrir sheet:

- Se evitó alternar anclajes `top/bottom` a mitad de transición.
- Se consolidó posicionamiento en coordenadas estables y se añadió modo de anclaje para contador (`countriesOverlayAnchorMode`) para conservar referencia durante salida/entrada.
- Se reservó siempre un slot vertical para el contador (`COUNTRIES_SLOT_RESERVED`), incluso cuando no está visible, evitando reflow brusco de controles.

### 4) Alineación horizontal de centros

- Se detectó desfase visual entre el centro del contador (64px) y controles (44px).
- Ajuste final aplicado según criterio UX:
  - mantener padding derecho constante del contador,
  - desplazar columna de controles a la izquierda (vía `right` compensado) para alinear centros de contenedor.

## Constantes/tokens añadidos

En `MapScreenVNext.tsx`:

- `MAP_CONTROL_BUTTON_SIZE = 44`
- `COUNTRIES_COUNTER_SIZE = 64`
- `COUNTRIES_AND_CONTROLS_GAP = 12`
- `COUNTRIES_SLOT_RESERVED = COUNTRIES_COUNTER_SIZE + COUNTRIES_AND_CONTROLS_GAP`
- `COUNTRIES_CENTER_ALIGNMENT_OFFSET = (COUNTRIES_COUNTER_SIZE - MAP_CONTROL_BUTTON_SIZE) / 2`
- `MAP_CONTROLS_FALLBACK_HEIGHT = 148`

## Riesgos y mitigaciones

1. Riesgo: micro-jump al inicializar altura real de controles.
- Mitigación: fallback (`MAP_CONTROLS_FALLBACK_HEIGHT`) + actualización por `onLayout` solo con delta significativo.

2. Riesgo: regresión en interactividad del mapa por “slot reservado”.
- Mitigación: no se renderiza placeholder interactivo; solo se reserva espacio en cálculo de posición.

## Sanidad local

- Validación focal ejecutada repetidamente durante el ajuste:
  - `expo lint components/explorar/MapScreenVNext.tsx`
- Estado: OK.

## Resultado

Se mejora la accesibilidad de la columna de acciones en mapa y se elimina el comportamiento de salto/desfase visual en transiciones entre filtros/sheet, manteniendo el contrato canónico de controls vs sheet.
