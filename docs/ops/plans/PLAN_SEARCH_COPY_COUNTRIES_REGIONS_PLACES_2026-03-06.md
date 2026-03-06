# Plan: Copy del buscador orientado a países, regiones y lugares

Fecha: 2026-03-06  
Estado: Implementado  
Prioridad: Media (claridad de expectativas)

## Objetivo

Alinear el texto visible del buscador con la capacidad real del sistema para evitar sesgo a "spots" únicamente y comunicar mejor el alcance de búsqueda.

## Alcance

### In scope

1. Actualizar placeholder del input de búsqueda a:
- `Busca: países, regiones o lugares`.

2. Ajustar labels de entrada relacionados al buscador para coherencia:
- pill de búsqueda (`Buscar lugares`),
- accessibility label del botón de apertura.

3. Mantener lógica de búsqueda intacta:
- sin cambios en controller, ranking o providers.

### Out of scope

1. Cambios de estrategia de búsqueda por filtros (`saved/visited/all`).
2. Ajustes de threshold de caracteres o de fuentes externas.
3. Cambios de contratos de datos.

## Validación funcional

- En filtro `all`, el buscador ya integra resultados externos que contemplan `country/region/place` (y direcciones según intención), por lo que el nuevo copy no sobrepromete capacidad fuera de runtime actual.
- El cambio es de copy/entrada; no se alteran resultados ni ranking.

## Criterios de aceptación

1. El input muestra `Busca: países, regiones o lugares`.
2. El entry-point visual deja de decir `Buscar spots` por defecto.
3. No hay regresiones de lint en archivos tocados.

## Rollback

Revertir este ajuste restaura copy anterior (`Buscar spots`) sin impacto funcional en búsqueda.
