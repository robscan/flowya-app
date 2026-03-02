# 265 — Gamification Flows V1: consolidación de sheet, modal, share card y overlay de mapa

Fecha: 2026-03-01  
Tipo: Producto + UX/UI + Runtime + Documentación  
Área: Explore (`MapScreenVNext`, `CountriesSheet`, `share card`) + contratos

## Resumen ejecutivo

Se consolida el bloque de gamificación en torno a una decisión canónica:

- **V1 activa**: score simple por países + spots.
- **Naming UX**: el usuario ve **flows** (no “points”).
- **Niveles**: escala de 12 niveles, con referencia `X/12` y modal explicativo.
- **Share card**: composición final alineada al lenguaje visual del sheet (fondo sólido por filtro, mapa protagonista, top 3, marca `flowya.app`).

Además se documenta V2 (telemetría + calibración), sin activarla todavía en runtime.

## Decisiones de producto cerradas

1. Mantener V1 de score para no frenar entrega.
2. Posponer V2 (distancia + DB de eventos) a fase posterior.
3. Unificar términos visibles a usuario en **flows**.
4. Mantener barra de nivel solo en `visitados`; en `por visitar` no aplica.
5. Usar chip de flows sobre perfil como detonador de acción (motivación ligera, no invasiva).

## Cambios funcionales consolidados

### 1) Score y niveles

- Fuente canónica: `lib/traveler-levels.ts`.
- Fórmula V1 activa:
  - `flows = countries * 120 + spots * 8`
- Resolución de nivel por score total (`resolveTravelerLevelByPoints`).
- Escala de 12 niveles con nomenclatura neutra y consistente estilo FLOWYA.

### 2) CountriesSheet

- KPI izquierdo muestra flows:
  - `visitados`: `flows`
  - `por visitar`: `flows por obtener`
- Barra de progreso (`visitados`):
  - izquierda: `Nivel: <NombreNivel>`
  - derecha: `X/12` + icono listado (accionable)
- Modal de niveles:
  - estructura de filas simple (sin cards envolventes),
  - fila actual resaltada,
  - cierre con botón circular de icono,
  - copy y jerarquía visual alineadas al sheet.

### 3) Chip de flows en mapa

- Se agrega chip sobre icono de perfil con total de flows.
- Chip adaptativo al ancho del número.
- Tap en chip: toast contextual para incentivar marcar lugares visitados.

### 4) Share card de países

- Rediseño para paridad compositiva con sheet:
  - fondo sólido por filtro (sin degradado),
  - sin contenedores “card dentro de card”,
  - mapa más protagonista,
  - copy KPI: `% de 195`,
  - top países reducido a top 3,
  - marca final `flowya.app`.
- Comportamiento web:
  - share nativo cuando está disponible,
  - fallback de descarga local cuando no hay share nativo.

### 5) Ajuste de overlays en mapa

- Corrección de inset horizontal para mejorar simetría visual entre lado izquierdo (perfil/flowya) y controles del lado derecho.

## Riesgos detectados durante QA y criterio aplicado

1. **Riesgo de inconsistencia terminológica** (points vs flows).
- Criterio: UX siempre en flows; points quedan como naming técnico interno.

2. **Riesgo de sobrecarga visual en share card**.
- Criterio: simplificar estructura, priorizar mapa y legibilidad.

3. **Riesgo de aprendizaje pobre de gamificación**.
- Criterio: chip + toast de incentivo + modal de niveles explicativo.

4. **Riesgo de desalineación futura por ajustes sueltos**.
- Criterio: centralizar contrato en `GAMIFICATION_TRAVELER_LEVELS.md` y usar fuente canónica de niveles.

## Documentación actualizada en este bloque

- `docs/contracts/GAMIFICATION_TRAVELER_LEVELS.md` (V1 detallada + V2 clara)
- `docs/contracts/INDEX.md` (incluye contrato de gamificación)
- `docs/ops/OPEN_LOOPS.md` (estado activo y pendientes reales)
- `docs/ops/CURRENT_STATE.md` (snapshot actualizado)

## Estado

- Bloque de gamificación V1: **consolidado para continuar QA**.
- V2: **documentada, no implementada**.
