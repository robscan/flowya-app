# DATA_MODEL_CURRENT — Contrato actual (DB + migraciones)

Salida del **Prompt 4.4** (inspección Supabase/migraciones). Para que el Arquitecto redacte contratos sin suposiciones.

---

## 1) Tablas (schema público) y columnas

### `spots`
| Columna           | Tipo               | Nullable | Default |
|-------------------|--------------------|----------|---------|
| id                | uuid               | NOT NULL | gen_random_uuid() |
| title             | text               | NOT NULL | —       |
| description_short | text               | YES      | —       |
| description_long  | text               | YES      | —       |
| latitude          | double precision   | NOT NULL | —       |
| longitude         | double precision   | NOT NULL | —       |
| cover_image_url   | text               | YES      | —       |
| created_at        | timestamptz        | NOT NULL | now()   |
| updated_at        | timestamptz        | NOT NULL | now()   |
| address           | text               | YES      | —       |

### `pins`
| Columna   | Tipo        | Nullable | Default |
|-----------|-------------|----------|---------|
| id        | uuid        | NOT NULL | gen_random_uuid() |
| spot_id   | uuid        | NOT NULL | FK → spots(id) ON DELETE CASCADE |
| user_id   | uuid        | NOT NULL | —       |
| status    | text        | NOT NULL | CHECK (status IN ('to_visit', 'visited')) |
| created_at| timestamptz | NOT NULL | now()   |

### `feedback`
| Columna    | Tipo        | Nullable | Default |
|------------|-------------|----------|---------|
| id         | uuid        | NOT NULL | gen_random_uuid() |
| message    | text        | NOT NULL | —       |
| user_id    | uuid        | YES      | —       |
| user_email | text        | YES      | —       |
| url        | text        | YES      | —       |
| user_agent | text        | YES      | —       |
| created_at | timestamptz | NOT NULL | now()   |

---

## 2) Llaves, índices, constraints

- **spots:** PK `id`. Sin FK entrantes.
- **pins:** PK `id`. FK `spot_id` → `spots(id)` ON DELETE CASCADE. UNIQUE `pins_user_spot_unique` en `(user_id, spot_id)`. CHECK `status IN ('to_visit', 'visited')`.
- **feedback:** PK `id`. Sin FK.

**RLS:**
- **pins:** RLS activo. Políticas: SELECT/INSERT/UPDATE/DELETE con `auth.uid() = user_id`.
- **spots:** RLS activo. Políticas: SELECT/INSERT/UPDATE/DELETE con `true` (acceso anon/authenticated).
- **feedback:** RLS activo. Política: INSERT con `true` para anon y authenticated.

**Storage:** Bucket `spot-covers` (público). Políticas en `storage.objects`: INSERT anon/authenticated, SELECT public, UPDATE anon/authenticated.

---

## 3) Migraciones que crean/modifican spots, pins y auth-related

No hay tablas auth en migraciones (Supabase usa `auth.users` del proyecto). Spots y pins:

- **001_create_spots_and_pins.sql** — Crea `spots` y `pins` (columnas base).
- **002_add_spots_address.sql** — Añade `address` a `spots`.
- **006_pins_unique_rls.sql** — Índice único `(user_id, spot_id)` y RLS en `pins`.
- **007_pins_delete_policy.sql** — Política DELETE en `pins`.
- **008_spots_rls_select.sql** — Habilita RLS en `spots` y políticas SELECT/INSERT/UPDATE/DELETE.

*(003, 004, 005 son storage spot-covers; 009 es feedback.)*

---

## 4) Confirmación columnas solicitadas

| Necesidad        | spots | pins | Notas |
|------------------|-------|------|--------|
| address          | ✅ `address` (text) | — | 002 |
| status (to_visit/visited) | — | ✅ `status` (check) | 001 |
| owner/user_id    | ❌ no existe | ✅ `user_id` | spots sin owner; pins sí user_id |
| created_at       | ✅ | ✅ | 001 |
| updated_at       | ✅ solo spots | ❌ pins no tiene | 001 |

---

## 5) JSON resumen

```json
{
  "tables": [
    {
      "name": "spots",
      "columns": [
        {"name": "id", "type": "uuid", "nullable": false, "default": "gen_random_uuid()"},
        {"name": "title", "type": "text", "nullable": false},
        {"name": "description_short", "type": "text", "nullable": true},
        {"name": "description_long", "type": "text", "nullable": true},
        {"name": "latitude", "type": "double precision", "nullable": false},
        {"name": "longitude", "type": "double precision", "nullable": false},
        {"name": "cover_image_url", "type": "text", "nullable": true},
        {"name": "created_at", "type": "timestamptz", "nullable": false, "default": "now()"},
        {"name": "updated_at", "type": "timestamptz", "nullable": false, "default": "now()"},
        {"name": "address", "type": "text", "nullable": true}
      ],
      "constraints": ["PRIMARY KEY (id)"]
    },
    {
      "name": "pins",
      "columns": [
        {"name": "id", "type": "uuid", "nullable": false, "default": "gen_random_uuid()"},
        {"name": "spot_id", "type": "uuid", "nullable": false},
        {"name": "user_id", "type": "uuid", "nullable": false},
        {"name": "status", "type": "text", "nullable": false},
        {"name": "created_at", "type": "timestamptz", "nullable": false, "default": "now()"}
      ],
      "constraints": [
        "PRIMARY KEY (id)",
        "FOREIGN KEY (spot_id) REFERENCES spots(id) ON DELETE CASCADE",
        "UNIQUE (user_id, spot_id)",
        "CHECK (status IN ('to_visit', 'visited'))"
      ]
    },
    {
      "name": "feedback",
      "columns": [
        {"name": "id", "type": "uuid", "nullable": false, "default": "gen_random_uuid()"},
        {"name": "message", "type": "text", "nullable": false},
        {"name": "user_id", "type": "uuid", "nullable": true},
        {"name": "user_email", "type": "text", "nullable": true},
        {"name": "url", "type": "text", "nullable": true},
        {"name": "user_agent", "type": "text", "nullable": true},
        {"name": "created_at", "type": "timestamptz", "nullable": false, "default": "now()"}
      ],
      "constraints": ["PRIMARY KEY (id)"]
    }
  ],
  "migrations": [
    {"file": "001_create_spots_and_pins.sql", "purpose": "Create spots and pins tables"},
    {"file": "002_add_spots_address.sql", "purpose": "Add address to spots"},
    {"file": "003_storage_spot_covers.sql", "purpose": "Storage bucket spot-covers"},
    {"file": "004_storage_spot_covers_public.sql", "purpose": "Bucket public"},
    {"file": "005_storage_spot_covers_update.sql", "purpose": "Storage UPDATE policies"},
    {"file": "006_pins_unique_rls.sql", "purpose": "Pins unique index + RLS"},
    {"file": "007_pins_delete_policy.sql", "purpose": "Pins DELETE policy"},
    {"file": "008_spots_rls_select.sql", "purpose": "Spots RLS and policies"},
    {"file": "009_feedback_table.sql", "purpose": "Feedback table + RLS insert"}
  ],
  "gaps": [
    "spots no tiene owner/user_id (no hay columna para 'creador del spot')",
    "pins no tiene updated_at (solo created_at)"
  ]
}
```
