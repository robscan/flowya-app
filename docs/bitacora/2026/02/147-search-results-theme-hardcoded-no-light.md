# 147 — Hallazgo QA Search V2: resultados hardcoded no adaptan a Light

Fecha: 2026-02-25

## Hallazgo

En la zona de resultados de búsqueda (web), las cards se renderizan con estética oscura fija y no responden correctamente al modo `light`.

## Impacto

- Contraste y consistencia visual degradados en tema claro.
- Incumplimiento de expectativa de theming por `useColorScheme` y tokens DS.

## Acción acordada

Incorporar este punto en `OL-P1-012` (simplificación Search+Map) como tarea prioritaria de UI-contract:

1. eliminar hardcode de superficie/texto oscuro en cards de resultados;
2. migrar a tokens canónicos de DS por tema (`light/dark`);
3. validar contraste mínimo y legibilidad en ambos temas.

## Estado

- Documentado y priorizado para ejecución en bloque Search V2.
