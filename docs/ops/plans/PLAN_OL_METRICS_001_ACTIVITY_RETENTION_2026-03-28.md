# PLAN_OL_METRICS_001_ACTIVITY_RETENTION_2026-03-28

## Objetivo

Implementar una medicion minima y productiva de:

- actividad de usuarios
- retorno (`D1` / `D7` / `D30`)
- uso comparado de `Explore` vs `Recordar`
- conversiones hacia acciones de valor (`save`, `visited`, `note`)

sin introducir coordenadas exactas, PII sensible ni dependencias externas innecesarias.

## Decision de stack

### Fuente canónica

**Supabase** debe ser la fuente canónica de eventos y sesiones.

Motivos:

- ya es parte del stack real del repo
- sirve para web hoy y para iOS/Android después
- permite cruzar comportamiento con `auth`, `pins`, `spots` y futuro `Recordar-lite`
- da más control de privacidad y retención

### Fuente complementaria

**Vercel Analytics** puede usarse solo como capa complementaria para:

- tráfico web
- páginas/rutas
- referrers
- performance web

No debe ser la fuente principal para producto ni para decidir membresía.

## Preguntas que este plan debe responder

1. ¿Cuántos usuarios activos reales tiene FLOWYA por día y por semana?
2. ¿Cuántos vuelven a `D1`, `D7` y `D30`?
3. ¿Qué porcentaje usa solo `Explore`, solo `Recordar` o ambos?
4. ¿Guardar spots genera retorno?
5. ¿Marcar `visited` genera retorno?
6. ¿Crear una nota privada genera mejor retorno que solo explorar?
7. ¿La gente vuelve por descubrir o por recordar?

## Principios

- medir solo lo que responda preguntas de producto reales
- no enviar coordenadas exactas a eventos
- no enviar email, texto libre de notas ni PII sensible
- priorizar nombres de eventos estables y pocos campos
- tracking no bloqueante; si falla, la UX sigue
- respetar `OL-PRIVACY-001` como contrato de divulgación
- no abrir dashboards complejos antes de tener eventos confiables

## Reutilizacion del repo actual

Base existente que se debe reaprovechar:

- **`profiles.last_activity_at`** (migración **029**): ya se escribe desde la app; **no** se expone en UI de cuenta. Incluir en OL-METRICS-001 como señal de **última actividad registrada** consultable en SQL/ETL junto a eventos agregados.
- [lib/search/metrics.ts](../../../lib/search/metrics.ts)
- [lib/explore/decision-metrics.ts](../../../lib/explore/decision-metrics.ts)
- [lib/mapbox-api-metrics.ts](../../../lib/mapbox-api-metrics.ts)
- [docs/contracts/ACTIVITY_SUMMARY.md](../../contracts/ACTIVITY_SUMMARY.md)
- [docs/contracts/GAMIFICATION_TRAVELER_LEVELS.md](../../contracts/GAMIFICATION_TRAVELER_LEVELS.md)

Regla:

- no duplicar contadores runtime
- envolverlos o derivarlos desde una capa canónica `trackEvent()`
- mantener `mapbox-api-metrics` como investigación/coste, no como telemetría de producto principal

## Definiciones canónicas

### Sesión activa

Sesión agrupada por `session_id` con:

- `started_at`
- `ended_at`
- `platform`
- `app_version`
- `is_authenticated`

### Usuario activo

Usuario o sesión anónima con al menos un evento productivo en ventana diaria/semanal.

### Retorno

- `D1`: vuelve entre 1 y 2 días naturales tras su primera sesión
- `D7`: vuelve dentro de 7 días
- `D30`: vuelve dentro de 30 días

### Sesión por pilar

Clasificación derivada:

- `explore_only`
- `recordar_only`
- `mixed`
- `passive`

Regla inicial:

- `Explore`: búsqueda, apertura de spot, save, visited, direcciones, create spot
- `Recordar`: abrir editor de nota, guardar nota, abrir vista de recuerdos

## Eventos MVP

### Actividad base

- `session_started`
- `session_ended`
- `auth_completed`

### Explore

- `search_started`
- `search_no_results`
- `spot_opened`
- `spot_saved`
- `spot_marked_visited`
- `directions_opened`
- `create_spot_completed`

### Recordar-lite

- `recordar_entry_opened`
- `private_note_saved`
- `memory_view_opened`

## Propiedades mínimas por evento

Campos comunes:

- `session_id`
- `user_id` nullable
- `event_name`
- `screen`
- `platform`
- `app_version`
- `created_at`

