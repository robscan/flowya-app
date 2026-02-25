# Search + Mapbox — Matriz de simplificación (QA-first)

Fecha: 2026-02-25
Estado: baseline inicial para `OL-P1-012`

## Objetivo

Reducir sobre-regulación en Search V2 + mapa, manteniendo solo reglas que protegen calidad, UX y no-regresión.

## Matriz (mantener / simplificar / eliminar)

| Área | Regla actual | Decisión | Motivo |
|------|--------------|----------|--------|
| Search externo | `/forward` + fallback Geocoding + cooldown 429 | Mantener | Protección de disponibilidad y resiliencia real. |
| Ranking intents | `landmark > geo > recommendation` | Mantener | Corrige queries turísticas críticas. |
| Dedupe externo | por `linked_place_id` + proximidad+nombre | Mantener (con tuning) | Evita duplicados sin bloquear hallazgo útil. |
| Anti-duplicado en create-from-POI | bloqueo con modal | Eliminar | Entra en conflicto con flujo de planificación. |
| Anti-duplicado en create manual/draft | bloqueo con modal | Mantener | Sí protege creación libre de ruido. |
| Hide `linked+unsaved` | activo aunque landmarks no estén visibles | Simplificar (guardrail por landmarks ON) | No ocultar sin señal base visible. |
| Map controls con POI seleccionado | mostraba "Ver todo el mundo" | Simplificar | Selección activa debe priorizar encuadre contextual. |
| Filtros con count=0 | seleccionables y con números | Simplificar | Reduce interacciones muertas/confusas. |
| Reencuadre al cambiar filtro | no contextual por viewport | Simplificar | Evita saltos innecesarios y mejora predictibilidad. |
| Runtime hack de layers | remoción incondicional de tileset landmark | Simplificar | Solo aplicar cuando landmarks están OFF. |
| Search results theming | cards de resultados con look oscuro hardcoded | Simplificar (migrar a tokens DS por tema) | En modo Light no respeta contraste/legibilidad esperada. |

## Reglas candidatas a eliminar en siguiente iteración

1. Branching duplicado de comportamiento entre selección `poiTapped` y `selectedSpot` cuando el resultado de UX esperado es equivalente.
2. Condiciones visuales redundantes para controlar overlay global cuando ya existe selección activa.
3. Paths alternos de creación desde POI que repiten lógica de persistencia/linking en handlers separados.

## Guardrails de ejecución

1. No eliminar una regla sin smoke A/B contra casos QA críticos.
2. Mantener flags para rollback inmediato en mapa y search.
3. Cada simplificación debe quedar documentada con impacto esperado y riesgo.

## Casos QA mínimos para validar simplificación

1. Query landmark turístico (`Torre Eiffel`) prioriza resultado correcto.
2. Selección POI no existente en Flowya abre sheet y encuadre sin "Ver todo el mundo".
3. Create-from-POI no bloquea por duplicado; draft/manual sí bloquea.
4. Filtros `saved/visited`:
   - sin resultados: deshabilitados;
   - con resultados fuera de viewport: reencuadre;
   - con resultados visibles: sin salto de cámara.
5. Theming Search results:
   - en `light` no usar superficie oscura hardcoded;
   - en `dark` mantener contraste AA y jerarquía visual.
