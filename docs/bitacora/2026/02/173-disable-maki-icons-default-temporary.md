# 173 — Desactivar íconos maki por defecto (temporal)

Fecha: 2026-02-25

## Contexto

Decisión de sesión: dejar mapa sin iconografía maki por ahora para evitar fricción visual/sprite mientras se define pipeline de estilos.

## Implementación

Archivo:

- `lib/feature-flags.ts`

Cambio:

- `flowyaPinMakiIcon` cambia default de `true` a `false`.
- Sigue disponible override por env (`EXPO_PUBLIC_FF_FLOWYA_PIN_MAKI_ICON=true`) para pruebas controladas.

## Resultado esperado

- En ejecución normal, mapa muestra pines por color/estado sin icono maki.
- Se elimina dependencia operativa de sprite en el flujo principal.

## Validación mínima

- `npm run lint` OK.

