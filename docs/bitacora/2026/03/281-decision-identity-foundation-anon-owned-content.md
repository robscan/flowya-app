# 281 — Decisión: foundation de identidad para contenido user-owned (anon + owner)

Fecha: 2026-03-03  
Tipo: Decisión técnica/arquitectura  
Área: identidad + persistencia privada

## Contexto

No hay base activa de usuarios registrados hoy, pero los próximos loops (`001.B` notas privadas, tags personales y enrichment externo) requieren ownership claro para escalar sin deuda.

## Decisión

1. Mantener contenido personal como **user-owned** desde el inicio.
2. Habilitar uso actual con **sesión anónima autenticada** (sin fricción de registro).
3. No guardar contenido personal sin `user_id`.
4. Mantener separación de capas:
   - personal (owner-only),
   - pública/editorial,
   - enrichment externo.

## Integración en roadmap

- `OL-CONTENT-001.A` pasa a ser foundation de identidad + ownership.
- `OL-CONTENT-001.B` y `OL-EXPLORE-TAGS-001` dependen explícitamente de esta base.

## Evidencia

- `docs/ops/plans/PLAN_OL_CONTENT_001_A_IDENTITY_OWNERSHIP_FOUNDATION_2026-03-03.md`
- `docs/ops/plans/PLAN_OL_CONTENT_001_B_SHEET_QUICK_EDIT_PRIVATE_NOTES_2026-03-03.md`
- `docs/ops/plans/PLAN_OL_EXPLORE_TAGS_001_2026-03-03.md`
