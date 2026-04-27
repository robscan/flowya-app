# 382 — Search Intent Recovery V1 plan

Fecha: 2026-04-26

## Contexto

Tras documentar el bug “Plancha”, se elevó el criterio: no basta resolver un caso puntual. FLOWYA necesita un canon de búsqueda que ayude al usuario a encontrar lo que intenta buscar aunque escriba solo parte del nombre, omita acentos, cambie mayúsculas/minúsculas o cometa errores leves.

## Decisión

Se crea plan formal de alcance:

- [`PLAN_SEARCH_INTENT_RECOVERY_V1_2026-04-26.md`](../../ops/plans/PLAN_SEARCH_INTENT_RECOVERY_V1_2026-04-26.md)

El plan queda referenciado desde `OPEN_LOOPS.md` dentro de `OL-V1-STABILITY-MAP-SHEETS-MEDIA-001`, no dentro de `OL-SEARCHV2-002`, para mantenerlo como cierre V1 acotado y no como rediseño mayor.

## Canon

- Normalización de acentos, espacios y case.
- Tokens internos del título.
- Partial match razonable.
- Fuzzy leve con umbral conservador.
- Aliases/canonical name como posible evolución.
- Prioridad de spots propios/locales plausibles sobre ruido externo.
- Mapbox sigue siendo complemento cuando no hay candidato local plausible.

## No objetivos

- No abrir SearchV2 completo.
- No migrar DB sin introspección.
- No guardar query cruda sin decisión de privacidad.
- No cambiar layout macro de SearchSurface.

## Próximo uso

Cuando se retome el bloque de estabilidad V1 después de cámara/media, usar este plan para implementar helper puro + tests antes de tocar UI.
