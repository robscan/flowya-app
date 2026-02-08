# PROMPTS — Contratos (Oscar → Cursor)
**Propósito:** Obtener info objetiva del repo/DB para que el Arquitecto redacte contratos 4.4 y 4.5 sin suposiciones.

## Prompt 4.4 — DATA_MODEL_CURRENT (DB + migraciones)
> Cursor: inspecciona Supabase/migraciones y regresa el contrato actual de datos.

1) Lista tablas existentes (schema público) y columnas (nombre, tipo, nullability, defaults).
2) Indica llaves primarias/foráneas, índices, constraints relevantes (unique, check).
3) Copia/pega los archivos de migración SQL que crean/modifican `spots`, `pins` y auth-related tables (sin credenciales).
4) Confirma qué columnas ya existen para: address, status (to_visit/visited), owner/user_id, created_at/updated_at.
5) Devuelve un JSON resumen con:
   - tables: [{name, columns:[...], constraints:[...]}]
   - migrations: [{file, purpose}]
   - gaps: ["columna X no existe pero se necesita para Y"]

## Prompt 4.5 — PROFILE_AUTH_CONTRACT_CURRENT (UX + rutas + estados)
> Cursor: documenta cómo funciona hoy el perfil/auth en la app.

1) Enumera entrypoints de auth:
   - icono de perfil sin sesión
   - intentar guardar pin/spot sin sesión
   - logout
2) Describe estados del auth modal: idle/loading/success/error y qué dispara cada uno.
3) Describe qué pasa al volver del magic link (redirect), cómo detectan sesión (`onAuthStateChange` etc).
4) Indica qué se bloquea si no hay sesión (qué acciones requieren login hoy).
5) Señala los archivos clave (paths) y cualquier constante (`AUTH_MODAL_MESSAGES`) con valores actuales.

Entrega en Markdown breve + bullets + paths exactos.
