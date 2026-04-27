# 381 — QA search intent recovery canon

Fecha: 2026-04-26

## Reporte

Durante QA de “Gran Parque La Pancha”, el usuario confirmó que re-guardar desde Edit Spot corrige el encuadre/cámara. Queda un bug separado en buscador que se eleva a canon general: FLOWYA debe ayudar al usuario a encontrar lo que intenta buscar aunque escriba solo parte del nombre, use otro casing, omita acentos o cometa errores leves.

- Query `Gran parque` devuelve el spot esperado “Gran Parque La Pancha”.
- Query `Plancha`/`plancha` no devuelve el spot esperado.
- Captura observada con typo `placha`: el buscador devuelve resultados externos irrelevantes (`Plaza`, `Plats`, etc.) y no rescata el candidato local.

## Clasificación

- Severidad: P1 V1, no P0 de cámara.
- Área: Search intent recovery / local relevance / token matching / fuzzy typo.
- Loop: agregar a `OL-V1-STABILITY-MAP-SHEETS-MEDIA-001` como micro-scope V1, y dejar `OL-SEARCHV2-002` como investigación mayor posterior.
- Plan formal de alcance: [`PLAN_SEARCH_INTENT_RECOVERY_V1_2026-04-26.md`](../../ops/plans/PLAN_SEARCH_INTENT_RECOVERY_V1_2026-04-26.md).

## Hipótesis

- El matching local podría depender de frase/prefijo y no ponderar tokens internos del título.
- El ranking puede estar dejando que resultados Mapbox externos llenen slots antes de candidatos locales parciales.
- Falta tolerancia mínima de typo para spots propios o alias/tokens derivados.

## Canon V1 propuesto

- Normalizar acentos, espacios y mayúsculas/minúsculas.
- Considerar tokens internos del título y no solo prefijo o frase completa.
- Permitir fuzzy leve para términos suficientemente largos, con umbral conservador.
- Priorizar spots propios/locales plausibles sobre resultados Mapbox externos cuando el score local supere umbral.
- Mantener resultados externos útiles cuando no haya candidato local plausible.

## DoD sugerido

- Casos semilla: “Gran Parque La Pancha” aparece al buscar `Plancha`, `plancha` y, si producto aprueba fuzzy, `placha`.
- Casos generales: un spot propio puede recuperarse por token interno relevante, sin acentos/case exactos y con error leve cuando el término es suficientemente largo.
- Los spots propios relevantes tienen prioridad sobre resultados externos cuando el match local es plausible.
- No reabrir SearchV2 completo ni alterar filtros/toolbar macro en este micro-scope.
