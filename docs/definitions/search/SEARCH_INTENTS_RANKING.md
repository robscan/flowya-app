# Search (Flowya) — Intents + Taxonomía + Ranking (v0)

**Propósito:** Fuente de verdad para diseñar/implementar Search como sistema portable (como Map Core).

---

## Intents (qué quiere hacer el usuario)

1. **Open-existing**: abrir un spot ya existente (interno).
2. **Go-to-place**: encontrar un lugar global (POI/landmark/place).
3. **Explore-nearby**: categorías/POIs cerca del viewport.
4. **Create-from-place**: crear spot desde un resultado con coords (selección explícita).
5. **Create-new (UGC)**: crear spot nuevo en el mapa (centro del mapa / ubicación).

---

## Taxonomía de resultados

- Internos: `spot_saved`, `spot_visited`, `spot_recent`, `spot_match`
- Externos: `poi_landmark`, `poi`, `place`, `address`, `street`
- Acciones: `action_create_new_spot`, `action_create_from_place`

---

## Ranking v0 (sin IA)

Secciones:

1. Tus spots
2. Lugares (Landmarks/POI)
3. Ciudades y regiones
4. Direcciones y calles

Reglas:

- Etiquetar tipo + ciudad/país siempre en externos.
- Streets nunca deben ganar sobre POI/landmark si hay candidatos.
- Dedupe: si interno y externo representan lo mismo (place_id), gana interno.

---

## Estados UX del buscador

- Vacío (sin query)
- Escribiendo / predictivo
- Resultados
- Sin resultados → aplicar chooser (contrato `SEARCH_NO_RESULTS_CREATE_CHOOSER`)
- Error/offline (degrada a internos + crear nuevo)
