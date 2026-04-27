# PLAN — Search Intent Recovery V1

Fecha: 2026-04-26

Estado: Fases 0-2 implementadas en helper/runtime; pendiente QA manual V1 y decisión DB Fase 4.

## 1. Objetivo

Crear un canon V1 para que el buscador de FLOWYA ayude al usuario a encontrar lo que intenta buscar, incluso cuando escribe solo una parte del nombre, cambia mayúsculas/minúsculas, omite acentos o comete errores leves.

Este plan nace del caso semilla “Gran Parque La Pancha/Plancha”, pero no debe resolverse como parche puntual. La solución correcta es un pipeline de recuperación de intención para spots propios/locales y resultados externos.

## 2. Problema

El buscador actual mezcla resultados locales y Mapbox. La estrategia local usa normalización básica y `includes`, pero no existe un canon explícito de ranking por intención. Esto permite que:

- un spot propio no aparezca si el usuario escribe un token interno relevante;
- un error leve de escritura muestre resultados externos irrelevantes;
- Mapbox llene los primeros slots aunque exista un candidato local plausible;
- la calidad del dato visible (`title`) determine demasiado la capacidad de encontrar un lugar;
- bugs se atiendan como casos aislados en lugar de reforzar el sistema.

## 3. Canon V1

La búsqueda debe seguir estas reglas:

1. Normalizar acentos, espacios, mayúsculas/minúsculas y puntuación simple.
2. Buscar por tokens internos del título, no solo por prefijo o frase completa.
3. Soportar coincidencia parcial razonable para términos suficientemente largos.
4. Soportar fuzzy leve con umbral conservador.
5. Priorizar spots propios/locales plausibles sobre resultados externos cuando el score local supere umbral.
6. Mantener resultados externos útiles cuando no haya candidato local plausible.
7. Separar semánticamente “Tus lugares” / “Lugares en el mapa” cuando ayude a explicar el ranking.
8. No guardar query cruda como telemetría de producto sin decisión explícita de privacidad.

## 4. Alcance V1

### Incluye

- Motor puro de scoring local, testeable sin UI.
- Normalizador compartido para búsqueda de spots.
- Ranking local por:
  - exact match;
  - token exacto;
  - token parcial;
  - typo leve;
  - alias/canonical name si existe;
  - cercanía/contexto cuando aplique;
  - pin status/filtro activo sin romper intención.
- Reordenamiento de merge local + Mapbox para que un candidato local plausible no sea desplazado por ruido externo.
- Búsqueda local global por intención: con `query >= threshold`, el bbox/viewport no puede eliminar spots propios antes del scoring. El contexto de cámara solo puede ordenar desempates o alimentar resultados externos.
- Tests con fixtures representativos.
- Documentación en contratos/ops si se formaliza API del helper.

### No incluye

- Rediseño completo de SearchV2.
- Migración DB obligatoria para V1.
- `pg_trgm`/Postgres search en esta fase.
- Guardar historial de queries crudas o analítica invasiva.
- Cambios visuales grandes de filtros, toolbar o sheets.
- Reescritura de Mapbox provider.

## 5. Arquitectura propuesta

### Capa 1 — Normalización

Crear o consolidar helper en `lib/search/intent-normalize.ts`:

- `normalizeSearchText(value)`;
- `tokenizeSearchText(value)`;
- `normalizeSearchToken(value)`.

Debe reutilizar o sustituir con cuidado `normalizeQuery`, `normalizeSpotTitle` y `normalizeText` para evitar tres normalizadores con reglas divergentes.

### Capa 2 — Índice local runtime

Crear `buildSpotSearchDocument(spot)` con campos derivados:

- `title`;
- `description_short`;
- `address`;
- `tags`;
- `country/city/region` cuando exista;
- `linked_place_id`;
- `linked_maki`;
- `mapbox_feature_type`;
- futuro: `search_aliases` / canonical name.

V1 puede hacerlo en memoria; DB queda para fase posterior.

### Capa 3 — Scoring

Crear `scoreSpotForQuery(spotDocument, query)`:

Rangos sugeridos:

- 100: título exacto normalizado.
- 90: token exacto relevante.
- 80: alias/canonical exacto.
- 70: token prefix fuerte.
- 60: typo leve en token largo.
- 40: match en dirección/ciudad/tag.
- 0: no plausible.

La salida debe incluir `score`, `reasons` y `matchedField` para debug/QA.

### Capa 4 — Merge local + externo

Actualizar `mergeSearchResults()` o crear wrapper:

- ordenar spots propios por score local;
- deduplicar externos contra spots por `linked_place_id`, distancia y nombre;
- si hay candidato local con score alto, colocarlo antes de Mapbox externo;
- si score local es bajo, permitir que Mapbox gane;
- no ocultar resultados externos cuando no hay candidato local plausible.

### Capa 5 — UX

V1 puede mantener UI actual, pero debe permitir claridad:

- si existen locales y externos, conservar secciones o ranking que no parezca arbitrario;
- evitar que “3 resultados” sean todos externos irrelevantes cuando hay local plausible;
- si no hay resultados locales, mostrar externos normalmente.

## 6. Caso semilla

Spot: “Gran Parque La Pancha” / intención del usuario “Gran Parque La Plancha”.

