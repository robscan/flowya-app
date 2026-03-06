# PLAN — Explore: slogan de entrada con fade

**Fecha:** 2026-03-06  
**Tipo:** Fix UX/branding transversal (sin abrir loop nuevo)

## Objetivo
Mostrar el slogan de Flowya al entrar a Explore para reforzar identidad de marca sin bloquear interacción.

## Alcance
- Pantalla Explore (`MapScreenVNext`).
- Overlay visual superior no interactivo.

## Decisiones
1. Slogan mostrado solo al entrar a pantalla.
2. Animación simple: fade in -> hold -> fade out lento.
3. Overlay no bloqueante (`pointerEvents="none"`).
4. Posicionamiento debajo del filtro superior, en el hueco disponible.
5. Texto en mayúsculas con tamaño/estilo visual alineado a la marca `FLOWYA`.

## Diseño técnico
- Añadir estado de visibilidad del slogan y `Animated.Value` de opacidad.
- Ejecutar secuencia de animación en `useEffect` de montaje.
- Render condicional con `Animated.View` y `Text`.
- Ajustar `top` en función de `filterTop` para evitar traslapes con controles.

## Criterios de aceptación
1. El slogan aparece al entrar a Explore y desaparece automáticamente.
2. No tapa ni bloquea taps de controles superiores.
3. No hay solapamiento visual con el filtro.
4. Lint de `MapScreenVNext.tsx` en verde.

## Rollback
Revertir cambios en `components/explorar/MapScreenVNext.tsx` y eliminar el bloque de animación/render del slogan.