Campos opcionales acotados:

- `spot_id` nullable
- `pin_filter` nullable
- `search_context` nullable (`search`, `map`, `sheet`)
- `source` nullable
- `is_authenticated`

Campos prohibidos:

- coordenadas exactas
- email
- texto libre de notas
- query completa si contiene riesgo de PII

Para búsqueda:

- guardar solo agregados seguros cuando sea necesario:
  - `query_length`
  - `result_count`
  - `had_flowya_results`

## Modelo de datos propuesto

Basado en la capa V2 ya documentada en [docs/contracts/GAMIFICATION_TRAVELER_LEVELS.md](../../contracts/GAMIFICATION_TRAVELER_LEVELS.md).

### Tabla `analytics_sessions`

- `session_id` uuid pk
- `user_id` uuid nullable
- `platform` text
- `app_version` text nullable
- `started_at` timestamptz
- `ended_at` timestamptz nullable
- `is_authenticated` boolean

### Tabla `analytics_events`

- `id` uuid pk
- `session_id` uuid fk
- `user_id` uuid nullable
- `event_name` text
- `screen` text nullable
- `spot_id` uuid nullable
- `filter_mode` text nullable
- `payload_json` jsonb default '{}'
- `created_at` timestamptz default now()

## KPIs de tablero minimo

### Actividad

- `DAU`
- `WAU`
- sesiones por usuario
- `% signed_in vs anonymous`

### Activación

- `% con search`
- `% con apertura de spot`
- `% con save`
- `% con visited`
- `% con primera nota privada`

### Retorno

- `D1`
- `D7`
- `D30`
- retorno tras `save`
- retorno tras `visited`
- retorno tras `private_note_saved`

### Uso por pilar

- `% explore_only`
- `% recordar_only`
- `% mixed`
- `% passive`

### Conversión a valor

- `% de spots guardados que luego terminan en visited`
- `% de usuarios que guardan y luego crean nota`
- tiempo medio entre `spot_saved` y `private_note_saved`

## Etapas de implementación

### ET-0 Contrato y privacidad

Alcance:

- definir taxonomía canónica de eventos
- validar campos permitidos/prohibidos
- alinear disclosure con `OL-PRIVACY-001`

Salida:

- contrato operativo de eventos aprobado
- lista cerrada de eventos MVP

### ET-1 Foundation técnica

Alcance:

- crear tablas `analytics_sessions` y `analytics_events`
- helper `trackEvent()`
- helper `ensureSession()`
- feature flag para habilitar/deshabilitar tracking

Salida:

- persistencia mínima funcionando
- fallos de tracking no rompen UX

### ET-2 Instrumentación Explore

Alcance:

- conectar `search_started`
- conectar `search_no_results`
- conectar `spot_opened`
- conectar `spot_saved`
- conectar `spot_marked_visited`
- conectar `directions_opened`
- conectar `create_spot_completed`

Salida:

- funnel base de Explore visible

### ET-3 Instrumentación Recordar-lite

Alcance:

- conectar `recordar_entry_opened`
- conectar `private_note_saved`
- conectar `memory_view_opened`

Salida:

- comparación inicial `Explore` vs `Recordar`

### ET-4 Dashboard y lectura operativa

Alcance:

- vistas SQL o consultas guardadas para KPIs
- cohorte básica `D1/D7/D30`
- segmentación por tipo de sesión

Salida:

- tablero mínimo para decisiones semanales
- baseline usable para monetización futura

## Dependencias

- `OL-PRIVACY-001` al menos definido en disclosure para analytics
- `Auth` estable para distinguir anónimo vs registrado
- `Recordar-lite` mínimo para medir uso real de memoria

## Riesgos

1. Medir demasiado pronto y dispersar foco.
- Mitigación: solo eventos MVP.

2. Ruido por mezcla de runtime metrics y analytics persistente.
- Mitigación: `trackEvent()` como capa única de salida.

3. Riesgo de privacidad por payloads demasiado abiertos.
- Mitigación: lista blanca estricta de campos.

4. Datos incompletos por sesiones anónimas o cierres abruptos.
- Mitigación: aceptar `ended_at` nullable y usar heartbeats/cierre best effort solo si hace falta.

## Criterio de cierre

Se considera cerrado cuando:

1. Existe persistencia estable de sesiones y eventos MVP.
2. Se puede consultar `DAU`, `WAU`, `D1`, `D7`, `D30`.
3. Se puede separar uso `Explore` vs `Recordar`.
4. Se puede responder si `save`, `visited` y `private_note_saved` correlacionan con retorno.
5. No se envían coordenadas exactas ni PII sensible.

