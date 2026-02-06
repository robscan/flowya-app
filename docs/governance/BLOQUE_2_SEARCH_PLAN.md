# BLOQUE 2 — Search (FLOWYA) — Plan de ejecución

**Versión:** Ajustada con sugerencias de implementación  
**Estado:** Referencia para ejecución por micro-scopes

---

## Contexto y principios (no negociables)

- **Search ya existe** en `app/(tabs)/index.web.tsx`: modo Search, persistencia de texto, búsqueda solo por `title`, resultados cercanos por defecto, selección → mapa + card, CTA "Crear spot", clear (X). No se rehace.
- **Reglas duras:** Search solo invita a crear cuando NO existe spot coincidente. Search propone, Create Spot confirma. Sin IA, drafts, cookies/cache. Params → estado local → params ignorados.
- **Decisión actual:** Search solo busca por `title`. No hay tags ni categorías; no simularlos.

---

## Regla transversal (recordatorio)

- **Search propone, Create Spot confirma.**
- Nunca pasar: texto ambiguo como nombre; coordenadas inventadas.
- CTA de crear: **solo** cuando no existe spot coincidente.
- Sin IA, sin drafts, sin estados globales nuevos.

---

## Sugerencias de implementación (integradas)

### MS4 — Resolución de lugar (forward geocoding)

- La resolución **solo** se intenta cuando:
  - `searchResults.length === 0`
  - el usuario escribió un query **no vacío**
- **No** retries automáticos ni polling.
- **No** persistir resultados (ni store, ni cache, ni cookies).
- La resolución vive **exclusivamente en Search**: Create Spot no resuelve ni valida.
- Si **no** hay alta certeza (resultado único/confiable): tratar como caso ambiguo; **no** pasar nombre ni coordenadas. Objetivo: evitar falsos positivos y creación de spots incorrectos.

### MS5a — Consumo de params en Create Spot (solo una vez)

- **Punto crítico de estabilidad:** evitar `useEffect` reactivo a params para inicializar estado.
- **Preferir:** inicializadores de `useState`, o un guard `useRef(hasInitialized)` si hace falta.
- **Regla canónica:** Params → estado local → params ignorados. Evita bugs silenciosos al navegar atrás/adelante o al limpiar params.

### MS6 — Prioridad por viewport (orden de resultados)

- Si `mapInstance` **aún no existe**: **no** reordenar resultados; mantener el orden actual (fallback por distancia).
- Evitar que la lista "salte" de orden mientras el mapa termina de cargar. Objetivo: sensación de control y predictibilidad.

### Gobierno (refuerzo)

- Un micro-scope = una rama.
- **No** avanzar al siguiente MS sin: build limpio + bitácora cerrada.
- Si el alcance no está claro: **detenerse**, documentar antes de tocar código.

---

## Micro-scopes (orden obligatorio)

### B2-MS0 — Fuente de verdad de Search (solo documentación)

- **Objetivo:** Documentar reglas duras de Search.
- **Entregable:** Documento (p. ej. en `docs/bitacora/2026/02/`) con: Search solo invita a crear cuando no hay resultados válidos; búsqueda solo por title; Search propone / Create Spot confirma; sin IA, drafts, cookies; params → estado local → ignorar después; casos A (ambiguo), B (resoluble), C (existente).
- **No se toca código.** Rama: `search/B2-MS0-fuente-verdad-search`. Bitácora: `0XX-search-ms0.md`.

---

### B2-MS1 — Auditoría + hardening del Search actual

- **Objetivo:** Confirmar búsqueda solo por title, eliminar lógica muerta.
- **Archivos:** `app/(tabs)/index.web.tsx`. Confirmar que el único campo usado es `spot.title`; eliminar referencias a tags/categorías/descripción en búsqueda si existieran.
- **Cierre:** Búsqueda verificada como solo por title; sin código muerto. Rama: `search/B2-MS1-auditoria-hardening-search`. Bitácora: `0XX-search-ms1.md`.

---

### B2-MS2 — Separación explícita: existente vs no existente

- **Objetivo:** Search **nunca** muestre CTA de crear si hay resultados válidos.
- **Archivos:** `app/(tabs)/index.web.tsx`. Cuando `searchResults.length > 0`, **no** mostrar el botón "Crear nuevo spot"; mantener CTA solo cuando `searchResults.length === 0`.
- **Cierre:** Con resultados, solo lista; sin resultados, solo CTA crear. Rama: `search/B2-MS2-cta-solo-sin-resultados`. Bitácora: `0XX-search-ms2.md`.

---

### B2-MS3 — CTA de creación diferenciada (texto)

- **Objetivo:** Caso ambiguo → "Crear spot: {query}"; caso resoluble → "Crear: {nombre normalizado}". Aún sin coords en MS3.
- **Archivos:** `app/(tabs)/index.web.tsx`. CTA cuando no hay resultados: "Crear spot: {query}"; tras MS4, cuando haya lugar resuelto, "Crear: {nombre}".
- **Cierre:** CTA con texto diferenciado. Rama: `search/B2-MS3-cta-creacion-diferenciada`. Bitácora: `0XX-search-ms3.md`.

---

### B2-MS4 — Resolución de lugar (coords)

