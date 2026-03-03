# 282 — Subplan de migración identidad: anon -> cuenta registrada

Fecha: 2026-03-03  
Tipo: Plan técnico de continuidad de ownership  
Área: `OL-CONTENT-001.A`

## Resultado

Se documentó subplan específico para preservar contenido user-owned al pasar de sesión anónima a cuenta registrada.

Estrategia definida:

1. Preferida: link identity (mantener `user_id`).
2. Fallback: migración controlada de ownership con reglas de merge y auditoría.

## Evidencia

- `docs/ops/plans/SUBPLAN_OL_CONTENT_001_A_ANON_TO_REGISTERED_MIGRATION_2026-03-03.md`
- enlazado desde:
  - `docs/ops/plans/PLAN_OL_CONTENT_001_A_IDENTITY_OWNERSHIP_FOUNDATION_2026-03-03.md`
