# Bitácora 072 (2026/02) — OL-050d: SpotSheet medium sin shrink al montar

**Rama:** `chore/explore-quality-2026-02-09`  
**Objetivo:** Al abrir SpotSheet en medium, que entre desde abajo con el tamaño correcto, sin re-layout visible (sin “encogerse”).

## Síntoma

- SpotSheet tiene drag + snap (collapsed/medium/expanded).
- collapsedAnchor es content-aware (onLayout del dragArea).
- Al abrir un spot, el sheet aparecía en medium “demasiado alto” y luego se encogía cuando llegaba la medición del body.

## Causa

- dragAreaHeight y mediumBodyContentHeight empiezan en 0 → anchors usan fallbacks (p. ej. mediumVisible = mediumAnchor).
- translateY se fijaba a translateYToAnchor(state) en el primer render.
- Luego onLayout entregaba medidas reales → collapsedAnchor y mediumVisible cambiaban → el efecto de sincronización reanimaba translateY → se veía el “shrink”.

## Decisión (Opción A)

- **Freeze anchors until measured:** no mostrar el sheet hasta tener anchors estables.
- `isMeasured` = dragAreaHeight > 0 y, si state es medium/expanded, que el body correspondiente ya tenga altura medida (mediumBodyContentHeight > 0 o fullBodyContentHeight > 0).
- Mientras !isMeasured: sheet renderizado con opacity 0 (para que haga layout y dispare onLayout).
- translateY inicial = vh (offscreen); opacity inicial = 0.
- Cuando isMeasured pasa a true (primera vez): animar translateY al anchor del estado y opacity a 1 (DURATION_PROGRAMMATIC, EASING_SHEET). Marcar hasAnimatedEntranceRef = true.
- El efecto que sincroniza state → translateY solo corre cuando isMeasured && hasAnimatedEntranceRef, para no pisar la entrada.
- Al cambiar de spot (spot.id): resetear hasAnimatedEntranceRef, translateY = vh, opacity = 0, para que el nuevo sheet vuelva a entrar desde abajo.

## Archivos tocados

- `components/explorar/SpotSheet.tsx`: isMeasured, opacityShared, entrada única desde abajo, reset por cambio de spot.

## Commits

- `fix(sheet): prevent medium open shrink by freezing anchors until measured`
- `chore(ops): close OL-050d + bitacora 072`

## QA (web)

- Seleccionar spot → SpotSheet aparece una sola vez, desde abajo, sin encogerse.
- Abrir/cerrar spot 10 veces → sin glitch en la primera apertura.
- Drag: snap a collapsed/medium/expanded correcto.
- Collapsed sigue content-aware (header completo visible).