- **Objetivo:** Resolver lugar (nombre canónico + coordenadas) **solo cuando hay alta certeza**; no resolver si hay ambigüedad.
- **Condiciones (obligatorias):** Resolución **solo** cuando `searchResults.length === 0` **y** query no vacío. Sin retries, sin polling, sin persistencia (store/cache/cookies). La resolución vive **solo en Search**; Create Spot no resuelve ni valida.
- **Archivos:** `lib/mapbox-geocoding.ts` (o nuevo módulo) para forward geocoding; `app/(tabs)/index.web.tsx` para usar la resolución cuando no hay resultados.
- **Lógica:** Si resultado único/confiable → guardar nombre canónico + lat/lng para CTA y handoff. Si no → caso ambiguo; no pasar nombre ni coords.
- **Cierre:** Resolución solo en condiciones anteriores; alta certeza → nombre + coords; si no, ambiguo. Rama: `search/B2-MS4-resolucion-lugar`. Bitácora: `0XX-search-ms4.md`.

---

### B2-MS5 — Handoff Search → Create Spot

- **Objetivo:** Pasar params solo en caso resoluble (nombre + coords); caso ambiguo mantener flujo actual.
- **Archivos:** `app/(tabs)/index.web.tsx`. Si hay lugar resuelto → `/create-spot?name=...&lat=...&lng=...&source=search`; si no → `/create-spot?source=search`.
- **Cierre:** Params solo cuando hay lugar resuelto. Rama: `search/B2-MS5-handoff-search-create-spot`. Bitácora: `0XX-search-ms5.md`.

---

### B2-MS5a — Ajuste en Create Spot (consumir params una vez)

- **Objetivo:** Create Spot lee params (name, lat, lng) **solo al montar**; inicializa estado local; ignora params después.
- **Implementación:** Evitar `useEffect` reactivo a params. **Preferir:** inicializadores de `useState` o guard `useRef(hasInitialized)`. Regla: Params → estado local → params ignorados.
- **Archivos:** `app/create-spot/index.web.tsx`. Añadir `name` a params; inicializar `title` y ubicación desde params **una vez** (useState inicial o ref guard); no reaccionar a cambios de params tras mount.
- **Cierre:** Create Spot con name/lat/lng abre con mapa + pin + nombre prellenado; params no influyen después del primer mount. Rama: `search/B2-MS5a-create-spot-params-una-vez`. Bitácora: `0XX-search-ms5a.md`.

---

### B2-MS6 — Prioridad por contexto del mapa

- **Objetivo:** Ordenar resultados: viewport primero, luego cercanos, resto al final.
- **Implementación:** Si **mapInstance no existe aún**, **no** reordenar; mantener orden actual (fallback por distancia). Evitar que la lista "salte" mientras el mapa carga.
- **Archivos:** `app/(tabs)/index.web.tsx`. Con mapInstance: bounds + orden (en viewport primero, luego por distancia). Sin mapInstance: mismo orden que hoy (solo distancia).
- **Cierre:** Lista ordenada cuando hay mapa; sin saltos al cargar. Rama: `search/B2-MS6-prioridad-viewport`. Bitácora: `0XX-search-ms6.md`.

---

### B2-MS7 — Estados vacíos y mensajes canónicos

- **Objetivo:** Search nunca "falla"; siempre acción clara (lista, CTA o mensaje explícito).
- **Archivos:** `app/(tabs)/index.web.tsx`. Revisar estados vacíos y mensajes; sin mensajes de error genéricos ni estados muertos.
- **Cierre:** Estados vacíos con mensaje y/o acción definida. Rama: `search/B2-MS7-estados-vacios`. Bitácora: `0XX-search-ms7.md`.

---

### B2-MS8 — Anti-duplicados (soft)

- **Objetivo:** Advertencia antes de crear si hay coincidencias débiles; confirmación explícita.
- **Archivos:** `app/(tabs)/index.web.tsx`; `lib/spot-duplicate-check.ts` si se necesita. Al pulsar CTA crear desde Search: comprobar spots similares/cercanos; si hay coincidencias débiles → modal/banner "Ya existe un spot parecido: X. ¿Crear otro?"; navegar solo si el usuario confirma.
- **Cierre:** Flujo con advertencia y confirmación. Rama: `search/B2-MS8-anti-duplicados-soft`. Bitácora: `0XX-search-ms8.md`.

---

### B2-MS9 — Limpieza y cierre

- **Objetivo:** Revisar params y estados; sin residuos; rollback definido; cerrar BLOQUE 2 sin deuda.
- **Acciones:** Revisión params Search y Create Spot; limpieza estados no usados; documentar rollback por rama.
- **Cierre:** Sin deuda; rollback documentado. Rama: `search/B2-MS9-cierre`. Bitácora: `0XX-search-ms9.md`.

---

## Gobierno de ejecución (obligatorio)

- Un micro-scope a la vez; no adelantar trabajo.
- Por cada micro-scope: rama `search/B2-MS{n}-{descripcion-corta}`; no mezclar scopes.
- Bitácora en `docs/bitacora/2026/02/0XX-search-ms{n}.md`: objetivo, qué se tocó, qué NO se tocó, criterio de cierre, rollback.
- **No avanzar al siguiente MS sin:** build limpio + bitácora cerrada.
- **No hacer merge sin bitácora.** Si el alcance no está claro: **detenerse**, documentar antes de tocar código.

---

## Dependencias entre micro-scopes

- MS0 → MS1 → MS2 → MS3 → MS4 → MS5 → MS5a; MS2 permite MS6 → MS7; MS7 y MS5a confluyen antes de MS8 → MS9.
- MS3 puede mostrar "Crear spot: {query}" sin MS4; MS4 añade resolución para "Crear: {nombre}" y handoff (MS5/MS5a).
