# 401 — Convergencia V1: no paridad con web actual

**Fecha:** 2026-04-27
**Tipo:** decision estrategica / arquitectura de plataforma

## Contexto

Tras corregir el P0 donde iOS Simulator mostraba `Map available on web.`, surgio una pregunta estrategica:

> Si web e iOS no estan en paridad, procedemos terminando web primero y luego atacamos app?

La respuesta inicial de "mobile-first parity" era insuficiente porque podia interpretarse como copiar la web actual en iOS/Android. Producto corrigio el punto: la web actual tambien estaba destinada a reestructuracion, por lo tanto no debe convertirse en target.

## Decision

FLOWYA no busca paridad con la web actual.

FLOWYA busca **convergencia hacia el target V1 mobile-first**.

Web actual queda como:

- referencia;
- evidencia;
- legacy estable;
- fuente de logica o componentes rescatables;
- superficie en soporte.

Producto aclara que no se debe desperdiciar el aprendizaje ganado con pruebas web: se rescatan aprendizajes, reglas, datos, comportamiento probado y piezas utiles. Pero no hay obligacion de conservar implementaciones que hereden errores.

Web actual no queda como:

- diseno objetivo;
- contrato canonico de UI;
- fuente de verdad de navegacion;
- razon para diferir iOS/Android;
- modelo que mobile deba copiar.

## Regla operativa

Toda pieza existente debe clasificarse antes de reutilizarse:

- conservar;
- adaptar;
- reconstruir;
- retirar.

Ninguna pieza se porta por inercia.

Producto autoriza reconstruir piezas cuando copiar/adaptar sea peor que crear una version V1 limpia.

## Impacto en `OL-GLOBAL-SHELL-SEARCH-001`

El shell V1 debe nacer desde el target:

- bottom nav `Explore/Flow/Passport`;
- avatar Account top-left;
- Search top-right;
- safe areas y gestos mobile;
- iOS Simulator smoke;
- web no roto;
- sin copiar patrones sidebar/hover/web-only.

## No tocado

- Runtime.
- DB.
- RLS.
- Storage.
- Dependencias.
- Pantallas productivas.

## Riesgo mitigado

Evita invertir esfuerzo en llevar iOS/Android hacia una web transitoria que luego habria que reestructurar de nuevo.

## Rollback

Revertir esta decision documental si producto decide explicitamente que web actual sera el target canonico. Esa decision requeriria actualizar Master Plan, Roadmap y Store Readiness, porque contradice el objetivo mobile-first de tiendas.
