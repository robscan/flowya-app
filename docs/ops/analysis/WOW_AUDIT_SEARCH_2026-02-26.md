# WOW Audit — Buscador

**Fecha:** 2026-02-26
**Alcance:** query, ranking, filtros, resultados, keyboard-safe y experiencia de descubrimiento.

## Diagnóstico

### Lo que ya está sólido
- Guardrails por filtro (`saved/visited` sin externos ni CTA de crear).
- Ranking con intents para landmarks y fallback estable.
- Keyboard-safe reforzado en web/native.

### Brechas para wow
1. **Duplicación de estructura web/native** aumenta riesgo de drift UX.
2. **Modelo de ranking potente pero poco explicable al usuario** (falta transparencia suave).
3. **Sin “modo exploración rápida” explícito** para decidir en <60s.

## Oportunidades de alto impacto

### P0 — Single Search Surface
- Mantener adapters plataforma, pero un solo árbol de contenido y estados.
- Resultado wow: consistencia total entre web y mobile.

### P1 — Ranking explicable (micro-copy)
- Añadir señales discretas tipo “Cerca de ti”, “Guardado”, “Landmark”.
- Resultado wow: confianza en por qué aparece cada resultado.

### P1 — Quick Decision Mode
- En query vacía/corta, limitar visualmente a “Top 3 del mapa + 1 acción”.
- Resultado wow: cero parálisis por exceso.

### P2 — Persistencia de intención
- Si usuario alterna filtros, preservar contexto de decisión (selección/viewport) en vez de resetear percepción.

## Propuesta disruptiva (controlada)
- **Search como copiloto contextual**: en vez de solo listar, sugerir una acción (“Ir ahora”, “Guardar para después”) según estado del spot y filtro.

## Riesgos
- Sobre-explicar ranking puede ensuciar UI.
- Necesita disciplina de copy y tokens.

## Criterio de éxito
- Decisión útil en <60s para primer uso.
- Menos cambios de filtro “a ciegas”.
- Menos cierres/reaperturas de search para reorientarse.
