# GEO_IDENTITY_DEDUP_V1

**Estado:** CANONICO / CONTRATO V1 PROPUESTO
**Fecha:** 2026-04-28
**Relacion:** `OL-DATA-MODEL-INTROSPECTION-001`, `OL-GEO-CANON-001`, [`DATA_MODEL_CURRENT.md`](DATA_MODEL_CURRENT.md), [`SEARCH_V2.md`](SEARCH_V2.md), [`MAP_FRAMING_UX.md`](MAP_FRAMING_UX.md), [`SPOT_SHEET_CONTENT_RULES.md`](SPOT_SHEET_CONTENT_RULES.md)

---

## 1. Problema que resuelve

FLOWYA ya corrigio duplicados exactos de POI, pero el riesgo estructural sigue abierto: un pais, region o ciudad puede entrar al sistema como si fuera `spot` o como texto libre derivado de busqueda/direccion.

Eso rompe tres objetivos V1:

1. Search no puede saber si debe abrir una ficha geo o un SpotSheet.
2. GeoSheets robustas no pueden crecer si la identidad territorial vive en `spots.address`, `city_name` o resultados temporales de proveedor.
3. Guardar un pais/ciudad/region puede duplicar objetos en vez de reutilizar una entidad oficial.

Decision: **paises, regiones, ciudades y zonas no son `spots`.**

---

## 2. Principios

- `spots` representa lugares puntuales o POI visitables/guardables: landmarks, restaurantes, hoteles, museos, playas, parques, negocios, direcciones o lugares creados por el usuario.
- `geo_*` representa entidades territoriales oficiales o curadas: paises, regiones, ciudades y zonas.
- Search debe enrutar por tipo de entidad antes de persistir.
- La direccion postal describe un spot; no define identidad geo.
- Los codigos ISO/region y nombres de ciudad son datos derivados/cacheables, no fuente unica de verdad.
- Todo dato critico territorial debe tener `source`, `source_updated_at` y estrategia de frescura cuando salga de datos estables.
- El usuario guarda su relacion con una entidad; no crea otra entidad si la entidad ya existe.

---

## 3. Modelo mental producto

Jerarquia canonica V1:

```text
Pais
  Region / estado / provincia
    Ciudad
      Zona / barrio / area
        Spot / POI / direccion
```

Regla UX:

- Tap/search de pais -> `GeoSheet(country)`.
- Tap/search de region -> `GeoSheet(region)`.
- Tap/search de ciudad -> `GeoSheet(city)`.
- Tap/search de zona -> `GeoSheet(area)` si existe; si no, puede abrir contexto ciudad con filtro de zona.
- Tap/search de spot/POI -> `SpotSheet`.

La profundidad debe usar progressive disclosure. El usuario siempre debe poder volver al nivel anterior, cerrar la sheet o cambiar de dominio sin perder control.

---

## 4. Entidades canonicas

### `geo_countries`

Fuente oficial de pais.

Campos conceptuales:

- `id`
- `iso2` unico
- `iso3` unico opcional
- `name_es`
- `name_en`
- `slug`
- `centroid_latitude`
- `centroid_longitude`
- `bbox`
- `source`
- `source_updated_at`
- `is_active`
- `created_at`
- `updated_at`

Identidad minima:

- `iso2` es la llave natural primaria V1.
- `slug` sirve para rutas/UI, no para identidad fuerte.

### `geo_regions`

Fuente de estado/provincia/region administrativa.

Campos conceptuales:

- `id`
- `country_id`
- `region_code` (`ISO 3166-2` cuando exista; si no, codigo curado Flowya)
- `name_es`
- `name_en`
- `slug`
- `region_type`
- `centroid_latitude`
- `centroid_longitude`
- `bbox`
- `source`
- `source_updated_at`
- `is_active`

Identidad minima:

- unico por `(country_id, region_code)` cuando haya codigo estable.
- fallback curado por `(country_id, normalized_name, region_type)` solo durante seed/control editorial.

### `geo_cities`

Fuente de ciudad/localidad.

Campos conceptuales:

- `id`
- `country_id`
- `region_id` nullable
- `official_name`
- `name_es`
- `name_en`
- `slug`
- `city_type`
- `centroid_latitude`
- `centroid_longitude`
- `bbox`
- `population_bucket` opcional
- `source`
- `source_updated_at`
- `is_active`

Identidad minima:

- preferir external refs estables (`wikidata`, `geonames`, `osm`) cuando existan.
- fallback curado por `(country_id, region_id, normalized_name)`.
- no deduplicar ciudades solo por nombre global: `Merida`, `San Jose` o `Santa Cruz` no son unicos en el mundo.

### `geo_areas`

Fuente opcional para barrios, zonas turisticas, islas, distritos o areas no administrativas.

