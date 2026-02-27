# WOW System Review — Mapa + Pines + Search + Sheets + Filtros vs JTBD

**Fecha:** 2026-02-26
**Fuentes:** runtime actual, contratos Explore/Search, `docs/ops/analysis/JTBD.md`.

## 1) Evaluación de cumplimiento JTBD actual

### JTBD-01 — Explorar map-first sin fricción
**Estado:** Parcialmente cumplido.
- A favor: flujo map-first ya sólido, reglas de selección y filtros maduras.
- En contra: aún hay complejidad perceptual por superposición de sistemas visuales y estados.

### JTBD-02 — Guardar rápido
**Estado:** Cumplido con oportunidades.
- A favor: acción de guardar existe y filtro `saved` es usable.
- Gap: falta reforzar narrativa de “qué cambió” al guardar en ciertos contextos POI.

### JTBD-03 — Recordar lo vivido
**Estado:** Parcial.
- A favor: `visited` está presente como estado real.
- Gap: experiencia aún orientada a selección puntual, no a reconstrucción de historia/sesión.

### JTBD-S1 — UI estable sin glitches
**Estado:** Parcial.
- A favor: mejoras continuas y contratos robustos.
- Gap: tamaño y acoplamiento de contenedores críticos elevan probabilidad de regresión.

### JTBD-S2 — Librería limpia
**Estado:** Parcial.
- A favor: DS ya centraliza buena parte.
- Gap: nomenclatura y primitivos aún no unificados para escalar listados y estados.

## 2) ¿Necesitamos nuevos JTBD?

Sí. No para reemplazar los actuales, sino para cerrar brechas de wow en el alcance vigente.

### Propuesta JTBD-06 — Decidir con confianza inmediata
**Cuando** selecciono un lugar en mapa/búsqueda,
**quiero** entender en menos de 1 segundo qué está activo y qué puedo hacer,
**para** avanzar sin dudas ni re-taps.

### Propuesta JTBD-S3 — Una sola fuente visual por intención
**Cuando** el sistema muestra selección/estado,
**queremos** evitar señales duplicadas o competitivas,
**para** mantener claridad, confianza y control.

### Propuesta JTBD-S4 — Interacciones consistentes cross-platform
**Cuando** un componente interactivo cambia de estado,
**queremos** que el lenguaje visual sea equivalente en web y mobile,
**para** que la experiencia se sienta coherente y premium.

## 3) Decisión de solución (simple, sana, eficiente, intuitiva, wow)

### Mantener
- Arquitectura map-first.
- Filtros `all/saved/visited`.
- Search con reglas por filtro y keyboard-safe.

### Modificar
- Gobernanza de selección: una sola representación dominante por intención.
- Nomenclatura DS de listados (`ListView` + `ResultRow`).
- Contrato de estados interactivos cross-platform (hover/pressed/focus-visible/selected).

### Añadir (disruptivo pero pragmático)
- Modo de “cámara intencional” (discover/inspect/act).
- Medium sheet adaptativo por tipo de selección.
- Señales explicables de ranking en Search (micro-copy mínima).

## 4) Plan propuesto (solo análisis/estrategia)

1. Cerrar actualización JTBD (agregar JTBD-06, S3, S4).
2. Formalizar contratos de primitivos/estados en DS.
3. Diseñar blueprint único de selección para todo el sistema.
4. Preparar micro-scopes de implementación (sin mezclar arquitectura + UI + motion en el mismo PR).

## 5) North Star de wow para este alcance

**Una decisión útil en <60s, con feedback inequívoco en <1s y cero dudas sobre qué está seleccionado, qué estado tiene y qué acción sigue.**
