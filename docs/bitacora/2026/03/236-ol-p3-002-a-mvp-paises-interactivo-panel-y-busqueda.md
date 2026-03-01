# Bitácora 236 (2026/03) — OL-P3-002.A MVP países interactivo

**Fecha:** 2026-03-01
**Loop:** `OL-P3-002` — Países interactivo + mapa mundial shareable
**Fase:** `P3-002.A` (MVP)

## Objetivo

Habilitar interacción inicial desde el contador de países en Explore, sin introducir todavía el mapa mundial shareable.

## Implementación

- `components/explorar/MapScreenVNext.tsx`
  - El contador de países ahora es presionable.
  - Se agregó panel contextual con lista de países y conteo por país.
  - Cada fila tiene target táctil amplio (`minHeight: 44`) para reducir errores en móvil.
  - Al seleccionar un país:
    - se cierra el panel,
    - se abre búsqueda,
    - se precarga query con nombre de país.
  - Se conserva la animación de entrada/salida del contador y su retardo de lectura.
  - Se agrega backdrop para cerrar panel por tap fuera.

- Consistencia de datos
  - El listado por país usa extracción desde `address` (último segmento), agrupación y orden por frecuencia.
  - Mantiene enfoque MVP sin alterar contratos de Activity Summary.

## Checklist QA (manual)

1. En filtro `Por visitar`, tap en contador de países abre panel con países y conteos.
2. En filtro `Visitados`, tap en contador abre panel equivalente para ese estado.
3. Tap en país del panel abre buscador con query del país.
4. Tap fuera del panel lo cierra sin mover cámara.
5. Si no hay países detectados, muestra mensaje y no abre panel.
6. En `Todos`, o con search abierto, o con sheet no `peek`, el contador/panel no debe quedar visible.
7. En móvil, la selección de filas del panel no debe requerir precisión fina.

## Validación técnica

- `npm run lint` OK.

## Estado

- `P3-002.A` queda en implementación base funcional.
- Siguiente micro-scope sugerido: permitir drill-down por país hacia spots del país sin depender de query textual.
