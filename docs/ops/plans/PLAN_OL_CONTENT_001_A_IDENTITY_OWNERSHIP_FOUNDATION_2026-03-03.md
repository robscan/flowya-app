# PLAN — OL-CONTENT-001.A Identity + Ownership Foundation (2026-03-03)

Estado: PLANIFICADO  
Objetivo: habilitar contenido user-owned hoy, aunque no haya usuarios registrados activos, sin bloquear roadmap de APIs/enrichment.

Subplan asociado:
- `docs/ops/plans/SUBPLAN_OL_CONTENT_001_A_ANON_TO_REGISTERED_MIGRATION_2026-03-03.md`

---

## 1) Decisión principal (cerrada)

1. El contenido personal (notas, tags) será **user-owned desde el día 1**.
2. Para evitar fricción actual (sin usuarios registrados), se usará **sesión anónima autenticada** como base operativa.
3. No se almacenará contenido personal sin `user_id`.

Resultado: modelo escalable y seguro hoy, sin esperar rollout de registro.

---

## 2) Racional

- Si se guarda ahora sin owner, luego la migración a privacidad real será costosa y riesgosa.
- `pins` ya opera con `user_id` + RLS; extender este patrón reduce deuda.
- La capa de enrichment externo futura debe convivir separada de contenido personal; este foundation lo garantiza.

---

## 3) Scope v1 (foundation)

1. Bootstrap de sesión anónima en app cuando no exista sesión (`auth.uid` disponible).
2. Esquema y RLS para entidades user-owned nuevas de contenido personal:
   - `pin_private_notes` (si no se extiende `pins`),
   - `user_tags`,
   - `pin_tags`.
3. Capa de dominio base para leer/escribir por `user_id`.
4. Contrato de upgrade de identidad (anon -> cuenta registrada) documentado.

---

## 4) Diseño de identidad recomendado

### 4.1 Modelo de acceso

- Lectura pública de spots se mantiene (explore).
- Escritura de contenido personal requiere sesión autenticada:
  - `authenticated` real o `authenticated` anónima.

### 4.2 Bootstrap anónimo

- Al iniciar app:
  1. si existe sesión: usarla.
  2. si no existe sesión: crear sesión anónima automáticamente.
- Persistir sesión local para continuidad.

### 4.3 Upgrade futuro

- Camino preferido: link identity del usuario registrado sobre cuenta anónima para preservar `user_id`.
- Si link no está disponible en fase actual:
  - no bloquear release;
  - dejar tarea explícita de migración controlada en loop posterior.

---

## 5) Modelo de datos (propuesto)

Opción recomendada (más limpia para evolución):

- `pin_private_notes`
  - `id uuid pk`
  - `user_id uuid not null`
  - `spot_id uuid not null`
  - `note_short text null`
  - `note_why text null`
  - `updated_at timestamptz`
  - unique `(user_id, spot_id)`

- `user_tags`
  - `id uuid pk`
  - `user_id uuid not null`
  - `name text not null`
  - `slug text not null`
  - unique `(user_id, slug)`

- `pin_tags`
  - `id uuid pk`
  - `user_id uuid not null`
  - `spot_id uuid not null`
  - `tag_id uuid not null`
  - unique `(user_id, spot_id, tag_id)`

RLS en todas:
- SELECT/INSERT/UPDATE/DELETE con `auth.uid() = user_id`.

Nota:
- Si prima velocidad máxima, `note_short/note_why` puede vivir en `pins`; mantener misma regla de ownership.

---

## 6) Riesgos y mitigación

1. Sesiones anónimas no persisten correctamente.
- Mitigación: bootstrap defensivo + health check de sesión al abrir flujo mutante.

2. Confusión “no tengo cuenta pero mis datos existen”.
- Mitigación: copy claro “Guardado en este dispositivo/sesión; crea cuenta para asegurar continuidad”.

3. Upgrade anon->registro sin linking en v1.
- Mitigación: documentar explícitamente como open loop, no bloquear loops de valor inmediato.

4. Mezcla de contenido personal con enrichment externo.
- Mitigación: separación de tablas/campos + contratos de precedencia de lectura.

---

## 7) Integración con loops ya definidos

1. `OL-CONTENT-001.B` depende de este foundation para notas privadas.
2. `OL-EXPLORE-TAGS-001` depende de este foundation para tags user-owned.
3. `OL-CONTENT-002..006` se benefician al mantener separada capa personal vs capa enriquecida externa.

---

## 8) Criterios de aceptación

1. Usuario sin registro puede crear/editar contenido personal vía sesión anónima.
2. Todo contenido personal queda con `user_id` y RLS owner-only.
3. `001.B` y `TAGS-001` pueden implementarse sin redefinir identidad.
4. Contrato de upgrade de identidad documentado (aunque implementación completa sea posterior).
