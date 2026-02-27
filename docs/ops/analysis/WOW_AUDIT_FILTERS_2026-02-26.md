# WOW Audit — Filtros

**Fecha:** 2026-02-26
**Alcance:** `all/saved/visited`, badges pendientes, relación con mapa/búsqueda/sheet.

## Diagnóstico

### Lo que ya funciona
- Filtros semánticos simples y entendibles.
- Pendientes por filtro (`saved` y `visited`) con persistencia local.
- Reencuadre diferido evita saltos bruscos.

### Brechas para wow
1. **Modelo mental “filtro” aún compite con “estado del pin”** en percepción del usuario.
2. **Feedback de transición entre filtros no siempre se siente dirigido** (a veces técnico).
3. **Faltan “atajos de intención”** (ej. revisar pendientes primero).

## Oportunidades de alto impacto

### P0 — Intención explícita de filtro
- Añadir subtítulo contextual breve por filtro:
  - `Todos`: “Explora y decide”.
  - `Por visitar`: “Planifica lo próximo”.
  - `Visitados`: “Recuerda lo vivido”.
- Resultado wow: filtro deja de ser técnico, pasa a ser guía.

### P1 — Pending-first navigation
- Si hay pendientes, primer tap en filtro lleva al spot pendiente más relevante (ya parcialmente soportado); formalizarlo como norma UX.

### P1 — Color policy estricta
- En `saved`, todo lo visible debe hablar en lenguaje `saved`; idem `visited`.
- Evitar señales cruzadas que rompan confianza.

### P2 — Filtros como “vistas”
- Tratar filtros como vistas de trabajo, no como simple switch de query.
- Conservación de contexto por vista (último foco/zoom por filtro).

## Propuesta disruptiva (controlada)
- **Modo “review” temporal**: al entrar a `saved` o `visited`, recorrer highlights de 3 spots con micro-encuadres.
- Puede elevar wow en sesiones cortas de decisión.

## Riesgos
- Animación excesiva puede cansar si no hay opt-out.
- Debe respetar control manual del usuario.

## Criterio de éxito
- El usuario entiende instantáneamente qué está viendo en cada filtro.
- Menos toggles repetidos para ubicarse.
