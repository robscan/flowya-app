# 240 — Hardening teclado/foco: owner único + quick edit de descripción en Search

Fecha: 2026-03-01  
Scope: Explore / Search / Create Spot Paso 0 / UX keyboard-safe

## Contexto

Durante pruebas locales se detectó riesgo de empalme de teclado por coexistencia de flujos con `autoFocus`:

- Paso 0 de Create Spot (`CreateSpotNameOverlay`).
- Search overlay (`SearchSurface`).
- Modal de edición rápida de descripción corta en Search (`quickDesc`).

Además, en web mobile el modal de edición rápida podía quedar demasiado centrado y competir con el teclado en pantallas bajas.

## Objetivo

1. Reforzar contrato de **un solo input owner** activo a la vez en Explore.
2. Evitar estados donde dos superficies intenten poseer foco/teclado simultáneamente.
3. Ajustar UX del modal quick edit para reducir riesgo de empalme con teclado.
4. Personalizar placeholder de quick edit para que use el nombre del spot.

## Decisiones

1. Tratar Paso 0 como superficie dominante de foco:
   - si Paso 0 abre, Search y quick edit se cierran.
2. Bloquear aperturas de Search desde acciones de países cuando Paso 0 está activo.
3. Forzar `blurActiveElement()` al abrir/cerrar superficies que cambian owner de teclado.
4. Reubicar quick edit en zona superior (safe area) y usar placeholder contextual.

## Implementación

### 1) Mutex de foco entre Paso 0 y Search/QuickEdit

Archivo: `components/explorar/MapScreenVNext.tsx`

- Se agregó un `useEffect` de hardening:
  - si `createSpotNameOverlayOpen === true`:
    - `searchV2.setOpen(false)` si Search estaba abierto;
    - cierre de quick edit (`setQuickDescSpot(null)`, `setQuickDescValue("")`);
    - `blurActiveElement()` para liberar foco residual.

Resultado: Paso 0 queda como único owner de teclado cuando está visible.

### 2) Guardrails en entry points de Search desde countries

Archivo: `components/explorar/MapScreenVNext.tsx`

- `openSearchPreservingCountriesSheet`:
  - early return cuando Paso 0 está abierto.
  - `blurActiveElement()` antes de `searchV2.setOpen(true)`.
- `handleCountriesSpotsKpiPress`:
  - early return cuando Paso 0 está abierto.
  - `blurActiveElement()` antes de abrir Search.

Resultado: no se puede abrir Search por rutas secundarias mientras Paso 0 está activo.

### 3) Cierre de Paso 0 con liberación explícita de foco

Archivo: `components/explorar/MapScreenVNext.tsx`

- `handleCloseCreateSpotNameOverlay` ahora ejecuta `blurActiveElement()` antes de limpiar estado.

Resultado: evita teclado fantasma o foco retenido al cerrar overlay.

### 4) Quick edit de descripción: posición y placeholder

Archivo: `components/explorar/MapScreenVNext.tsx`

- Modal quick edit reubicado:
  - `quickEditDescOverlay` pasó de centrado vertical a `justifyContent: "flex-start"`.
  - padding superior dinámico con safe area (`paddingTop: Math.max(insets.top, 16) + 8`).
- Placeholder actualizado:
  - de `"Agrega una descripción breve para este spot"`
  - a `"Agrega una descripción breve para ${quickDescSpot.title}"`.

Resultado: mejor legibilidad, menor riesgo de choque visual con teclado y copy contextual.

## Contratos impactados

- `KEYBOARD_AND_TEXT_INPUTS`: se refuerza regla de owner único de teclado en superficies superpuestas.
- `CREATE_SPOT_PASO_0`: se explicita exclusión activa contra Search/quick edit.
- `SEARCH_V2`: se documenta quick edit en resultados de visitados y su regla keyboard-safe.

## Validación ejecutada

- `npx eslint components/explorar/MapScreenVNext.tsx` ✅

## QA manual recomendado

1. Abrir Search, luego disparar Paso 0 (long-press/create): Search debe cerrarse y solo quedar teclado del input de nombre.
2. Con Paso 0 abierto, intentar abrir Search desde acciones de países: no debe abrir.
3. Abrir quick edit descripción en Search (visitados): modal debe aparecer arriba, no centrado.
4. Placeholder quick edit debe incluir nombre del spot actual.
5. Cerrar quick edit / cerrar Paso 0: sin teclado residual ni foco atrapado.

## Estado

- Hardening aplicado y documentado.
- No se abre loop nuevo; se clasifica como consolidación de estabilidad UX/teclado dentro del alcance Explore activo.