Campos conceptuales:

- `id`
- `country_id`
- `region_id` nullable
- `city_id` nullable
- `official_name`
- `name_es`
- `name_en`
- `slug`
- `area_type`
- `centroid_latitude`
- `centroid_longitude`
- `bbox`
- `source`
- `source_updated_at`
- `is_active`

Regla:

- V1 puede diferir `geo_areas` si pais/region/ciudad son suficientes.
- No usar `spots` para representar una zona solo porque aun no existe `geo_areas`.

---

## 5. Aliases y referencias externas

### `geo_aliases`

Permite busqueda multidioma y nombres alternativos sin duplicar entidades.

Campos conceptuales:

- `id`
- `entity_type` (`country|region|city|area`)
- `entity_id`
- `locale`
- `name`
- `normalized_name`
- `source`
- `is_primary`

Reglas:

- `Mexico`, `Mexico`, `Mexique`, `MX` apuntan al mismo pais.
- Aliases no cambian identidad; solo recuperacion y display.
- Un alias ambiguo debe resolverse con contexto o mostrar opciones.

### `geo_external_refs`

Conecta entidades Flowya con proveedores sin volverlos fuente unica.

Campos conceptuales:

- `id`
- `entity_type`
- `entity_id`
- `provider` (`iso|wikidata|geonames|osm|mapbox|flowya`)
- `provider_ref`
- `provider_kind`
- `confidence`
- `source_updated_at`

Reglas:

- unico por `(provider, provider_ref, entity_type)`.
- Mapbox puede ayudar a resolver, pero no debe ser el unico canon para pais/ciudad.
- IDs sinteticos de fallback no se persisten como referencia fuerte.

---

## 6. Relacion usuario-entidad

`pins` es para relacion usuario-spot. No debe usarse para paises/ciudades/regiones.

Entidad futura:

### `user_geo_marks`

Campos conceptuales:

- `id`
- `user_id`
- `entity_type` (`country|region|city|area`)
- `entity_id`
- `saved`
- `visited`
- `created_at`
- `updated_at`

Reglas:

- unico por `(user_id, entity_type, entity_id)`.
- estados exclusivos como en pins: `visited=true` implica `saved=false`.
- guardar un pais existente hace upsert de `user_geo_marks`; no crea otro pais.
- Passport calcula progreso geo desde `user_geo_marks` + spots/pins resueltos, no desde strings libres.

---

## 7. Relacion spot-geo

`spots` puede enlazar al contexto territorial, pero no debe convertirse en tabla territorial.

Campos recomendados para migracion futura:

- `coordinate_source`
- `created_from`
- `geo_country_id`
- `geo_region_id`
- `geo_city_id`
- `geo_area_id` opcional
- `geo_resolution_status`
- `geo_resolved_at`

Campos candidatos anteriores:

- `country_code`
- `region_code`
- `city_name`

Decision V1:

- `coordinate_source` y `created_from` si son campos validos para `spots`.
- `country_code`, `region_code` y `city_name` no deben ser fuente de verdad.
- Si se agregan por performance/compatibilidad, deben tratarse como cache derivado desde `geo_*`, nunca como identidad primaria ni input manual libre.

Checks sugeridos:

- `coordinate_source`: `map_tap|search_result|edit_manual|photo_exif|import|unknown`
- `created_from`: `map|search|poi|photo|manual|import|unknown`
- `geo_resolution_status`: `resolved|unresolved|ambiguous|manual_review`

---

## 8. Direccion de spot

La direccion debe separarse de identidad geo.

V1 puede mantener:

- `spots.address` como display legacy.

Futuro recomendado:

- `spot_address_snapshots`
  - `spot_id`
  - `display_address`
  - `street`
  - `locality`
  - `region`
  - `postal_code`
  - `country_code`
  - `provider`
  - `provider_ref`
  - `captured_at`

Reglas:

- Una direccion puede ayudar a resolver ciudad/region, pero no manda sobre `geo_*`.
- Cambiar direccion no debe duplicar spot ni geo.
- Direcciones incompletas no bloquean guardar un spot puntual si las coordenadas son validas.

---

## 9. Idempotencia de Search y guardado

### Pais/region/ciudad/zona

Al seleccionar una entidad geo:

1. Resolver por `geo_external_refs`.
2. Si no hay ref, resolver por llave natural (`iso2`, `country_id + region_code`, `country_id + region_id + normalized_name`).
3. Si hay match unico, abrir `GeoSheet`.
4. Si el usuario guarda/visita, hacer upsert en `user_geo_marks`.
5. Si hay ambiguedad, mostrar opciones; no crear entidad silenciosamente.

Prohibido:

- crear `spot` para pais, region o ciudad;
- crear entidad geo desde texto libre sin seleccion o seed controlado;
- usar el primer resultado de proveedor como verdad sin confirmacion.

