# DATA_MODEL_CURRENT

**Estado:** CURRENT (verificado por introspección SQL)
**Última verificación:** 2026-02-08
**Fuente de verdad:** `docs/definitions/contracts/DATA_MODEL_CURRENT.md`

## Evidencia (SQL introspección — Supabase SQL Editor)

Se obtuvo metadata desde `information_schema` (solo lectura):

1. **Columnas por tabla (`public`)** para `spots`, `pins`, `feedback`:

- `information_schema.columns` (table_name in 'spots','pins','feedback')

2. **Constraints (PK/FK/CHECK)**:

- `information_schema.table_constraints` + `key_column_usage` + `constraint_column_usage`

> Nota: los constraints tipo `*_not_null` aparecen como `CHECK` sin `column_name` en este output; el NOT NULL real se confirma en `information_schema.columns.is_nullable`.

---

## 1) Tablas (public) — CURRENT

### 1.1 `spots`

**PK**

- `id` (uuid, NOT NULL, default `gen_random_uuid()`)

**Campos**

- `title` (text, NOT NULL)
- `description_short` (text, NULL)
- `description_long` (text, NULL)
- `latitude` (double precision, NOT NULL)
- `longitude` (double precision, NOT NULL)
- `cover_image_url` (text, NULL)
- `created_at` (timestamptz, NOT NULL, default `now()`)
- `updated_at` (timestamptz, NOT NULL, default `now()`)
- `address` (text, NULL)

**Constraints**

- PRIMARY KEY: `spots_pkey` (`id`)
- CHECK (not null internos): presentes (ver “Evidencia”)

**Notas operativas**

- `updated_at` default `now()` existe; si se requiere “auto-update” en updates, eso depende de triggers (no verificado aquí).

---

### 1.2 `pins`

**PK**

- `id` (uuid, NOT NULL, default `gen_random_uuid()`)

**Campos**

- `spot_id` (uuid, NOT NULL)
- `user_id` (uuid, NOT NULL)
- `status` (text, NOT NULL)
- `created_at` (timestamptz, NOT NULL, default `now()`)

**Constraints**

- PRIMARY KEY: `pins_pkey` (`id`)
- FOREIGN KEY: `pins_spot_id_fkey` (`spot_id` → `spots.id`)
- CHECK: `pins_status_check` (sobre `status`)
  - **OPEN LOOP (contract detail):** valores permitidos del enum/check no extraídos en este output.

---

### 1.3 `feedback`

**PK**

- `id` (uuid, NOT NULL, default `gen_random_uuid()`)

**Campos**

- `message` (text, NOT NULL)
- `user_id` (uuid, NULL)
- `user_email` (text, NULL)
- `url` (text, NULL)
- `user_agent` (text, NULL)
- `created_at` (timestamptz, NOT NULL, default `now()`)

**Constraints**

- PRIMARY KEY: `feedback_pkey` (`id`)

---

## 2) Relaciones — CURRENT

- `pins.spot_id` → `spots.id` (FK)
- No se observan FKs desde `pins.user_id` o `feedback.user_id` en el output provisto (posible intención, no verificado).

---

## 3) Reglas/decisiones operativas (estado)

- Unicidad “nombre + proximidad”: **NO verificado** (no aparece como UNIQUE/INDEX aquí).
- Hard delete real vs soft delete: **NO verificado** (no hay columnas tipo `deleted_at` en estas 3 tablas; pero no prueba nada por sí solo).
- Slugs/IDs compartibles: **NO verificado**.

> Todo lo anterior se considerará **OPEN LOOP** hasta que exista evidencia (migraciones/índices/decisión en ops).

---

## 4) Open Loops derivados (mínimos, no bloquear)

- Definir `pins_status_check`: valores permitidos y semántica (P1).
- Confirmar si debe existir relación/owner con `auth.users` (`user_id` FKs o RLS policies) (P1).

---

## Referencias (ops)

- `docs/ops/SYSTEM_MAP.md`
- `docs/ops/DECISIONS.md`
- `docs/ops/GUARDRAILS.md`
