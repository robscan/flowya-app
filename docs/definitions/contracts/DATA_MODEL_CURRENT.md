# DATA_MODEL_CURRENT

**Estado:** PLACEHOLDER (no confirmado)  
**Fuente de verdad:** este archivo dentro de `docs/definitions/contracts/`.

## Propósito
Contrato operativo del **modelo de datos vigente**. Describe tablas, campos, llaves, constraints y reglas de integridad que la app asume.

## Estado actual (a completar)
> OPEN LOOP: documentar el modelo real desde Supabase/migraciones.

### Tablas esperadas (mínimo)
- `spots`
- `pins`

### Reglas (a confirmar)
- Unicidad: nombre + proximidad (si aplica)
- Hard delete real
- Slugs/IDs compartibles

## Referencias
- `docs/ops/SYSTEM_MAP.md`
- `docs/ops/DECISIONS.md`
- `docs/ops/GUARDRAILS.md`
