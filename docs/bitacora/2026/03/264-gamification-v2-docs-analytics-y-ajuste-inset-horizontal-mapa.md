# 264 - GAMIFICATION V2 documentada + ajuste de inset horizontal en mapa

Fecha: 2026-03-01  
Tipo: Producto + UX + Layout  
Área: Contratos de gamificación + MapScreen overlays

## Resumen

Se confirma decisión de producto:

- Mantener **V1 activa** (puntos simples por países + spots).
- Documentar **V2 completa** (sin implementación aún), incluyendo:
  - modelo de distancia por tramos,
  - base de datos ideal de telemetría,
  - eventos principales de comportamiento.

Además se corrige desbalance horizontal de overlays en mapa:

- Inset horizontal izquierdo reducido para alinear visualmente `FLOWYA` y botón de perfil con la columna derecha.

## Implementación técnica

### 1) Contrato actualizado

- Archivo: `docs/contracts/GAMIFICATION_TRAVELER_LEVELS.md`
- Cambios:
  - Estado actualizado a `V1 activa + V2 documentada`.
  - Sección `V1 vs V2`.
  - Sección `V2 propuesta` con:
    - distancia por tramos,
    - tablas `analytics_sessions` y `analytics_events`,
    - eventos MVP de instrumentación.

### 2) Inset horizontal mapa

- Archivo: `components/explorar/MapScreenVNext.tsx`
- Cambio:
  - Separación de insets por eje:
    - `TOP_OVERLAY_INSET_X = 16`
    - `TOP_OVERLAY_INSET_Y = 28`
  - Aplicado en perfil, etiqueta FLOWYA y ancla de toasts.
  - Objetivo: reducir margen lateral percibido y mejorar simetría con lado derecho.

## Estado

- Completado.
- Pendiente: validación visual en QA para confirmar percepción de simetría.
