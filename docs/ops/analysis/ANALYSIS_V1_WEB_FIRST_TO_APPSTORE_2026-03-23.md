# ANALYSIS_V1_WEB_FIRST_TO_APPSTORE_2026-03-23

## 1. Resumen ejecutivo

FLOWYA hoy es, de forma literal, un producto **web-first**. La entrada real en web monta `MapScreenVNext`, mientras que en nativo el mapa, create spot y spot detail siguen siendo placeholders. El repo ya sostiene un loop usable de **descubrimiento en mapa + guardado/visitado + creación/edición de spots + búsqueda + share + etiquetas personales + progreso por países**, pero **no** sostiene todavía un loop real de **diario de viaje**, **trips**, **library/me**, **membership** ni preparación honesta para tiendas.

La conclusión principal es:

- La V1 realista que hoy sí se puede probar con usuarios es una **V1 web de Explore**.
- Esa V1 valida bien **Descubre** y valida parcialmente **Recorre**.
- **Recuerda** existe solo como hipótesis estratégica y como documentación; en código aún no es un dominio real.
- Con el estado actual, FLOWYA **todavía no justifica** una membresía de **79 MXN/mes**.
- Si el diario geolocalizado sigue siendo la tesis premium correcta, el siguiente diferenciador no debe ser “más Explore”, sino un **Recordar-lite privado sobre pins** antes de hablar de cobro o de App Store.

## 2. Fuentes revisadas

### Documentos base

- `docs/governance/SCOPE_0.md`
- `docs/ops/README.md`
- `docs/ops/OPEN_LOOPS.md`
- `docs/contracts/INDEX.md`
- `docs/contracts/DATA_MODEL_CURRENT.md`
- `docs/contracts/SEARCH_V2.md`
- `docs/contracts/RECORDAR_ENTRY_SPOT_SHEET.md`
- `docs/contracts/PROFILE_AUTH_CONTRACT_CURRENT.md`
- `docs/contracts/SEARCH_NO_RESULTS_CREATE_CHOOSER.md`
- `docs/contracts/USER_TAGS_EXPLORE.md`
- `docs/contracts/ACTIVITY_SUMMARY.md`
- `docs/contracts/CREATE_SPOT_PASO_0.md`
- `docs/ops/plans/PLAN_RECORDAR_MI_DIARIO.md`
- `docs/ops/strategy/SYSTEM_MAP.md`
- bitácoras recientes `312`, `313`, `314`

### Código inspeccionado

- Shell/routing: `app/_layout.tsx`, `app/(tabs)/_layout.tsx`, `app/(tabs)/index.web.tsx`, `app/(tabs)/index.tsx`, `app/(tabs)/explore.tsx`
- Explore runtime: `components/explorar/MapScreenVNext.tsx`, `components/explorar/MapCoreView.tsx`, `components/explorar/SpotSheet.tsx`, `components/explorar/CountriesSheet.tsx`
- Search: `hooks/search/useSearchControllerV2.ts`, `components/search/SearchSurface.tsx`, `lib/search/spotsStrategy.ts`, `lib/places/searchPlaces.ts`, `lib/places/searchPlacesPOI.ts`
- Spot flows: `app/create-spot/index.web.tsx`, `app/spot/[id].web.tsx`, `app/spot/edit/[id].web.tsx`, `components/design-system/spot-detail.tsx`
- Auth/storage: `contexts/auth-modal.tsx`, `lib/supabase.ts`, `lib/storage/*`
- Dominio de pins/tags/share: `lib/pins.ts`, `lib/tags.ts`, `lib/share-spot.ts`, `lib/share-countries-card.ts`
- Infra DB: `supabase/migrations/001`, `006`, `008`, `011`, `012`, `014`, `018`, `019`, `020`, `021`

### Verificación operativa

- `npx tsc --noEmit` ejecutado el 2026-03-23: **ok**
- No se encontraron tests automatizados (`*.test.*`, `*.spec.*`, `__tests__/`)

## 3. Estado real por módulo

### Explore

**Estado:** existe

**Observaciones**

- La experiencia viva está concentrada en `components/explorar/MapScreenVNext.tsx`.
- Hay mapa principal con spots, selección, SpotSheet, search overlay, create spot desde draft, create desde POI, filtros `all/saved/visited`, tags, deep links, share y overlay de países.
- El mapa ya opera con pins individuales; el clustering fue retirado y la capa Mapbox se monta con `cluster: false`.
- Hay soporte para empty-state curado, landmarks visibles, “Lugares populares en Flowya”, fallback global y cold-start world.
- También existe progreso/gamificación ligera por países y spots, pero sigue siendo accesorio, no el corazón del valor.

