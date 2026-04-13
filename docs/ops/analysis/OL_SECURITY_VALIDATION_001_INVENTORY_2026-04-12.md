# OL-SECURITY-VALIDATION-001 — Inventario desde repo (2026-04-12)

**Plan:** [`PLAN_OL_SECURITY_VALIDATION_001_2026-03-28.md`](../plans/PLAN_OL_SECURITY_VALIDATION_001_2026-03-28.md)  
**Estado:** **cerrado (2026-04-12)** — inventario + validación remota H1–H4; evidencia de cierre: bitácora [`353`](../../bitacora/2026/04/353-ol-security-validation-001-cierre.md).  
**SV-02:** migraciones críticas confirmadas en instancia remota (orden y aplicación) — ver § Validación.

---

## SV-02 Migraciones críticas (archivos en repo)

En el proyecto Supabase objetivo están aplicadas **en orden** (sin saltos), según validación 2026-04-12:

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
- **Hard delete cliente:** [`018_spots_block_client_hard_delete.sql`](../../../supabase/migrations/018_spots_block_client_hard_delete.sql) revoca `DELETE` en tabla para `anon`/`authenticated`. La eliminación en producto se alinea con **soft delete** (`hide_spot`, `is_hidden`). Validación remota H2: comportamiento coherente con política (sin delete directo como camino feliz).

### `pins`

- RLS por usuario: SELECT/INSERT/UPDATE solo `auth.uid() = user_id` ([`006_pins_unique_rls.sql`](../../../supabase/migrations/006_pins_unique_rls.sql)).
- **DELETE:** policy [`007_pins_delete_policy.sql`](../../../supabase/migrations/007_pins_delete_policy.sql) — “pins DELETE own” (solo propias filas).

### `feedback`

- [`009_feedback_table.sql`](../../../supabase/migrations/009_feedback_table.sql): `INSERT` permitido a `anon` y `authenticated` con `WITH CHECK (true)` — coherente con envío desde API serverless / cliente sin sesión fuerte.
- No hay policy de `SELECT` en el archivo: con RLS activo, lectura típica desde cliente **denegada** salvo otras policies (confirmado en remoto, H4).

### `user_tags` / `pin_tags`

- Owner-only en todas las operaciones definidas ([`020_user_tags_pin_tags.sql`](../../../supabase/migrations/020_user_tags_pin_tags.sql)).
- `pin_tags` **INSERT** exige coherencia `spots.user_id` y `user_tags` del mismo usuario.
- **UPDATE** en `pin_tags`: no hay policy `UPDATE` en migración 020 (solo select/insert/delete). **H3 validado:** modelo sin updates — cambios vía delete + insert.

### `spot_images`

- [`024_spot_images.sql`](../../../supabase/migrations/024_spot_images.sql): SELECT amplio; escrituras owner al spot (`spots.user_id`).

### Storage `spot-covers`

- Políticas owner y galería: [`022_storage_spot_covers_owner_write_guardrails.sql`](../../../supabase/migrations/022_storage_spot_covers_owner_write_guardrails.sql), [`025_storage_spot_gallery_owner.sql`](../../../supabase/migrations/025_storage_spot_gallery_owner.sql).

---

## SV-03 Runtime (seguimiento continuo)

- Mutaciones spots/pins/tags deben usar cliente Supabase con sesión; errores RLS no deben presentarse como éxito (revisar manejo de error en flujos save/visited/delete pin en futuros PR).
- **Delete real de spots:** el cliente no debe usar `DELETE` de fila como flujo principal; vigilar en revisiones de código.

---

## SV-04 Privacidad / geolocalización (revisión estática 2026-04-12)

- **`userCoords` en app:** uso en [`MapScreenVNext`](../../../components/explorar/MapScreenVNext.tsx) y `useMapCore` para UX (distancias, orden, mapa); **no** aparece en [`sendFeedback`](../../../lib/send-feedback.ts) ni en payload típico a `/api/feedback` (mensaje, url, user_id, email, user_agent).
- Alineado con [`OL-PRIVACY-001`](../../bitacora/2026/04/350-ol-privacy-001-politica-y-ruta-privacidad.md) y plan de privacidad.

---

## SV-05 Analytics / métricas futuras

- Sin instrumentación de analytics de terceros en cliente hoy. Cuando se aborde [`OL-METRICS-001`](../plans/OL_METRICS_001_PROYECTO_METRICAS_TELEMETRIA.md), aplicar lista blanca de campos (sin PII ni coordenadas exactas como criterio de diseño).

---

## Hallazgos H1–H4 — validación remota (2026-04-12)

Validación manual en Supabase / comportamiento acordado con el producto; orden aplicado según plan.

| ID | Tema | Severidad | Resultado |
|----|------|-----------|-----------|
| H1 | Orden y estado de migraciones SV-02 en remoto | Media | **OK** — migraciones críticas aplicadas en orden. |
| H2 | `DELETE` en `spots` tras `REVOKE` + owner policies | Media | **OK** — soft delete vía `hide_spot`; sin delete directo como camino operativo. |
| H3 | Sin policy `UPDATE` en `pin_tags` (020) | Baja | **OK** — intencional; cambios por delete + insert. |
| H4 | `feedback` INSERT abierto a `anon` | Informativa | **Aceptado** — diseño MVP; abuso vía rate limit/API fuera de alcance de este OL. |

---

## Referencias

- Contrato auth: [`PROFILE_AUTH_CONTRACT_CURRENT.md`](../../contracts/PROFILE_AUTH_CONTRACT_CURRENT.md)
- Privacidad: [`PLAN_OL_PRIVACY_001_2026-03-10.md`](../plans/PLAN_OL_PRIVACY_001_2026-03-10.md)
- Trazabilidad (PR #140, bitácoras 350–352): [`352`](../../bitacora/2026/04/352-indice-trazabilidad-pr-140-ol-privacy-ol-security-2026-04.md)
- Cierre OL: [`353`](../../bitacora/2026/04/353-ol-security-validation-001-cierre.md)
