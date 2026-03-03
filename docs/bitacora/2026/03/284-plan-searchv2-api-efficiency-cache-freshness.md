# 284 — Plan SearchV2: optimización API con cache híbrida y frescura controlada

Fecha: 2026-03-03  
Tipo: Plan estratégico-técnico  
Área: SearchV2 / Integración APIs

## Resultado

Se definió plan de punto medio para reducir consumo/costo de APIs externas sin degradar calidad ni servir datos obsoletos de forma riesgosa.

## Decisiones clave

1. SearchV2 mantiene ownership de orquestación (fuente única de reglas de búsqueda).
2. Se propone cache híbrida:
   - L1 en memoria (TTL corto),
   - L2 en Supabase (TTL por tipo + stale-while-revalidate).
3. Se incluyen métricas de control para validar ahorro real y no-regresión de experiencia.
4. Se explicita secuencia P0->P2 para rollout seguro.

## Evidencia

- `docs/ops/plans/PLAN_OL_SEARCHV2_002_API_EFFICIENCY_CACHE_FRESHNESS_2026-03-03.md`
- `docs/ops/OPEN_LOOPS.md`
