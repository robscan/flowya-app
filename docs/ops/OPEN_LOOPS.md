# OPEN_LOOPS — Flowya (alcance activo)

**Fecha:** 2026-02-14

> Este archivo define el alcance diario del chat.
> El objetivo es **vaciar esta lista** para dar por cerrada la sesión.
> Los loops cerrados NO permanecen aquí (se registran en bitácora).

---

## Prioridades (orden fijo)
1) **Resolver soft delete ya**  
2) **Resolver Create Spot: siempre desde creador mínimo**  
3) **Rediseñar Edit Spot**  
4) Resolver bugs restantes detectados en pruebas

---

## Loops activos (P0 → P2)

### OL-P0-001 — Soft delete consistente (no fantasmas)

**Estado:** ACTIVO

**Problema:** Spots con `is_hidden = true` siguen apareciendo (en pins, search results, sheet o cache).

**DoD / AC**
- Un spot hidden **nunca** aparece en:
  - pins (guardados/visitados)
  - resultados de Search (spots)
  - selección/SpotSheet (si estaba seleccionado, se debe limpiar o mostrar estado “no disponible”)
- Search invalida inmediatamente cache/resultados usando `softDeleteInvalidation.hiddenSpotIds`.
- Smoke: borrar/ocultar spot → desaparece en UI sin refresh.

**Pruebas mínimas**
- Unit: invalidación purga spotIds
- Smoke: ocultar spot y verificar 3 superficies (pins/search/sheet)

---

### OL-P0-002 — Create Spot: **siempre** desde creador mínimo (una sola ruta)

**Estado:** ACTIVO

**Problema:** hay entrypoints inconsistentes o frágiles. Queremos 1 flujo canónico: crear mínimo (ubicación + imagen opcional) → persistir → luego editar textos.

**DoD / AC**
- Cualquier “crear” (desde no-results, desde mapa, etc.) aterriza en el mismo flujo:
  - draft placing → confirmar → creador mínimo → persist → sheet → “Editar detalles”
- No existe “crear spot” alterno que salte al editor largo directamente.
- Si hay auth gate, se aplica antes de crear draft/inserción.

**Pruebas mínimas**
- Smoke: no-results → crear → persist → edit
- Smoke: mapa → crear → persist → edit

---

### OL-P0-003 — Create Spot se activa por error con pinch/zoom (dos dedos)

**Estado:** ACTIVO

**Problema:** al navegar con dos dedos / hacer zoom, se dispara “crear spot” accidentalmente.

**DoD / AC**
- Gestos de mapa (pan/zoom/pinch) **no** disparan create.
- Create solo se dispara por intent explícito (botón / long-press / chooser definido).
- Añadir guardrail: ignorar “press” cuando hubo multi-touch o gesture in-progress.

**Pruebas mínimas**
- Smoke en móvil: 10 intentos de pinch/zoom sin activar create
- Unit (si aplica): detector multi-touch → cancela intent

---

### OL-P1-001 — Dirección postal no se genera en creación mínima

**Estado:** ACTIVO

**Problema:** al crear un spot con el creador mínimo, la dirección/postal no se completa.

**DoD / AC**
- Tras persistir spot mínimo, se ejecuta enriquecimiento (reverse geocode / Mapbox place) y se guarda address.
- UI refleja address cuando disponible (con loading si es async).
- Si falla, queda estado de error recuperable (retry) sin romper flujo.

**Pruebas mínimas**
- Smoke: crear spot mínimo en 2 ubicaciones distintas → address aparece
- Unit: efecto de enrichment maneja error/retry

---

### OL-P1-002 — Botón “cerrar buscador” en estado activo

**Estado:** ACTIVO

**Problema:** cuando Search está activo/abierto, el botón de cerrar no respeta estados (disabled/priority/click area).

**DoD / AC**
- Cerrar siempre disponible cuando status=open.
- No compite con focus del input ni rompe el layout.
- Hit area consistente.

**Pruebas mínimas**
- Smoke: abrir search → cerrar (sin pérdida de estado de Explore indebida)

---

### OL-P2-001 — Filtros “Todos / Guardados / Visitados” en buscador (layout)

**Estado:** ACTIVO

**Problema:** necesidad de UI de filtros (como Explore v1) sin activar Gate C.

**DoD / AC**
- Primera línea: filtros + cerrar buscador
- Segunda línea: input de búsqueda ancho completo
- No se introduce Radix/shadcn (Gate C pausado): usar componentes existentes/estables.

**Pruebas mínimas**
- Smoke: cambiar filtro afecta resultados/pins según contrato de Search/Explore

---

### OL-P2-002 — En buscador: teclado desaparece al hacer scroll o interactuar

**Estado:** ACTIVO

**DoD / AC**
- Scroll/tap fuera del input cierra teclado (sin cerrar Search).
- No rompe overlay/sheet ni causa jumps.

**Pruebas mínimas**
- Smoke: abrir search + teclado → scroll results → teclado se oculta

---

### OL-P2-003 — Color de pines cuando filtro “Guardados” está activo

**Estado:** ACTIVO

**Problema:** si selecciono filtro “Guardados”, los pines visitados se ven con color “visitados” y confunde.

**DoD / AC**
- Si filtro = Guardados: todos los pines visibles usan color “guardados”.
- Si filtro = Visitados: todos los pines visibles usan color “visitados”.
- Si filtro = Todos: color por estado real (guardado/visitado/etc.).

**Pruebas mínimas**
- Smoke: alternar filtros y validar consistencia visual
