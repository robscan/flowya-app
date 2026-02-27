# WOW Audit — Sheets

**Fecha:** 2026-02-26
**Alcance:** SpotSheet/SearchSheet, estados, transiciones, jerarquía de foco y ergonomía.

## Diagnóstico

### Lo que ya funciona
- Contrato de estados (`peek/medium/expanded`) bien definido.
- Reglas de convivencia mapa/sheet claras en contratos.
- SpotSheet tiene comportamiento rico y estable en flows principales.

### Brechas para wow
1. **Complejidad excesiva en SpotSheet** (mucha lógica + variantes en un componente grande).
2. **Búsqueda y spot comparten intención, pero no un modelo único de estado**.
3. **Falta de “momento de decisión” explícito en medium state** (CTA dominante por contexto).

## Oportunidades de alto impacto

### P0 — Sheet Intent Model
- Definir intención por estado:
  - `peek`: awareness,
  - `medium`: decisión,
  - `expanded`: detalle/edición.
- Resultado wow: cada estado “se siente útil”, no solo más alto.

### P1 — CTA jerárquica por contexto
- `medium` debe tener una acción principal contextual (no empate visual).
- Resultado wow: menos fricción cognitiva, más avance de flujo.

### P1 — Refactor por subdominios
- Dividir SpotSheet en subcomponentes por responsabilidad (header/actions/body/modes).
- Resultado wow indirecto: menos regresiones, iteración más rápida.

### P2 — Motion narrativa
- Ajustar timings/springs por intención (selección vs cierre vs cambio de estado).
- Resultado wow: sensación premium y coherencia conductual.

## Propuesta disruptiva (controlada)
- **Adaptive medium**: altura y contenido medium cambian por tipo de selección (spot persistido, POI externo, draft).
- En vez de un medium único, medium “inteligente”.

## Riesgos
- Mayor complejidad si no se define contrato de intents primero.

## Criterio de éxito
- Menos cambios manuales de estado (`medium -> expanded -> medium`) por confusión.
- Acción principal completada sin abrir detalle completo en casos comunes.
