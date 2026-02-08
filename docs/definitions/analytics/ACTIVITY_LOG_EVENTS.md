# Activity Log — Eventos para analítica e IA futura (v0.1)

**Fecha:** 2026-02-07  
**Objetivo:** Instrumentar lo mínimo para aprender y luego habilitar recomendaciones + flows.

---

## 1) Tabla sugerida: `activity_events`
Campos:
- `id` uuid
- `user_id`
- `event_name` (string)
- `ts` timestamptz
- `context` jsonb (payload)

---

## 2) Eventos mínimos (Explore)

### Search
- `search_opened`
- `search_query_changed` { query_len, has_results }
- `search_result_selected` { kind: place|spot, place_id?, spot_id? }
- `search_create_tapped` { query }

### Map
- `map_long_press_create` { lat, lng }
- `map_tap_exit_search` {}

### Create
- `create_opened` { entrypoint, default_status }
- `create_status_changed` { to }
- `create_saved` { status, has_note, photos_count, has_place_id }
- `create_cancelled` {}

### Spots
- `spot_opened` { spot_id }
- `spot_marked_visited` { spot_id }
- `spot_note_added` { spot_id, length }

---

## 3) Para IA futura (ejemplos de señales)
- Zonas donde el usuario guarda muchos “to_visit”
- Categorías favoritas
- Conversión to_visit → visited
- Temporadas/horarios de visita (si `visited_at` existe)

