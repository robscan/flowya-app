# MAPBOX_PLACE_ENRICHMENT — Contrato (datos Mapbox al crear spot)

**Fuentes de verdad:** docs/ops/*, docs/contracts/*. Define qué se **importa** de Mapbox en la creación mínima de spot y qué no.

---

## 1) Campos que SÍ se importan (creación mínima)

- **mapbox_place_id** — Identificador del lugar en Mapbox (para trazabilidad y desduplicación).
- **name** — Nombre del lugar.
- **lat / lng** — Coordenadas.
- **address** — Snapshot de dirección (reverse geocode **una vez** al crear; no se re-sincroniza).
- **country, region, city, postcode** — Si están disponibles en la respuesta Mapbox, se guardan como snapshot.

---

## 2) maki como sugerencia y señal futura

- **maki** (icono/poi type de Mapbox) se usa como **suggested_category**.
  - No es "verdad" obligatoria: el usuario puede ignorar o cambiar.
  - Sirve como **input futuro** para categorías internas (taxonomía) cuando existan.
- **OPEN LOOP:** Categorías internas (taxonomy) aún no existen en el producto; maki queda documentado como señal para cuando se implementen (OL-023).

---

## 2.1 Spot linking metadata (Fase A)

Cuando el sistema evalúa enlace spot↔POI/Landmark (por ejemplo al guardar nueva ubicación), se persisten campos operativos en `spots`:

- `link_status`: `linked | uncertain | unlinked`
- `link_score`: score numérico de confianza (si existe)
- `linked_place_id`: id externo del lugar enlazado
- `linked_place_kind`: `poi | landmark`
- `linked_maki`: maki detectado/enlazado
- `linked_at`: timestamp del enlace
- `link_version`: versión del algoritmo

Regla de seguridad:

- `uncertain` no debe tratarse como `linked` para ocultamiento automático.
- Si falla resolución de enlace, el guardado de ubicación no se bloquea; fallback seguro = `unlinked`.

---

## 3) Campos que NO se importan por ahora

No se importan datos "vivos" o poco fiables para la creación mínima:

- Horarios de apertura.
- Teléfono (si viene de Mapbox; el usuario puede introducirlo en edición).
- Ratings, reviews.
- accepts_apple_pay y atributos similares.
- Cualquier otro campo no listado en la sección 1 o 2.

_Razón: mantener creación simple y evitar dependencia de datos que cambian o no están verificados._
