# WOW Audit — Pines

**Fecha:** 2026-02-26
**Alcance:** semántica visual de estado (`default`, `to_visit`, `visited`, `selected`) y legibilidad.

## Diagnóstico

### Lo que ya funciona
- Jerarquía de tamaño (`selected` grande) bien orientada.
- Semántica de estado `to_visit/visited` clara en color.
- Animaciones de selección/hover/press ya definidas.

### Brechas para wow
1. **Estado + selección aún se percibe como capas separadas**, no como lenguaje único.
2. **Dependencia parcial de labels externos del mapa** en casos límite.
3. **Pocos patrones de densidad** (centro urbano denso vs periferia).

## Oportunidades de alto impacto

### P0 — Gramática visual única de pin
- Contrato explícito de prioridad visual:
  - 1) `selected`
  - 2) `visited/to_visit`
  - 3) `default`
- La selección siempre domina forma/escala/contraste; estado domina color semántico.

### P1 — Modo densidad
- Ajustar tamaño/label según densidad de viewport:
  - denso: menos labels persistentes;
  - disperso: más labels visibles.
- Resultado wow: mapa limpio sin perder claridad.

### P2 — Micro-movimiento semántico
- No solo scale: transiciones con “settle motion” para selección real.
- Resultado wow: feedback premium, sin recargar CPU.

## Propuesta disruptiva (controlada)
- **Label inteligente por prioridad**: mostrar etiqueta solo para selección activa + candidatos top del viewport.
- Reduce ruido y convierte la selección en evento protagonista.

## Riesgos
- Si se exagera supresión de labels, baja descubrimiento pasivo.
- Debe calibrarse con filtros y sheet.

## Criterio de éxito
- Usuario distingue estado/selección sin leer texto extra.
- Menos taps repetidos para confirmar “qué seleccioné”.
