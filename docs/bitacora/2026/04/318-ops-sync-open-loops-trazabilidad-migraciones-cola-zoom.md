# 318 — Ops: sincronización OPEN_LOOPS, migraciones y cola (zoom al final)

**Fecha:** 2026-04-05  
**Tipo:** Higiene documental (fuente operativa)

## Contexto

`OPEN_LOOPS.md` estaba desalineado con bitácoras recientes (`316`, `317`) y con el estado declarado de migraciones. Se reordenó la cola operativa según decisión de producto: **`OL-EXPLORE-WEB-ZOOM-GUARD-001` al final** (intento previo sin el resultado esperado en sitio; comportamiento nativo de navegador aceptable para usuarios).

## Cambios aplicados

- Cabecera **Fecha:** 2026-04-05.
- **Trazabilidad reciente:** incluye `316` (ghost refetch + contratos Explore/deep link) y `317` (focus refresh: `error` vs `missing`).
- **Migraciones** `018_*`, `020_*`, `021_*`: texto alineado con **aplicadas y verificadas** en entornos objetivo (2026-04-05).
- **Cola:** posiciones 1–9 sin zoom; posición **10:** `OL-EXPLORE-WEB-ZOOM-GUARD-001` con nota de postergación y criterio de retry.
- **Arranque activo:** próximo candidato explícito **`OL-WEB-RESPONSIVE-001`** pendiente de **declaración formal** al abrir implementación (loop ejecutivo sigue **dormido** hasta entonces).

## Política TypeScript (gate local)

- Se añade script `npm run typecheck` (`tsc --noEmit`) en `package.json`.
- Contrato sugerido antes de PR de código: `npm run lint` y `npm run typecheck` en verde.

## Evidencia

- `docs/ops/OPEN_LOOPS.md`
- `package.json` (script `typecheck`)

## Siguiente paso operativo

Tras merge de esta higiene: confirmar explícitamente si el siguiente OL activo será **`OL-WEB-RESPONSIVE-001`** e iniciar trabajo en rama dedicada (plan `PLAN_OL_WEB_RESPONSIVE_COMPONENTS_001_2026-03-28.md`).
