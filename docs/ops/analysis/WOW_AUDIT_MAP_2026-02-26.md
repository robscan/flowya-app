# WOW Audit — Mapa (Explorar)

**Fecha:** 2026-02-26
**Alcance:** cámara, encuadre, selección, continuidad visual en mapa.

## Diagnóstico

### Lo que ya está sólido
- Reencuadre diferido por filtro evita zoom-outs prematuros.
- Continuidad cross-filter (`saved <-> visited`) mantiene foco y sheet en `medium`.
- Estado 3D funcional con estilo FLOWYA.

### Brechas para experiencia wow
1. **Exceso de reglas en el contenedor** (`MapScreenVNext`), no en dominio puro.
2. **Sistema de selección frágil frente a capas de mapa externas** (POI labels/icons de Mapbox).
3. **Cámara “reactiva” pero no “predictiva”**: hoy responde bien, pero no anticipa intención.

## Oportunidades de alto impacto

### P0 — Selection-as-Source-of-Truth
- Definir una sola política de selección: cualquier selección activa domina la representación visual del mapa.
- Ocultar interferencias de layers POI de terceros durante selección.
- Resultado wow: percepción de control absoluto y feedback inequívoco.

### P1 — Cámara intencional (no solo geométrica)
- Introducir estrategia `intent-aware camera`:
  - `discover`: mantener contexto (menos zoom).
  - `inspect`: zoom fuerte y anclaje estable.
  - `act`: priorizar visibilidad de CTA/sheet sin mover demasiado.
- Resultado wow: mapa “se siente inteligente”, no nervioso.

### P2 — “Focus halo” contextual
- Añadir halo/field mínimo alrededor de selección activa (sin ruido), adaptado por estado.
- Resultado wow: legibilidad instantánea en zonas densas.

## Propuesta disruptiva (controlada)
- **Soft takeover de mapa durante selección activa**: reducir visualmente ruido no relevante (POI secundarios, labels menores) y restaurar al salir.
- Es una decisión no conservadora, pero aumenta foco, velocidad y confianza.

## Riesgos
- Sobre-ocultar contexto puede desorientar si no hay restauración clara.
- Debe coexistir con filtros sin romper reglas de `saved/visited`.

## Criterio de éxito
- Menos “doble fuente visual” en selección.
- Menos correcciones manuales de cámara por parte del usuario.
- Tiempo a “entendí qué está seleccionado” < 1 segundo.