Debe encontrarse por:

- `Gran parque`;
- `Plancha`;
- `plancha`;
- `placha` si se aprueba fuzzy leve;
- idealmente `pancha` mientras el dato visible siga así.

Nota: si el título visible está mal escrito, V1 debe encontrarlo por fuzzy/alias; V1.1 debe definir si se corrige el título, se agrega alias o se conserva título usuario + canonical name externo.

## 7. Datos y DB

### V1 sin migración

- Índice runtime en memoria con datos ya disponibles.
- Tests unitarios.
- Sin cambios RLS.

### V1.1 opcional

Agregar tabla/columna si introspección lo aprueba:

- `spot_search_aliases(spot_id, alias, source, created_at)`, o
- `spots.search_aliases text[]`, o
- `spots.search_document jsonb`.

Preferencia arquitectónica: tabla relacionada si los aliases tienen fuente, auditoría o múltiples orígenes; campo directo solo si será pequeño y simple.

### V2 posterior

- `pg_trgm` para fuzzy server-side si volumen crece.
- RPC de búsqueda con ranking y RLS explícita.
- Materialized/search document si el dataset lo requiere.

## 8. Privacidad y observabilidad

Para V1, si se mide calidad:

- registrar solo señales agregadas:
  - `query_length`;
  - `local_match_found`;
  - `external_called`;
  - `zero_results`;
  - `selected_result_source`;
- no guardar query cruda sin decisión legal/producto;
- no enviar queries a proveedores extra fuera de Mapbox ya existente.

## 9. Fases

### Fase 0 — Tests de comportamiento

- Crear fixtures de spots locales.
- Probar token interno, typo leve, acentos/case, alias y merge contra externos.

**Estado 2026-04-26:** implementado con `tests/search-intent-recovery.test.mjs` para normalización, token interno, typo leve `Plancha/placha` contra dato visible `Pancha`, y match secundario conservador.

### Fase 1 — Helper puro

- Implementar normalización/scoring local.
- No tocar UI.
- DoD: tests pasan y explican razones de score.

**Estado 2026-04-26:** implementado en `lib/search/intent-normalize.ts` y `lib/search/intent-scoring.ts`.

### Fase 2 — Integración en búsqueda actual

- Integrar score local en `spotsStrategy` y/o `mergeSearchResults`.
- Ajustar prioridad local vs externo.
- Mantener filtros `all/saved/visited` y tags.

**Estado 2026-04-26:** integrado en `lib/search/spotsStrategy.ts` para filtrar/ordenar por score local y en `lib/explore/map-screen-orchestration.ts` para proteger candidatos locales plausibles en el merge con externos. Corrección posterior del mismo día: cuando hay query textual, `spotsStrategy` ya no recorta la búsqueda local por bbox antes del scoring; esto evita que una coincidencia mediocre dentro del viewport bloquee un spot propio relevante fuera de cámara.

Corrección de estabilidad cross-filter: el cache de resultados vacíos en `Por visitar`/`Visitados` no puede cerrar la búsqueda antes de ejecutar la segunda pasada sobre el pool completo. Esto evita que un spot visitado como “Gran Parque La Pancha” aparezca unas veces sí y otras no al buscar desde `Por visitar`.

### Fase 3 — QA V1

- Casos manuales:
- `Plancha`;
- `placha`;
- `plancha` con el mapa ubicado fuera de Mérida/Yucatán;
- `parque` con el mapa ubicado en otra ciudad, verificando que candidatos locales/DB aparezcan antes que ruido externo;
- repetir `plancha` varias veces alternando `Todos` ↔ `Por visitar` ↔ `Visitados` para validar que el cache no genera intermitencia;
- `Merida`/`Mérida`;
  - token interno de un spot con varias palabras;
  - búsqueda sin candidato local para confirmar Mapbox sigue útil.

### Fase 4 — Decisión DB

- Después de introspección, decidir aliases/search document si hace falta.

## 10. DoD

- La búsqueda recupera spots propios por intención razonable, no solo por literal.
- “Gran Parque La Pancha/Plancha” aparece con `Plancha`/`plancha`.
- Typos leves no dejan que ruido externo desplace un candidato local plausible.
- Mapbox sigue funcionando cuando no hay candidato local.
- Tests cubren normalización, scoring y merge.
- No se abre SearchV2 completo.
- No se registra query cruda sin decisión explícita.

## 11. Archivos probables

- `lib/search/intent-normalize.ts`
- `lib/search/intent-scoring.ts`
- `lib/search/spotsStrategy.ts`
- `lib/explore/map-screen-orchestration.ts`
- `components/explorar/MapScreenVNext.tsx`
- `tests/search-intent-recovery.test.mjs`
- contratos/ops si se formaliza el helper como canon.

## 12. Riesgos

- Fuzzy demasiado agresivo puede mostrar falsos positivos.
- Priorizar local siempre puede ocultar Mapbox útil.
- Mezclar filtros con búsqueda global puede confundir si no se comunica bien.
- Aliases en DB sin fuente clara pueden volverse deuda editorial.

## 13. Qué no tocar

- Fluir.
- Recordar.
- RLS.
- Migraciones DB sin introspección.
- Rediseño visual macro de SearchSurface.
- APIs externas nuevas.
