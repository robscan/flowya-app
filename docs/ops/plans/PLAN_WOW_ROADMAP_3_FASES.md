# PLAN — Roadmap Estratégico WOW (3 fases)

**Fecha:** 2026-02-26  
**Estado:** ACTIVO (estrategia aprobada y descompuesta a OL operables)
**Alcance:** Explore map-first (mapa, pines, filtros, buscador, sheets, DS base)

---

## North Star

**Decisión útil en <60s, feedback inequívoco en <1s y cero ambigüedad sobre selección/estado/siguiente acción.**

---

## Alineación JTBD

### JTBD vigentes
- JTBD-01 (Explorar sin fricción)
- JTBD-02 (Guardar rápido)
- JTBD-03 (Recordar lo vivido)

### Addendum propuesto
- JTBD-06 (Decidir con confianza inmediata)

### Objetivos de sistema (no JTBD usuario)
- S1 (UI estable)
- S2 (Librería limpia)
- S3 (Una sola fuente visual por intención)
- S4 (Interacciones consistentes cross-platform)

---

## Fase 1 — Fundación Clara y Estable

## Objetivo
Eliminar ambigüedad visual y reducir riesgo de regresión en el núcleo de Explore.

## Resultado esperado
- Selección/estado con una sola fuente visual dominante.
- Contratos runtime + DS aterrizados en reglas ejecutables.
- Base técnica preparada para iterar wow sin romper estabilidad.

## Incluye
- Gobernanza de selección (mapa/pines/POI/layers externos).
- Contrato de estados interactivos cross-platform (`hover/pressed/focus-visible/selected`).
- Naming canónico DS para listados (`ListView` + `ResultRow`) a nivel contrato.
- Primer corte de `Activity Summary` (Fase A del contrato: visited/pending).

## No incluye
- Re-arquitectura total de Explore.
- Cambios visuales masivos fuera de alcance activo.

## Métricas de salida
- 0 conflictos visuales de selección reportados en smoke principal.
- 0 regresiones P0 en mapa/sheet/search durante 3 ciclos de QA.
- Estados interactivos definidos y consumiendo tokens en componentes críticos.

## Gate (Go/No-Go)
- Go si contratos están cerrados, smoke estable y loops P2 de ambigüedad visual en estado cerrado.

---

## Fase 2 — Interacción WOW (Intención y Flujo)

## Objetivo
Hacer que el sistema “se sienta inteligente” sin perder control del usuario.

## Resultado esperado
- Search y filtros guían decisión (no solo listan).
- Sheet `medium` orientado a acción contextual.
- Cámara y foco responden a intención (discover/inspect/act).

## Incluye
- Single Search Surface conceptual (contenido unificado + adapters por plataforma, bajo principio **Mapbox-first**).
- Reglas de ranking explicable (micro-señales discretas).
- Política de filtros como vistas de trabajo (Todos/Por visitar/Visitados).
- Sheet intent model por estado (`peek/medium/expanded`).
- Cámara/foco por intención (`discover/inspect/act`) **solo** vía mini QA secuencial con aprobación UX explícita por paso.

### Definición operativa de cámara/foco (sin temblores)
- `discover`:
  - Solo cambia cámara al entrar a Explore, cambiar filtro mayor o tocar “ver todo”.
  - Nunca se dispara por eventos secundarios (render de lista, badge, refresh local).
- `inspect`:
  - `flyTo` a selección puntual (spot/POI) con offset para evitar que el pin quede oculto por sheet.
  - Repetir tap en el mismo elemento no vuelve a mover cámara.
- `act`:
  - No recentra automáticamente mientras el usuario ejecuta acción en sheet (`guardar/visitado/compartir`).
  - Solo recentra si la acción cambia entidad seleccionada.
- Guardrails anti-jitter:
  - Máximo 1 movimiento de cámara por intención.
  - Ventana de bloqueo de reencuadre (`cooldown`) para evitar encadenados.
  - Prohibido combinar `fitBounds` + `flyTo` para la misma intención.

### Mini QA secuencial (criterio de aceptación)
1. Probar `discover` aislado y aceptar/rechazar UX.
2. Probar `inspect` aislado y aceptar/rechazar UX.
3. Probar `act` aislado y aceptar/rechazar UX.
4. Probar flujo combinado `discover -> inspect -> act` y validar que no aparezcan temblores.
5. Si falla un paso, no se avanza al siguiente hasta ajustar y revalidar.

## No incluye
- Funciones fuera de Explore (Flows completos, social sharing avanzado).

## Métricas de salida
- Usuario encuentra 1 opción útil en <60s en pruebas de recorrido.
- Reducción de taps repetidos por duda de selección/estado.
- Mejoría percibida de claridad en QA cualitativa.

## Gate (Go/No-Go)
- Go si mejora de velocidad de decisión sin aumento de bugs críticos.

---

## Fase 3 — Escala Operativa y Producto Vivo

## Objetivo
Escalar el sistema sin deuda y preparar expansión funcional con salud técnica.

## Resultado esperado
- Runtime modular por dominio (menos acoplamiento de pantalla).
- Activity Summary completo (incluye países con fuente confiable).
- Operación continua por OL pequeños, medibles y trazables.

## Incluye
- Extracción progresiva a dominio puro (`core/explore/runtime/*`).
- Consolidación final de primitivos DS en runtime activo.
- Reglas de observabilidad mínima para decisiones UX (sin sobreinstrumentar).

## No incluye
- Rediseño total de identidad visual.

## Métricas de salida
- Reducción de tamaño/complejidad en contenedores críticos.
- Tasa de regresión menor por ciclo en mapa/search/sheet.
- Tiempo de entrega por micro-scope más corto y predecible.

## Gate (Go/No-Go)
- Go si arquitectura y UX evolucionan sin perder estabilidad base.

---

## Estrategia de ejecución

1. Cada fase se descompone a OL accionables (P0/P1/P2).
2. 1 PR por micro-scope funcional (sin mezclar dominios).
3. Cierre obligatorio: bitácora + OPEN_LOOPS + evidencia smoke.
4. Si un scope sube riesgo sistémico, se corta y se replanifica (no se fuerza merge).

---

## Riesgos estratégicos y mitigación

- **Riesgo:** querer “wow” con cambios simultáneos de arquitectura + UX.
  - **Mitigación:** separar en OL por dominio y gates de fase.

- **Riesgo:** sobrecargar UI con señales explicativas.
  - **Mitigación:** micro-copy mínima + jerarquía estricta.

- **Riesgo:** métricas de países poco confiables en Activity Summary.
  - **Mitigación:** rollout por fases, con `visitedCountriesCount` bloqueado hasta fuente canónica.

---

## Descomposición operativa (OL)

La descomposición canónica por fase vive en `docs/ops/OPEN_LOOPS.md` bajo sección:
- `Roadmap WOW — OL operables por fase`

Regla:
- No abrir OL de Fase 2 o Fase 3 sin cumplir gate de Fase 1.

---

## Glosario operativo

- **Smoke test:** prueba corta de salud para validar que lo crítico sigue funcionando tras un cambio.
  - En este alcance: abrir mapa, seleccionar spot/POI, usar filtros, abrir/cerrar buscador, validar sheet y acción principal.
  - No reemplaza QA profundo; es puerta de seguridad rápida.
