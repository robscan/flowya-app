# 396 — Cleanup no destructivo de spots duplicados exactos

Fecha: 2026-04-27

## Contexto

Tras el incidente de `Plaza Principal` en Holbox, se cerró el bug en dos capas:

- guard runtime contra persistencias concurrentes del mismo POI;
- cleanup remoto no destructivo de filas ya duplicadas.

## Precheck remoto

Consulta SQL linked identificó 3 grupos visibles duplicados por fingerprint exacto:

- `Plaza Principal` (`linked_place_id=2027633701`): 6 filas.
- `Kerpen` (`linked_place_id=2401071700`): 2 filas.
- `Düsseldorf` (`linked_place_id=2401267530`): 2 filas.

Otros `linked_place_id` repetidos existen, pero no se tocaron porque no comparten fingerprint exacto o tienen ambigüedad semántica histórica (`München/Múnich`, país/ciudad, etc.).

## Migración aplicada

Archivo:

- `supabase/migrations/039_spots_linked_exact_duplicate_cleanup.sql`

Aplicación:

- ejecutada puntualmente con `supabase db query --linked -f`;
- no se usó `supabase db push`, porque el dry-run indicaba que intentaría empujar todas las migraciones históricas.

Efecto:

- crea backup `public.spots_linked_exact_dedupe_039_backup`;
- elige canónico por mayor cantidad de relaciones y antigüedad;
- fusiona `pins` preservando `visited` sobre `saved`;
- mueve `pin_tags`, `spot_images` y `spot_personal_images` al canónico;
- oculta duplicados con `is_hidden=true`;
- no hace hard delete de `spots`;
- crea índice único parcial `spots_visible_linked_exact_unique_039` para impedir futuros duplicados exactos visibles.

## Postcheck

- Duplicados exactos visibles: `0`.
- `Plaza Principal` visible: 1 fila (`b5ff9a10-d857-4fa4-b7bc-404f330bcefb`).
- Índice `spots_visible_linked_exact_unique_039`: creado.
- Inventario REST visible post-cleanup: `exactDuplicateGroups=0`.

## Notas operativas

Dos consultas paralelas de postcheck con Supabase CLI saturaron el temp login y devolvieron circuit breaker. Se completó la verificación restante por REST anónimo para evitar seguir golpeando el login temporal.

## Rollback

No hay rollback automático ejecutado. La migración conserva snapshots en `spots_linked_exact_dedupe_039_backup`. Si se requiere rollback:

- retirar el índice parcial;
- restaurar duplicados desde backup;
- rehidratar relaciones desde snapshots respaldados.
