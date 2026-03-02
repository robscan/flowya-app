# 269 — Fix arquitectura teclado: owner único en Paso 0 Create Spot (sin colisión con quick edit)

Fecha: 2026-03-01  
Tipo: Runtime architecture + keyboard/focus hardening  
Área: `MapScreenVNext` (CreateSpotNameOverlay + quick edit descripción)

## Problema

Al abrir Paso 0 (`CreateSpotNameOverlay`) desde long-press o buscador, el teclado se cerraba al intentar escribir el nombre.

## Causa raíz

El efecto de ownership de teclado ejecutaba `blurActiveElement()` mientras el overlay permanecía abierto, no solo en la transición de apertura. Con cada re-render del input (escritura), podía re-disparar blur y tumbar teclado.

## Decisión arquitectónica

Aplicar ownership por transición de estado:

- `blurActiveElement()` solo en el evento `closed -> open` del Paso 0.
- No ejecutar blur continuo mientras el owner ya es Paso 0.
- Bloquear apertura de quick edit descripción cuando Paso 0 está activo.

Esto alinea el runtime con `docs/contracts/KEYBOARD_AND_TEXT_INPUTS.md`:
- owner único,
- no dos superficies de input compitiendo foco,
- transferencia explícita de foco una sola vez.

## Implementación

Archivo: `components/explorar/MapScreenVNext.tsx`

1. Se agrega `wasCreateSpotOverlayOpenRef` para detectar transición de apertura.
2. Efecto owner teclado:
- antes: corría en estado `open` y podía blurrear repetidamente.
- ahora: solo actúa en transición `open` inicial.
3. `handleQuickEditDescriptionOpen` aborta si `createSpotNameOverlayOpen === true`.

## Resultado esperado

- Paso 0 mantiene teclado abierto y estable mientras se escribe.
- No hay colisión de foco con quick edit de descripción.
- Se conserva cierre de Search/quick edit al abrir Paso 0, pero sin regressions de escritura.

## Sanidad

- `npm run lint -- --no-cache` OK.