### Spot/POI/landmark

Al seleccionar un POI:

1. Si `linked_place_id` coincide con spot visible/no oculto, reutilizar spot.
2. Si no coincide, intentar dedupe por nombre normalizado + proximidad + tipo.
3. Si hay match unico, reutilizar spot.
4. Si no hay match, crear spot con `created_from` y `coordinate_source`.
5. Crear/actualizar `pins` por upsert de usuario, no duplicar spot por doble tap.

Guardrails:

- filtros visuales no reducen el universo de dedupe.
- acciones concurrentes del mismo POI deben compartir lock/guard runtime.
- no hard delete para resolver duplicados; usar soft-hide/merge auditado.

---

## 10. Search global V1

Search debe actuar como router de intencion.

Orden conceptual:

1. Entidades geo oficiales/curadas.
2. Spots internos.
3. POI externos seleccionables.
4. Crear spot aqui, sin resolver texto.

Reglas:

- Query de pais/ciudad no debe terminar en spot por accidente.
- Resultados geo y spots deben tener secciones/labels distinguibles.
- Si una query es ambigua (`Georgia`, `Merida`, `San Jose`), mostrar opciones con contexto.
- Search no debe guardar nada hasta seleccion explicita.
- No registrar query cruda como telemetria personal.

---

## 11. Migracion por fases

### Fase A — Contrato y prechecks

- Este documento.
- SQL de introspeccion especifico para detectar geo como spots: [`GEO_IDENTITY_PREMIGRATION_DIAGNOSTIC_2026-04-28.sql`](../ops/GEO_IDENTITY_PREMIGRATION_DIAGNOSTIC_2026-04-28.sql).
- Lista de casos semilla: Mexico, Quintana Roo, Holbox, Merida, San Jose, Georgia.

Plan de migraciones futuras: [`PLAN_GEO_CANON_MIGRATIONS_V1_2026-04-28.md`](../ops/plans/PLAN_GEO_CANON_MIGRATIONS_V1_2026-04-28.md).

### Fase B — Tablas geo base

- crear `geo_countries`, `geo_regions`, `geo_cities`;
- crear `geo_aliases`, `geo_external_refs`;
- crear constraints unicas;
- seed inicial pequeno y reproducible.

### Fase C — Enlaces spot-geo

- agregar `coordinate_source`, `created_from`;
- agregar FKs `geo_*_id` o tabla relacionada si se decide no tocar `spots`;
- backfill no destructivo desde proveedor/curacion;
- marcar ambiguos para revision.

### Fase D — Search router

- resultados geo primero;
- seleccionar geo abre `GeoSheet`;
- guardar geo escribe `user_geo_marks`;
- POI sigue usando SpotSheet.

### Fase E — Deprecacion

- retirar dependencia de `country_code/region_code/city_name` como canon si existio cache temporal;
- migrar pantallas/listas a `geo_*`;
- dejar auditoria de spots que representan geo y decidir merge/soft-hide manual.

---

## 12. Riesgos

- Sobrediseno: crear demasiadas tablas antes de necesitar UI. Mitigacion: Fase B seed minimo.
- Ambiguedad internacional: nombres repetidos. Mitigacion: contexto + refs externas.
- Costo API: resolver todo en tiempo real. Mitigacion: batch/seed primero.
- Privacidad: inferir viajes del usuario por geo sin control. Mitigacion: `user_geo_marks` owner-only.
- Deuda cache: `country_code/city_name` divergen. Mitigacion: cache derivado, no editable.

---

## 13. Pruebas y verificacion futura

SQL:

- no duplicados en `geo_countries.iso2`;
- no duplicados en `geo_regions(country_id, region_code)`;
- no duplicados en refs externas;
- conteo de spots cuyo `linked_place_kind` parezca pais/region/ciudad;
- conteo de `spots` con nombres iguales a geo canonica.

Runtime:

- guardar Mexico dos veces no crea dos paises;
- guardar Holbox dos veces crea/actualiza una marca de usuario;
- seleccionar Plaza Principal reutiliza spot si ya existe;
- crear spot desde texto libre no resuelve geocoding silencioso;
- `Merida` muestra contexto suficiente para escoger.

QA UX:

- usuario sabe si esta viendo pais, ciudad o spot;
- back/cerrar funciona;
- mapa tiene una intencion dominante;
- empty states no empujan creacion accidental.

---

## 14. Rollback

Para este contrato documental:

- revertir el PR.

Para migraciones futuras:

- deben ser aditivas;
- deben crear backup si hacen backfill;
- deben tener rollback o mitigacion documentada;
- no deben hacer hard delete;
- no deben borrar Storage;
- RLS debe verificarse antes de merge.
