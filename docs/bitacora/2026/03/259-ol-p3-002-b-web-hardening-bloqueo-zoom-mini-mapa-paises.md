# 259 — OL-P3-002.B: hardening web para bloqueo de zoom en mini-mapa de países

Fecha: 2026-03-01
Tipo: UX stability (web guardrail)

## Objetivo

Evitar pérdida de contexto en navegador cuando usuario interactúa con el mini-mapa de países dentro de `CountriesSheet`.

## Problema

En web podían dispararse gestos de zoom/navegador al interactuar sobre el mini-mapa (wheel/pinch), provocando que el usuario perdiera el encuadre de UI.

## Fix

Archivo: `components/explorar/CountriesMapPreview.web.tsx`

- Se agrega `hostRef` para capturar eventos de interacción del contenedor web.
- Se registran listeners con `preventDefault`:
  - `wheel` (con `passive: false`)
  - `gesturestart`
  - `gesturechange`
  - `gestureend` (Safari)
- Se limpia listener en `cleanup` de `useEffect`.
- Se elimina `onWheel` inline previo y se centraliza guardrail en listeners explícitos.

## Resultado esperado

- Interacción/tap en mini-mapa mantiene el contexto UI de la app.
- No se activa zoom de navegador desde el área del mini-mapa.
- Se conserva interacción por tap para `onCountryPress`.

## Sanidad

- `npm run lint -- --no-cache` OK.
