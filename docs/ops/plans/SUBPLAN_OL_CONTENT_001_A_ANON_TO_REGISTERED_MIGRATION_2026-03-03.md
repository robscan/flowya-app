# SUBPLAN — OL-CONTENT-001.A anon -> cuenta registrada (2026-03-03)

Estado: PLANIFICADO  
Parent: `OL-CONTENT-001.A`  
Objetivo: preservar contenido user-owned cuando el usuario pasa de sesión anónima a cuenta registrada.

---

## 1) Objetivo operativo

Evitar pérdida/fragmentación de datos personales (`notas`, `tags`) al convertir identidad anónima en identidad registrada.

---

## 2) Estrategia recomendada (preferida)

### A) Link identity (mismo `user_id`)

1. El usuario inicia sesión/registro desde sesión anónima activa.
2. Se intenta vincular credencial al mismo usuario de Auth (link account).
3. Si el `user_id` permanece igual, no se requiere migración de tablas.

Ventaja:
- cero movimiento de datos,
- riesgo mínimo de inconsistencia.

---

## 3) Fallback (si no hay link identity en fase actual)

### B) Migración de ownership controlada

Precondiciones:
1. Usuario anónimo autenticado (`anon_user_id`) con datos.
2. Usuario registrado autenticado (`registered_user_id`) final.
3. Ambos IDs disponibles en backend seguro.

Paso de migración (transaccional o por job idempotente):
1. Bloquear escrituras del usuario en cliente durante migración.
2. Reasignar filas owner-only:
   - `pin_private_notes`: `user_id = registered_user_id` donde `user_id = anon_user_id`
   - `user_tags`: merge por `slug` (dedupe) y remapeo de `pin_tags`
   - `pin_tags`: reasignar `user_id` y resolver conflictos por unique
3. Verificar conteos antes/después.
4. Reabrir escrituras y refrescar sesión/estado local.

---

## 4) Reglas de merge y conflictos

1. `user_tags` conflicto por `slug`:
- conservar tag existente del usuario registrado,
- remapear `pin_tags` del anon al `tag_id` existente,
- eliminar duplicado residual anon.

2. `pin_private_notes` conflicto `(user_id, spot_id)`:
- regla canónica: `last write wins` por `updated_at`.

3. `pin_tags` conflicto `(user_id, spot_id, tag_id)`:
- insertar con upsert idempotente; ignorar duplicado exacto.

---

## 5) Seguridad y auditoría

1. Migración solo por backend con credenciales de servicio.
2. No exponer SQL de reasignación en cliente.
3. Registrar evento de auditoría:
- `identity_migration_started`
- `identity_migration_completed`
- `identity_migration_failed`

---

## 6) UX de transición

1. Mostrar estado claro:
- `Sincronizando tus notas y etiquetas...`
2. Duración objetivo:
- < 2s en la mayoría de casos.
3. Si falla:
- mantener sesión y datos actuales,
- ofrecer reintento manual.

---

## 7) Criterios de aceptación

1. Usuario que se registra desde sesión anónima conserva notas/tags.
2. No hay duplicados visibles de tags tras migración.
3. No hay pérdida de notas por spot.
4. Flujo es idempotente (reintento seguro).

---

## 8) Orden de implementación sugerido

1. Confirmar capacidad de link identity en proveedor auth actual.
2. Implementar estrategia A si está disponible.
3. Implementar fallback B como job/backend seguro.
4. QA con datasets de conflicto (tags duplicados, notas en mismos spots).
5. Documentar cierre en bitácora y contrato de identidad.