**Lectura honesta**

- Explore web está bastante más cerca de “producto real” que de “prototipo vacío”.
- Explore nativo no está listo: el entry nativo del mapa sigue siendo placeholder.

### Spot interaction

**Estado:** existe, con partes parciales

**Observaciones**

- Guardar y marcar visitado existen y persisten en `pins` mediante `saved/visited`.
- SpotSheet permite `Por visitar`, `Visitado`, ver detalle, compartir, editar y etiquetar.
- Hay create spot mínimo por tres caminos reales:
  - draft sobre mapa,
  - “Crear spot aquí” desde no-results,
  - crear desde POI tocado o sugerido.
- Existe edición web de spot con textos, foto, ubicación, soft delete vía RPC `hide_spot`.
- Existe spot detail web y share deep link.
- No existe “agregar a recorrido”, “flow lite”, orden manual, duración ni constructor de ruta.

**Lectura honesta**

- El repo ya tiene un dominio real de spot personalizable.
- Lo que no tiene es un dominio real de **recorrido**.

### Search

**Estado:** existe

**Observaciones**

- `useSearchControllerV2` y `spotsStrategy` implementan búsqueda viewport-first con expansión progresiva.
- Search mezcla spots internos con resultados externos Mapbox/POI.
- Hay no-results chooser y create-from-no-results sin geocoding silencioso.
- En `saved` y `visited` se soporta búsqueda sobre el universo propio con fallback expandido.
- Hay quick actions en `visited` para agregar imagen y escribir descripción corta.
- Hay chips de etiquetas y filtro por etiquetas.

**Lectura honesta**

- Search ya es una fortaleza del repo.
- Sigue teniendo complejidad alta y riesgo de regresión por la cantidad de reglas embebidas en `MapScreenVNext`.

### Journal / Recordar

**Estado:** no existe

**Observaciones**

- Existe contrato `RECORDAR_ENTRY_SPOT_SHEET.md`.
- Existe plan `PLAN_RECORDAR_MI_DIARIO.md`.
- No existen en código:
  - tabla de journal entries,
  - tabla de trips,
  - timeline,
  - mapa de viaje personal,
  - vista de entradas,
  - flujo “Mi diario” en SpotSheet,
  - `pins.notes` o `updatePinNotes`.
- Lo más cercano hoy a “recordar” es:
  - `visited`,
  - quick edit de `description_short`,
  - quick add image,
  - recientes,
  - overlay de países.

**Lectura honesta**

- Eso no es un diario.
- Además, la quick description actual escribe sobre metadata del spot, no sobre memoria privada del usuario.

### Library / Me

**Estado:** parcial

**Observaciones**

- No existe una pantalla dedicada de Library/Profile.
- Sí existen piezas dispersas:
  - filtros `Por visitar` y `Visitados`,
  - recientes,
  - tags personales,
  - countries sheet,
  - chip de traveler points,
  - logout.
- No existen:
  - biblioteca consolidada,
  - listado de trips,
  - listado de journal entries,
  - flows guardados,
  - perfil básico como pantalla.

**Lectura honesta**

- Hoy “Library/Me” es una suma de overlays y filtros dentro de Explore, no un módulo propio.

### Membership

**Estado:** no existe

**Observaciones**

- No hay paywall.
- No hay billing.
- No hay Stripe.
- No hay gating por plan.
- No hay límites gratis/premium.
- No hay modelo de membresía materializado en DB, UI o backend.

### Infra / Auth / Storage

**Estado:** existe, con caveats

**Observaciones**

- Supabase ya soporta:
  - `spots`
  - `pins`
  - `feedback`
  - `user_tags`
  - `pin_tags`
- Auth real: modal con **email + magic link**, sin social login.
- Persistencia local real:
  - preferencia de filtro,
  - badges pendientes,
  - recientes,
  - historial de búsqueda.
- Soft delete de spots ya está protegido por RPC y guardrails recientes.

**Lectura honesta**

- La base técnica para una V1 web existe.
- La base técnica para una V1 de diario privado y monetización todavía no.

## 4. Hipótesis confirmadas / refutadas

### Explore está cerca de ser usable

**Confirmada, con alcance web**

- Sí hay una experiencia usable de descubrimiento y selección en mapa.
- No significa “listo para tiendas”; significa “apto para validación web con usuarios”.

### Save/Visited existe como dominio sólido

**Confirmada**

- `pins` ya opera con `saved` y `visited` como fuente real.
- Hay sticky filter, counts, badges, countries summary, quick actions y persistencia.

### Journal ya tiene base real

**Refutada**

