# FLOWYA — Prompt de Retoma Operativa 2026-04-27

Usar este prompt al abrir un nuevo chat para retomar el estado específico posterior al cierre PR #162 / merge `582341b`, con contexto suficiente, bajo consumo de tokens y foco en seguridad operativa.

**Nota:** este no es un template evergreen. Es un prompt fechado para continuar las tareas pendientes documentadas al 2026-04-27.

## Prompt listo para copiar

````md
Actúa como arquitecto senior de software y consultor de producto para FLOWYA.

Objetivo del chat:
Retomar la operación desde el cierre documentado del 2026-04-26/2026-04-27, proteger el sistema, mantener trazabilidad y ejecutar solo el siguiente bloque seguro.

Reglas base:
- Trabaja siempre en rama `codex/...`; nunca directo en `main`.
- Antes de implementar, diagnostica contrato + runtime + riesgo + rollback.
- No hagas cambios destructivos sin aprobación explícita.
- No guardes secretos en `.env`, docs, commits ni scripts.
- No borres objetos de Supabase Storage por SQL. Supabase exige Storage API.
- Mantén `OPEN_LOOPS` y bitácora actualizados si cambias decisiones o estado.
- Usa lectura selectiva: no cargues todo el repo; lee solo los archivos necesarios para responder el siguiente paso.

Estado Git esperado al iniciar:
- Repo: `/Users/apple-1/flowya-app`
- `main` local debe estar limpio y actualizado.
- Último merge relevante: PR #162, merge commit `582341b`.
- Si no estás en rama de trabajo, crea una rama nueva antes de editar.

Fuentes mínimas obligatorias para retomar:
1. `docs/ops/OPEN_LOOPS.md`
2. `docs/bitacora/2026/04/394-cierre-jornada-gate-v1-data-media-map.md`
3. `docs/contracts/DATA_MODEL_CURRENT.md`
4. `docs/ops/plans/PLAN_DATA_MODEL_MEDIA_GEO_V1_2026-04-26.md`
5. `docs/ops/MEDIA_STORAGE_INVENTORY_2026-04-26.md`
6. Si el cambio toca mapa/búsqueda/media, leer también:
   - `docs/contracts/MAP_FRAMING_UX.md`
   - `docs/contracts/SEARCH_V2.md`
   - `docs/contracts/SPOT_SHEET_CONTENT_RULES.md`

Contexto cerrado:
- Migraciones `033` a `037` fueron aplicadas/verificadas.
- `033`: lectura pública directa de `pins` removida.
- `034`: cleanup de `mapbox_bbox` inválido; `remaining_invalid_bbox=0`.
- `035`: `spot_images` path-first con `storage_bucket/storage_path`.
- `036`: seed de portadas legacy; `remaining_cover_only=0`.
- `037`: `pins.status` queda legacy derivado; trigger activo y `drift_rows=0`.
- `038_spot_covers_orphan_candidates_backup.sql` NO borra; solo prepara backup/listado.
- Cleanup de 29 candidatos huérfanos en `spot-covers` queda diferido para otro micro-scope vía Storage API con service role temporal y dry-run. No retomarlo salvo que el usuario lo pida explícitamente.

Siguiente OL / punto de retoma:
Retomar en `OL-DATA-MODEL-INTROSPECTION-001`.

Siguiente decisión concreta:
Definir si V1 agrega campos mínimos en `spots`:
- `coordinate_source`
- `created_from`
- `country_code`
- `region_code`
- `city_name`

Criterio arquitectónico:
- No meter visa, transporte, salud, dinero, clima ni emergencias en `spots`.
- Esos datos deben ir después en modelo batch-first (`geo_*`) para país/región/ciudad.
- No asumir que DB está bien: contrastar con contratos/migraciones antes de proponer SQL.
- No romper RLS ni hacer hard delete.

Primera respuesta esperada:
1. Confirma rama actual y estado Git.
2. Resume en máximo 8 bullets el estado operativo leído en docs.
3. Señala si hay contradicciones documentales.
4. Propón plan corto para el siguiente micro-scope.
5. Antes de editar, define:
   - alcance mínimo;
   - riesgos;
   - pruebas;
   - rollback;
   - qué NO tocar.

Comandos sugeridos de apertura:
```bash
git status --short
git branch --show-current
sed -n '1,90p' docs/ops/OPEN_LOOPS.md
sed -n '1,140p' docs/bitacora/2026/04/394-cierre-jornada-gate-v1-data-media-map.md
sed -n '1,180p' docs/contracts/DATA_MODEL_CURRENT.md
sed -n '1,140p' docs/ops/plans/PLAN_DATA_MODEL_MEDIA_GEO_V1_2026-04-26.md
```

Si el usuario pide “flujo Git”:
1. Validar `tsc`, regresión y `git diff --check`.
2. Commit en rama.
3. Push.
4. PR.
5. Merge solo si checks/boots no bloquean.
6. Volver a `main`, `git pull --ff-only origin main`, borrar rama local/remota.
````

## Uso recomendado

- Pega el bloque completo en el nuevo chat.
- Si solo necesitas una retoma ultra corta, pega desde `Objetivo del chat` hasta `Siguiente decisión concreta`.
- No pegues salidas completas de comandos salvo que haya error; resume evidencia.

## Guardrails de tokens

- Leer primero `OPEN_LOOPS` y bitácora `394`.
- Evitar `rg` amplio salvo que el micro-scope lo requiera.
- Al investigar código, buscar por símbolos concretos (`spots`, `coordinate_source`, `created_from`, `country_code`, `mapbox_bbox`, `spot_images`) y abrir rangos chicos.
- Resumir hallazgos; no copiar archivos largos en el chat.
- Si falta evidencia remota de Supabase, pedir una consulta SQL puntual o usar CLI solo si ya está seguro y autorizado.

## No tocar al retomar

- No ejecutar cleanup de Storage huérfano salvo instrucción explícita.
- No abrir Fluir ni Recordar.
- No añadir campos geográficos a `spots` sin plan/migración/rollback.
- No mover contexto país/región/ciudad a `spots`.
- No cambiar RLS sin verificación.
- No hard delete de spots.
