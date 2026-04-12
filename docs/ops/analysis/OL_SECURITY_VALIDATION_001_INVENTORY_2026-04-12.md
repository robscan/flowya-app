# OL-SECURITY-VALIDATION-001 — Inventario desde repo (2026-04-12)

**Plan:** [`PLAN_OL_SECURITY_VALIDATION_001_2026-03-28.md`](../plans/PLAN_OL_SECURITY_VALIDATION_001_2026-03-28.md)  
**Estado:** trabajo en curso — este documento cumple **BT-SEC-01**, **BT-SEC-02** y base de **BT-SEC-06** (hallazgos iniciales).  
**Remoto:** las comprobaciones en la instancia Supabase (policies efectivas = migraciones aplicadas en orden) son **SV-02** manual; marcar cada ítem al validar.

---

## SV-02 Migraciones críticas (archivos en repo)

Confirmar en el proyecto Supabase objetivo que existen y están aplicadas **en orden** (sin saltos):

| Migración | Propósito breve |
|-----------|-----------------|
| [`018_spots_block_client_hard_delete.sql`](../../../supabase/migrations/018_spots_block_client_hard_delete.sql) | Quita deletes amplios; `REVOKE DELETE` sobre `spots` para `anon`/`authenticated`. |
| [`018_spots_owner_write_guardrails.sql`](../../../supabase/migrations/018_spots_owner_write_guardrails.sql) | Writes en `spots` solo owner; `hide_spot` con comprobación de ownership. |
| [`020_user_tags_pin_tags.sql`](../../../supabase/migrations/020_user_tags_pin_tags.sql) | Tablas `user_tags` / `pin_tags` + RLS owner. |
| [`021_user_tags_set_user_id_trigger.sql`](../../../supabase/migrations/021_user_tags_set_user_id_trigger.sql) | Trigger `user_tags` rellena `user_id` desde `auth.uid()`. |

**Otras relevantes para superficie actual:** `024_spot_images.sql`, `025_storage_spot_gallery_owner.sql`, `022_storage_spot_covers_owner_write_guardrails.sql` (Storage `spot-covers`).

---

## SV-01 Políticas RLS (estado deducido del **último** cambio por tabla en migraciones)

### `spots`

- **SELECT:** pública para lectura de filas (p. ej. [`008_spots_rls_select.sql`](../../../supabase/migrations/008_spots_rls_select.sql) — `spots_select_all`); encajar con producto “mapa descubre spots”.
- **INSERT / UPDATE / DELETE:** tras [`018_spots_owner_write_guardrails.sql`](../../../supabase/migrations/018_spots_owner_write_guardrails.sql), políticas owner `user_id = auth.uid()` para roles autenticados; políticas permisivas antiguas eliminadas en bloque.
- **Hard delete cliente:** [`018_spots_block_client_hard_delete.sql`](../../../supabase/migrations/018_spots_block_client_hard_delete.sql) revoca `DELETE` en tabla para `anon`/`authenticated`. La eliminación en producto debe alinearse con **soft delete** (`hide_spot`, `is_hidden`). **Validar en remoto** si el `DELETE` directo está imposibilitado (objetivo) y si la policy `spots_delete_authenticated_owner` es alcanzable o queda redundante según privilegios.

### `pins`

- RLS por usuario: SELECT/INSERT/UPDATE solo `auth.uid() = user_id` ([`006_pins_unique_rls.sql`](../../../supabase/migrations/006_pins_unique_rls.sql)).
- **DELETE:** policy [`007_pins_delete_policy.sql`](../../../supabase/migrations/007_pins_delete_policy.sql) — “pins DELETE own” (solo propias filas).

### `feedback`

- [`009_feedback_table.sql`](../../../supabase/migrations/009_feedback_table.sql): `INSERT` permitido a `anon` y `authenticated` con `WITH CHECK (true)` — coherente con envío desde API serverless / cliente sin sesión fuerte.
- No hay policy de `SELECT` en el archivo: con RLS activo, lectura típica desde cliente **denegada** salvo otras policies (confirmar en remoto).

### `user_tags` / `pin_tags`

- Owner-only en todas las operaciones definidas ([`020_user_tags_pin_tags.sql`](../../../supabase/migrations/020_user_tags_pin_tags.sql)).
- `pin_tags` **INSERT** exige coherencia `spots.user_id` y `user_tags` del mismo usuario.
- **UPDATE** en `pin_tags`: no hay policy `UPDATE` en migración 020 (solo select/insert/delete); confirmar si es intencional (sin updates) o hay migración posterior.

### `spot_images`

- [`024_spot_images.sql`](../../../supabase/migrations/024_spot_images.sql): SELECT amplio; escrituras owner al spot (`spots.user_id`).

### Storage `spot-covers`

- Políticas owner y galería: [`022_storage_spot_covers_owner_write_guardrails.sql`](../../../supabase/migrations/022_storage_spot_covers_owner_write_guardrails.sql), [`025_storage_spot_gallery_owner.sql`](../../../supabase/migrations/025_storage_spot_gallery_owner.sql).

---

## SV-03 Runtime (punteros; QA manual / auditoría de código)

- Mutaciones spots/pins/tags deben usar cliente Supabase con sesión; errores RLS no deben presentarse como éxito (revisar manejo de error en flujos save/visited/delete pin).
- **Delete real de spots:** no debe ser el camino feliz del cliente si `REVOKE DELETE` + soft delete es la norma.

---

## SV-04 Privacidad / geolocalización (revisión estática 2026-04-12)

- **`userCoords` en app:** uso en [`MapScreenVNext`](../../../components/explorar/MapScreenVNext.tsx) y `useMapCore` para UX (distancias, orden, mapa); **no** aparece en [`sendFeedback`](../../../lib/send-feedback.ts) ni en payload típico a `/api/feedback` (mensaje, url, user_id, email, user_agent).
- Alineado con [`OL-PRIVACY-001`](../../bitacora/2026/04/350-ol-privacy-001-politica-y-ruta-privacidad.md) y plan de privacidad.

---

## SV-05 Analytics / métricas futuras

- Sin instrumentación de analytics de terceros en cliente hoy. Cuando se aborde [`OL-METRICS-001`](../plans/OL_METRICS_001_PROYECTO_METRICAS_TELEMETRIA.md), aplicar lista blanca de campos (sin PII ni coordenadas exactas como criterio de diseño).

---

## Hallazgos / follow-ups (viva voce)

| ID | Tema | Severidad | Acción |
|----|------|-----------|--------|
| H1 | Confirmar en **Supabase remoto** orden y estado de migraciones SV-02 | Media | Checklist SQL / Dashboard |
| H2 | Comportamiento efectivo de **DELETE** en `spots` tras `REVOKE` + policies owner | Media | Prueba: intento delete fila vs `hide_spot` |
| H3 | Policy **UPDATE** en `pin_tags` ausente en migración 020 | Baja | Confirmar si mutación solo por delete+insert |
| H4 | **feedback** insert abierto a anon | Informativa | Aceptado por diseño MVP; vigilar abuso vía API/rate limit fuera de alcance de este doc |

---

## Referencias

- Contrato auth: [`PROFILE_AUTH_CONTRACT_CURRENT.md`](../../contracts/PROFILE_AUTH_CONTRACT_CURRENT.md)
- Privacidad: [`PLAN_OL_PRIVACY_001_2026-03-10.md`](../plans/PLAN_OL_PRIVACY_001_2026-03-10.md)