## Inserción en backlog y roadmap

Ubicación recomendada:

- no es `P0`
- debe ejecutarse después de estabilidad base y privacidad mínima
- debe quedar listo antes de monetización

Secuencia recomendada:

1. Explore web estable
2. Auth / privacidad mínima
3. `OL-CONTENT-002` y foundation de `Recordar-lite`
4. `OL-METRICS-001` actividad y retorno
5. decisión de premium/paywall

## Micro-scopes sugeridos

- `MS-MET-01` Definir taxonomía MVP de eventos y campos permitidos.
- `MS-MET-02` Crear tablas `analytics_sessions` y `analytics_events`.
- `MS-MET-03` Implementar helper canónico `trackEvent()`.
- `MS-MET-04` Instrumentar funnel base de Explore.
- `MS-MET-05` Instrumentar eventos de `Recordar-lite`.
- `MS-MET-06` Construir cohortes y dashboard mínimo.
- `MS-MET-07` Revisar a 2-4 semanas si `Recordar` mejora retorno frente a `Explore` puro.

## Backlog técnico ejecutable

### BT-MET-01 — Contrato canónico de eventos

**Prioridad:** Alta al activar `OL-METRICS-001`

**Objetivo**

- cerrar naming, payloads y lista blanca de eventos MVP

**Archivos objetivo**

- `docs/contracts/`:
  - sugerido nuevo contrato `ANALYTICS_EVENTS_V1.md`
- `docs/ops/plans/PLAN_OL_METRICS_001_ACTIVITY_RETENTION_2026-03-28.md`
- `docs/ops/plans/PLAN_OL_PRIVACY_001_2026-03-10.md`

**Notas**

- alinear con runtime ya existente en:
  - `lib/search/metrics.ts`
  - `lib/explore/decision-metrics.ts`
- no exponer texto libre ni coordenadas

**Criterio de cierre**

- existe lista cerrada de eventos y payloads permitidos
- privacidad y contrato de producto no se contradicen

### BT-MET-02 — Migración analytics base

**Prioridad:** Alta

**Objetivo**

- crear persistencia mínima de sesiones y eventos

**Archivos objetivo**

- sugerido nuevo archivo:
  - `supabase/migrations/022_analytics_sessions_events.sql`

**Contenido esperado**

- tabla `analytics_sessions`
- tabla `analytics_events`
- índices por `session_id`, `user_id`, `event_name`, `created_at`
- RLS mínima:
  - escritura controlada por cliente autenticado o sesión anónima según decisión final
  - lectura restringida a servicio/admin si aplica

**Riesgo**

- abrir demasiado la RLS o dejar payloads sin control

**Criterio de cierre**

- migración aplicada local/remoto
- inserción básica validada

### BT-MET-03 — Capa de dominio analytics

**Prioridad:** Alta

**Objetivo**

- crear una sola salida canónica para telemetría

**Archivos objetivo**

- sugeridos nuevos módulos:
  - `lib/analytics/types.ts`
  - `lib/analytics/session.ts`
  - `lib/analytics/track-event.ts`
  - `lib/analytics/privacy.ts`
- reutilizar:
  - `lib/supabase.ts`

**Responsabilidades**

- `ensureSession()`
- `trackEvent()`
- sanitización de payload
- feature flag para apagar envío

**Guardrails**

- nunca bloquear UI por fallo de red
- `fire-and-forget` o cola ligera
- `session_id` estable por sesión

**Criterio de cierre**

- cualquier superficie del producto puede emitir eventos mediante `trackEvent()`
- no hay llamadas directas dispersas a `supabase.from('analytics_events')`

### BT-MET-04 — Bootstrap de sesión en entry real

**Prioridad:** Alta

**Objetivo**

- abrir y mantener una sesión productiva desde el entry web real

**Archivos objetivo**

- `components/explorar/MapScreenVNext.tsx`
- opcional si hace falta:
  - `app/_layout.*`
  - `app/index.*`

**Notas**

- hoy el entry principal documentado es Explore/mapa
- el punto más seguro para arrancar es `MapScreenVNext`

**Criterio de cierre**

- `session_started` se emite una vez por sesión real
- no hay duplicados por re-render o navegación interna trivial

### BT-MET-05 — Bridge de métricas existentes de Search

**Prioridad:** Alta

**Objetivo**

- convertir la instrumentación runtime ya existente en eventos persistentes mínimos

**Archivos objetivo**

