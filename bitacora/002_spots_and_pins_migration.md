# Bitácora: Migración spots y pins

## Paso: Entidades core — spots y pins

**Fecha:** 2025-02-01

### Objetivo

Definir el modelo de datos mínimo para Flowya v0: lugares (spots) y la relación del usuario con ellos (pins).

### Tablas creadas

**`spots`**  
Representa un lugar físico que se puede descubrir y marcar.

| Columna            | Tipo             | Restricciones                          |
|--------------------|------------------|----------------------------------------|
| id                 | uuid             | PK, default `gen_random_uuid()`        |
| title              | text             | NOT NULL                               |
| description_short  | text             | —                                      |
| description_long   | text             | —                                      |
| latitude           | double precision | NOT NULL                               |
| longitude          | double precision | NOT NULL                               |
| cover_image_url    | text             | —                                      |
| created_at         | timestamptz      | NOT NULL, default `now()`              |
| updated_at         | timestamptz      | NOT NULL, default `now()`              |

**`pins`**  
Representa que un usuario ha marcado un spot como “por visitar” o “visitado”.

| Columna   | Tipo        | Restricciones                                    |
|-----------|-------------|--------------------------------------------------|
| id        | uuid        | PK, default `gen_random_uuid()`                  |
| spot_id   | uuid        | NOT NULL, FK → spots(id) ON DELETE CASCADE      |
| user_id   | uuid        | NOT NULL                                        |
| status    | text        | NOT NULL, CHECK IN ('to_visit', 'visited')      |
| created_at| timestamptz | NOT NULL, default `now()`                        |

### Por qué este modelo

- **spots**: Entidad central; un lugar existe una vez y puede ser pinchado por muchos usuarios. Coordenadas y textos permiten listados, mapas y detalle sin depender de auth ni storage en esta fase.
- **pins**: Relación N:1 con spots y vinculada a `user_id`. El CHECK en `status` deja explícitos los dos estados v0 y evita valores inválidos.
- **Sin FK de `user_id` a auth**: En v0 no se añaden políticas RLS ni referencias a `auth.users`; la integración con auth se hará después.

### Comportamiento al borrar

- **Borrado de un spot**: Por `ON DELETE CASCADE` en `pins.spot_id`, al eliminar un registro de `spots` se eliminan automáticamente todos los `pins` asociados. No quedan pins huérfanos.
- **Borrado de un pin**: Solo se elimina ese pin; el spot no se modifica.

### Intencionalmente no incluido (v0)

- **RLS (Row Level Security)**: Sin políticas; la seguridad por filas se añadirá cuando se integre auth.
- **Índices extra**: Solo claves primarias; índices por `spot_id`, `user_id`, etc. se añadirán según rendimiento y consultas.
- **Triggers**: Nada de `updated_at` automático ni lógica en triggers; se puede añadir después si hace falta.
- **Auth**: Sin FK de `pins.user_id` a `auth.users` ni uso de extensiones de auth en esta migración.
- **Media / storage**: Sin tablas ni buckets para imágenes; `cover_image_url` es solo una URL (externo o a definir luego).
- **Soft deletes**: Borrado físico; no columnas `deleted_at` ni lógica de borrado lógico.

### Archivo de migración

- **Creado:** `supabase/migrations/001_create_spots_and_pins.sql`
- **Otros archivos:** ninguno modificado; ninguna otra migración tocada.
