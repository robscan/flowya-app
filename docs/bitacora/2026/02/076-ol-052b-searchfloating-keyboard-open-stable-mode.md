# OL-052b — SearchFloating keyboard-open stable mode (teclado + gestos)

## Contexto

Tras OL-052 (insets web con `visualViewport`), en mobile (especialmente iOS Safari) el buscador seguía rompiéndose al abrir el teclado: el sheet quedaba en un estado intermedio, y el gesto de drag competía con el scroll de resultados cuando el viewport efectivo cambiaba.

## Decisión (modo “focused” con teclado)

Cuando el teclado está abierto (o el input está enfocado), SearchFloating entra en un modo estable:

- **Sheet forzado a expanded** (posición superior).
- **Drag/pan deshabilitado** para evitar conflicto con scroll.
- Al cerrar teclado, no se fuerza colapso: se prioriza estabilidad.

Esto evita que el comportamiento de snap/drag dependa de alturas “históricas” durante input y elimina la competencia de gestos en el estado crítico.

## Implementación

Archivos tocados:

- `components/search/SearchFloating.tsx`
- `components/search/SearchInputV2.tsx`

### Señal `keyboardOpen`

- Web: `keyboardHeightWeb > 0` (ya existente vía `window.visualViewport` con `max(0, innerHeight - vv.height - vv.offsetTop)`).
- Native (iOS/Android): `isInputFocused` por `onFocus/onBlur`.
- Fórmula final:
  - `keyboardOpen = (Platform.OS === 'web' && keyboardHeightWeb > 0) || (Platform.OS !== 'web' && isInputFocused)`

`SearchInputV2` ahora acepta `onFocus` / `onBlur` opcionales (passthrough al input), y `SearchFloating` actualiza `isInputFocused`.

### Gestos / estabilidad

- Pan deshabilitado con teclado abierto: `panGesture.enabled(!keyboardOpen)`
- Al abrir teclado: `translateY` se anima a 0 (expanded) con `withTiming` (≈180ms).
- No se modifican snap points ni availableHeight; se mantiene el enfoque de **insets/padding** (web) + `KeyboardAvoidingView` (iOS), pero se evita el estado intermedio con teclado abierto.

## Verificación manual

- iOS Safari (dispositivo real):
  - Abrir Search → enfocar input (teclado abre) → sheet estable en full → input visible → scroll resultados → tap resultado → cerrar.
  - Con teclado cerrado: drag desde handle cierra (sin regresión).

- Web mobile (o DevTools device):
  - Misma secuencia; sin solapamientos y con scroll correcto.

## Resultado

Se resuelve el conflicto definitivo “teclado + drag vs scroll” en SearchFloating mediante un modo estable cuando el teclado está abierto.

## Referencias

- PR #29 (merged) — merge commit `e1cb968` (commit `82d8cc5`)
- Complementa OL-052 (bitácora 075).
