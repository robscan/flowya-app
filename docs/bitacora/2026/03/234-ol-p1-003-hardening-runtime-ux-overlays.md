# Bitácora 234 (2026/03) — OL-P1-003 hardening runtime/UX de overlays

**Fecha:** 2026-03-01
**Loop:** `OL-P1-003` — System Status Bar (hardening post-cierre)

## Objetivo

Corregir regresiones de runtime detectadas en `MapScreenVNext` tras los ajustes de UX y estabilizar la experiencia visual de overlays de estado/contador en mapa.

## Cambios aplicados

- **Fix runtime TDZ (`searchV2`)**
  - Se movió el cálculo de `showCountriesCounter` y su `useEffect` a una zona posterior a la inicialización de `searchV2`.
  - Resultado: eliminado error `ReferenceError: Cannot access 'searchV2' before initialization`.

- **Fix React warning por `setState` durante render indirecto**
  - Se corrigió flujo de `handleProfilePress` para no disparar `toast.show` dentro de un updater funcional de `setState`.
  - Resultado: eliminado warning `Cannot update a component (...) while rendering a different component`.

- **Hardening UI contador de países (overlay izquierda)**
  - Animación de entrada ajustada a desplazamiento horizontal (`translateX`), en lugar de vertical.
  - Se implementó ciclo completo de animación:
    - entrada al mostrar,
    - salida al ocultar,
    - salida + entrada al cambiar entre filtros `saved` y `visited`.
  - Se evita desmontaje inmediato para permitir animación de salida limpia.
  - Se agregó retardo de entrada (`COUNTRIES_OVERLAY_ENTRY_DELAY_MS = 320`) para priorizar lectura del texto de intención antes de mostrar el contador.
  - Se añadió limpieza de `timeout` en `cleanup` para evitar animaciones colgadas.

- **Ajustes de copy de estado en filtros (mapa)**
  - Se consolidaron textos más accionables y conversacionales para `all/saved/visited`.
  - Se retiraron frases largas/redundantes que no aportaban intención.

## Validación

- `npm run lint` OK.
- Smoke manual esperado:
  - sin crash al abrir `MapScreenVNext`,
  - sin warning de React por update cruzado durante render,
  - contador de países con transición suave en show/hide y al alternar filtros,
  - delay perceptible para leer primero subtítulo de estado.

## Estado

- Hardening post-cierre de `OL-P1-003` completado a nivel runtime + UX overlays.
- No se abre loop nuevo; backlog queda listo para definición del próximo `P0`.
