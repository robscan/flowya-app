# 157 — Search filtros (`Por visitar`/`Visitados`) sin títulos de resultados

Fecha: 2026-02-25

## Contexto

Tras intentos de subdivisión, se decidió simplificar UX:

- En filtros `Por visitar` y `Visitados`, ocultar títulos de resultados.
- Mantener orden por distancia como guía principal de lectura.

## Implementación

Archivos:

- `components/search/SearchOverlayWeb.tsx`
- `components/search/SearchFloatingNative.tsx`

Cambio:

1. Si el filtro activo es `saved` o `visited`, no se muestra `stageLabel`.
2. Si existen secciones de resultados, tampoco se renderizan headers de sección en esos filtros.
3. No se modifica ranking ni orden actual.

## Validación mínima

- `npm run lint` OK.