- Tiene intención documental.
- No tiene dominio ni UI real en runtime.

### Web sirve como ambiente de validación V1

**Confirmada**

- Es el único ambiente donde mapa, detalle y create spot están realmente implementados.
- Nativo sigue explícitamente en modo placeholder.

### El diario geolocalizado debe ser central para el valor premium

**Confirmada como hipótesis estratégica, no como estado actual**

- Es la vía más clara para diferenciar FLOWYA del genérico “guardar spots”.
- Hoy no existe en código, así que no puede venderse todavía como valor probado.

### El mayor reto hoy es estabilidad y no features

**Confirmada**

- La app viva depende de un runtime muy concentrado en un componente enorme.
- No hay tests automatizados.
- Hay deriva documental relevante.
- Hay mezcla de capas legacy y nuevas en detalle/pins.

## 5. Gap analysis V1

| JTBD | Feature | Estado actual | Gap | Prioridad | Riesgo | Recomendación |
|---|---|---|---|---|---|---|
| JTBD-1 Descubrimiento | mapa principal con spots | Implementado en web | Nativo no existe; estabilidad concentrada en `MapScreenVNext` | Alta | Alta | Congelar alcance en web y endurecer Explore antes de abrir nuevos frentes |
| JTBD-1 Descubrimiento | búsqueda usable overlay | Implementada | Complejidad alta; depende de Mapbox externo; mucha lógica en un solo runtime | Alta | Alta | Mantenerla como núcleo de V1; priorizar QA de casos límite |
| JTBD-1 Descubrimiento | “explorar esta área” / framing contextual | Parcial | Hay viewport, reframe y empty-state local, pero no un CTA explícito de exploración por área | Media | Media | No abrir scope nuevo; usar framing actual como suficiente para V1 |
| JTBD-1 Descubrimiento | categorías básicas | Parcial | Hay `maki`, landmarks y tags, pero no taxonomía de producto clara para explorar | Media | Media | No convertirlo en proyecto aparte antes de cerrar valor principal |
| JTBD-2 Planeación ligera | guardar spot | Implementado | Requiere auth para persistir; bien alineado | Alta | Media | Mantener como feature central |
| JTBD-2 Planeación ligera | visitado | Implementado | Falta convertirlo en memoria personal, no solo estado | Alta | Media | Usarlo como pivote hacia Recordar-lite |
| JTBD-2 Planeación ligera | tags personales | Implementado con caveat | RLS de `pin_tags` exige ownership del spot; riesgo de que falle en spots no propios | Alta | Alta | Corregir contrato/runtime antes de depender más de tags |
| JTBD-2 Planeación ligera | library/me consolidado | No existe | Todo vive dentro de Explore | Media | Media | No crear pantalla nueva aún; primero cerrar uso real dentro de Explore |
| JTBD-3 Recorrido del momento | mapa + detalle + cómo llegar | Implementado | No hay constructor de ruta ni secuencia de spots | Alta | Media | Definir “Recorre” como resolver el día con mapa + directions externos, no como route planner |
| JTBD-3 Recorrido del momento | flow/route lite | No existe | Sin entidades ni UI de recorridos | Baja | Media | Sacarlo de V1 web |
| JTBD-4 Registro de experiencia | marcar visitado | Implementado | Hoy no abre capa de recuerdo privado | Alta | Media | Hacer que `visited` sea entrada a memoria, no fin de flujo |
| JTBD-4 Registro de experiencia | nota + foto personal | Parcial | Quick edit/image existe, pero escribe sobre el spot, no sobre dato privado del usuario | Alta | Alta | Mover “recordar” a datos privados ligados al pin |
| JTBD-5 Diario geolocalizado | trip | No existe | Sin modelo ni UI | Alta | Media | No intentar trips completos en V1 inmediata |
| JTBD-5 Diario geolocalizado | journal entry ligada a spot | No existe | Solo contratos/planes | Alta | Alta | Construir primero Recordar-lite sobre pins |
| JTBD-5 Diario geolocalizado | entrada libre / timeline / mapa del viaje | No existe | Sin base técnica actual | Media | Alta | Dejar para post-validación, no para P0 |
| JTBD-6 Confianza premium | membership/paywall/gating | No existe | Sin producto premium defendible ni infraestructura de cobro | Alta | Alta | No cobrar aún |

## 6. V1 corregida por evidencia

La V1 realista no es “Descubre + Recorre + Recuerda” en el mismo peso.

La V1 realista hoy es:

### Pilar 1 — Descubre

- mapa web-first con spots
- search overlay con resultados internos + externos
- selección de spot/POI
- create spot desde huecos reales del mapa
- detalle, share y edición básica

