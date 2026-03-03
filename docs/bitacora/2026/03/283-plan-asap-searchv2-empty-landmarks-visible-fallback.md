# 283 — Plan ASAP SearchV2: empty recommendations con landmarks visibles + fallback

Fecha: 2026-03-03  
Tipo: Plan operativo (ASAP)  
Área: Explore/SearchV2

## Resultado

Se documentó plan inmediato para resolver el caso `Todos + query vacía` con baja calidad de sugerencias en ciertas ciudades (ej. Panamá), priorizando landmarks visibles del mapa y usando fallback externo solo cuando sea necesario.

## Decisiones clave

1. El ajuste se integra a SearchV2; no se institucionaliza lógica paralela en `MapScreenVNext`.
2. Pipeline en dos etapas:
   - landmarks visibles del viewport,
   - fallback externo condicionado por umbral mínimo.
3. Se propone rollout con feature flag y telemetría mínima de etapa usada.

## Evidencia

- `docs/ops/plans/PLAN_OL_SEARCHV2_001_EMPTY_LANDMARKS_VISIBLE_FALLBACK_2026-03-03.md`
- `docs/ops/OPEN_LOOPS.md`
