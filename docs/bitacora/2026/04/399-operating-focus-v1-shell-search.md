# 399 — Foco operativo V1 Next: Shell + Search

**Fecha:** 2026-04-27
**Tipo:** alineacion operativa / trazabilidad

## Contexto

Se mergeo el paquete canonico de definicion de producto (`docs/product-definition/`) y el Plan Maestro V1 quedo como fuente ejecutiva para la secuencia hacia tiendas.

Al retomar operacion, `OPEN_LOOPS` mantenia una contradiccion: el roadmap canonico indicaba como siguiente slice `OL-GLOBAL-SHELL-SEARCH-001`, pero el bloque historico seguia declarando `OL-CONTENT-001` como loop ejecutivo activo.

## Decision

El foco ejecutivo activo pasa a:

- `OL-GLOBAL-SHELL-SEARCH-001`

`OL-CONTENT-001` queda diferido como backlog de Passport/Remember-lite hasta que el shell V1 Next y el entry global de Search esten encaminados.

## Alcance minimo

- Alinear `OPEN_LOOPS` con el roadmap canonico.
- Registrar la regla operativa: Vercel no bloquea el flujo Git salvo no-go real, bloqueo de merge o instruccion explicita del usuario.
- Mantener los planes historicos como evidencia/subplanes, no como direccion competidora.

## No tocado

- Runtime.
- DB, RLS, migraciones o Storage.
- Explore actual.
- Flow profundo.
- Passport profundo.
- Pagos, marketplace o IA avanzada.

## Riesgo

- Riesgo bajo: cambio documental.
- Riesgo principal mitigado: iniciar la operacion diaria con dos focos contradictorios.

## Rollback

Revertir este commit documental y restaurar `OL-CONTENT-001` como loop activo si producto decide priorizar Remember-lite antes del shell V1 Next.

## Siguiente paso recomendado

Abrir `OL-GLOBAL-SHELL-SEARCH-001` con diagnostico selectivo de rutas/shell actual, sin tocar DB:

- identificar entrypoint actual de Explore;
- ubicar componentes de Account/Search reutilizables;
- definir flag/ruta interna V1 Next;
- crear plan de implementacion mobile-first con rollback claro.