### Pilar 2 — Guarda y resuelve el día

- `Por visitar`
- `Visitados`
- tags personales
- recent viewed
- countries progress
- salida a mapas externos para navegación

### Pilar 3 — Recordar-lite

- **no** diario completo
- **sí** memoria personal mínima ligada al pin visitado o guardado
- objetivo: que `visited` deje de ser solo estado y se vuelva el inicio de una memoria privada

### Qué queda fuera de la V1 corregida

- trips
- timeline
- journal entries libres
- flow/route builder
- paywall
- salida a tiendas
- expandir gamificación como frente principal

### Juicio de secuencia

Si se intenta meter diario completo, trips, membership y tiendas encima del estado actual, la propuesta queda sobredimensionada. El repo demuestra que primero conviene:

1. cerrar Explore web
2. convertir `visited` en memoria privada mínima
3. validar uso
4. después discutir cobro y App Store

## 7. Riesgos de arquitectura / estabilidad

### 1. Concentración excesiva en `MapScreenVNext`

- La app viva depende en exceso de un archivo muy grande.
- Riesgo: cualquier cambio en search/map/filter/sheet/create rompe comportamiento cruzado.

### 2. Asimetría web vs native

- El producto operativo real está en web.
- Nativo no es un siguiente paso corto; hoy es otra fase.

### 3. Ausencia de tests automatizados

- No hay red de seguridad automática para regresiones.
- El proyecto depende de smoke manual + bitácora.

### 4. Deriva entre contratos y esquema real

- Parte de la documentación de datos y auth ya quedó atrás respecto a migraciones recientes.

### 5. Riesgo funcional en tags

- El contrato SQL actual de `pin_tags` exige ownership del spot.
- Si el producto espera etiquetar spots guardados/visitados no creados por el usuario, el runtime está conceptualmente desalineado.

### 6. Mezcla legacy / actual en pins

- Explore vive sobre `saved/visited`.
- Spot detail web todavía usa helpers legacy de pin status exclusivo.
- Es usable, pero no es una base limpia para escalar Recordar.

### 7. “Recordar” aún no tiene entidad propia

- Hoy cualquier intento de recordar cae en metadata pública del spot o en estados de Explore.
- Sin dominio privado, el valor premium se diluye.

## 8. Recomendación sobre membresía

Con la V1 realista actual, **no** recomiendo defender todavía un cobro de **79 MXN/mes**.

### Por qué no alcanza todavía

- Descubrir spots + guardarlos + marcarlos como visitados + ver países es útil, pero todavía se parece demasiado a un producto gratuito de descubrimiento/colección.
- No existe aún un activo personal persistente suficientemente fuerte.
- No existe un beneficio premium claro que se sienta acumulable mes a mes.

### Qué sí podría defender el cobro después

La columna vertebral más defendible para una membresía no es el mapa solo. Es:

- **tu mapa personal de recuerdos**
- **tus entradas privadas por lugar**
- **tu historial geolocalizado**
- **tu bitácora de viaje acumulable**

En otras palabras: el mejor candidato premium no es “más Explore”, sino **Recordar bien hecho**.

## Deriva documental detectada

### 1. `DATA_MODEL_CURRENT.md`

Está desactualizado frente al repo actual. No refleja con suficiente claridad:

- `spots.user_id`
- `spots.is_hidden`
- `spots.mapbox_bbox`
- `spots.mapbox_feature_type`
- `pins.saved`
- `pins.visited`
- `user_tags`
- `pin_tags`

### 2. `PROFILE_AUTH_CONTRACT_CURRENT.md`

Queda corto frente a la realidad actual de ownership en `spots`, RPC `hide_spot` y write guardrails recientes.

### 3. `RECORDAR_ENTRY_SPOT_SHEET.md`

Describe dependencias (`pins.notes`, `updatePinNotes`) que aún no existen en código.

### 4. `SYSTEM_MAP.md`

Ya no alcanza con listar solo `spots`, `pins`, `feedback`; el sistema actual también depende de `user_tags` y `pin_tags`.

## Recomendaciones de documentación

- Actualizar `DATA_MODEL_CURRENT.md` con el esquema real post-migraciones `011`, `012`, `018`, `019`, `020`, `021`.
- Actualizar `PROFILE_AUTH_CONTRACT_CURRENT.md` con ownership real en spots y soft delete actual.
- Añadir una nota explícita de **platform truth**: web es runtime real; native sigue en placeholder para mapa/create/detail.
- Aterrizar un contrato corto de **Recordar-lite** para evitar que “Mi diario” siga significando cosas distintas en docs y producto.
