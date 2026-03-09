# Plan: OL-SEARCHV2-002 — Fase de investigación antes de optimización

**Fecha:** 2026-03-08  
**Estado:** Investigación (sin implementación)  
**Prioridad:** Alta (experiencia de búsqueda)

---

## Principio rector

**No optimizar sin evidencia.** Pasar por una fase de investigación profunda antes de cualquier ajuste en código. Puede darse el caso de que no sea necesaria ninguna optimización.

---

## Alcance propuesto (si resultara necesaria optimización)

- Cache híbrida (L1+L2)
- TTL y frescura controlada
- Reducción de consumo API Mapbox

Referencia técnica previa: [PLAN_OL_SEARCHV2_002_API_EFFICIENCY_CACHE_FRESHNESS_2026-03-03.md](PLAN_OL_SEARCHV2_002_API_EFFICIENCY_CACHE_FRESHNESS_2026-03-03.md).

---

## Fase 1: Investigación (obligatoria)

### Objetivos

1. **Cuantificar** consumo actual de API (Mapbox forward, reverse, geocode) por sesión típica y por escenarios críticos.
2. **Documentar** patrones de uso real: qué queries, viewport, filtros generan más llamadas.
3. **Estimar** coste mensual actual vs umbral de preocupación (presupuesto, límites de proveedor).
4. **Identificar** si existe problema real: ¿hay regresión UX por latencia? ¿hay riesgo de coste?

### Entregables mínimos

- Inventario de superficies API (endpoints, llamadas por flujo).
- Métricas o instrumentación temporal para medir consumo en sesiones reales o representativas.
- Informe de investigación con recomendación: **optimizar** (y qué) vs **no optimizar** (evidencia de suficiencia actual).

### Criterio de cierre de investigación

- Evidencia documentada sobre necesidad o no de optimización.
- Si no hay problema: cerrar OL como "no requiere acción".
- Si hay problema: definir scope acotado de intervención antes de tocar código.

---

## Gate antes de implementación

- **No escribir código** de cache/optimización hasta que la investigación concluya con recomendación explícita de optimizar.
- Cualquier cambio de implementación debe referenciar hallazgos de la investigación.