- `lib/search/metrics.ts`
- `hooks/search/useSearchControllerV2.ts`
- `components/explorar/MapScreenVNext.tsx`
- `components/search/SearchResultsListV2.tsx`

**Eventos a cubrir**

- `search_started`
- `search_no_results`
- `spot_opened`
- `create_spot_completed`

**Regla**

- evitar doble conteo entre runtime local y analytics persistente
- runtime puede seguir para debug/QA; persistencia sale por `trackEvent()`

**Criterio de cierre**

- funnel base de búsqueda se puede consultar en Supabase

### BT-MET-06 — Instrumentar mutaciones de pins

**Prioridad:** Alta

**Objetivo**

- medir las acciones de valor más cercanas al JTBD

**Archivos objetivo**

- `lib/pins.ts`
- consumidores principales:
  - `components/explorar/MapScreenVNext.tsx`
  - `app/spot/[id].web.tsx`

**Eventos a cubrir**

- `spot_saved`
- `spot_marked_visited`

**Decisión técnica sugerida**

- emitir desde `lib/pins.ts` o desde una capa wrapper muy cercana
- no confiar solo en handlers de UI, para no perder caminos alternos

**Criterio de cierre**

- save/visited quedan medidos aunque cambie la UI

### BT-MET-07 — Instrumentar `Recordar-lite`

**Prioridad:** Media, dependiente de `Recordar-lite`

**Objetivo**

- medir si la memoria privada mejora retorno

**Archivos objetivo**

- `lib/pins.ts` si las notas viven ahí
- futuros módulos de notas privadas si se crean
- `components/explorar/SpotSheet.tsx`
- superficie de lectura de recuerdos cuando exista

**Eventos a cubrir**

- `recordar_entry_opened`
- `private_note_saved`
- `memory_view_opened`

**Criterio de cierre**

- se puede diferenciar uso `Explore` vs `Recordar`

### BT-MET-08 — Consultas de cohortes y tablero mínimo

**Prioridad:** Media

**Objetivo**

- convertir eventos en lectura operativa semanal

**Archivos objetivo**

- sugerido nuevo documento:
  - `docs/ops/analysis/ANALYTICS_BASELINE_QUERIES_2026-03-28.md`
- opcional nueva migración si se materializan vistas:
  - `supabase/migrations/023_analytics_views.sql`

**Consultas mínimas**

- `DAU`
- `WAU`
- `D1`
- `D7`
- `D30`
- `% explore_only`
- `% recordar_only`
- `% mixed`
- retorno tras `save`
- retorno tras `private_note_saved`

**Criterio de cierre**

- una revisión semanal puede responder actividad, retorno y uso por pilar sin trabajo manual pesado

## Secuencia sugerida de ejecución

1. `BT-MET-01` contrato canónico
2. `BT-MET-02` migración analytics base
3. `BT-MET-03` capa de dominio analytics
4. `BT-MET-04` bootstrap de sesión
5. `BT-MET-05` bridge de Search
6. `BT-MET-06` mutaciones de pins
7. `BT-MET-07` Recordar-lite
8. `BT-MET-08` cohortes y dashboard

## Dependencias cruzadas con el roadmap V1

- `P0` debe dejar estable el loop principal de Explore antes de instrumentarlo
- `OL-PRIVACY-001` debe cerrar el disclosure mínimo antes de activar persistencia productiva
- `Recordar-lite` debe existir antes de exigir métricas comparativas de memoria
- `P2 monetización` no debería empezar sin `BT-MET-08`

## Riesgos de implementación

1. Instrumentar en demasiados handlers de UI.
- Mitigación: preferir dominio y puntos de entrada canónicos.

2. Abrir `OL-METRICS-001` antes de tiempo y distraer el cierre V1.
- Mitigación: mantenerlo como loop posterior a estabilidad y privacidad.

3. Crear tablas útiles pero sin consultas operativas.
- Mitigación: `BT-MET-08` forma parte del Definition of Done real.

## Definition of Done del backlog técnico

El backlog se considera realmente cerrado cuando:

- existe la migración base de analytics
- hay helper canónico de tracking
- Explore emite eventos persistentes mínimos
- `save` y `visited` ya son medibles
- `Recordar-lite` tiene medición específica
- se puede revisar un baseline semanal con cohortes y clasificación por pilar

## Recomendación final

FLOWYA no necesita una plataforma compleja de analytics en esta fase.

Necesita una capa pequeña, privada y canónica en Supabase que permita responder una pregunta de producto muy concreta:

**si el mapa personal y los recuerdos hacen que la gente vuelva más que solo explorar.**
