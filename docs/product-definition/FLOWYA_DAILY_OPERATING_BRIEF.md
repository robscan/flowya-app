# FLOWYA Daily Operating Brief

**Estado:** CANONICO / RITUAL DIARIO
**Fecha:** 2026-04-27

---

## 1. Proposito

Este brief existe para abrir cada sesion con foco, proteger la secuencia del Plan Maestro V1 y contener solicitudes fuera de orden sin perderlas.

No sustituye `OPEN_LOOPS` ni bitacoras. Es una ficha operativa corta para decidir que se ejecuta hoy y que se captura para despues.

---

## 2. Template diario

```md
# FLOWYA Daily Operating Brief — YYYY-MM-DD

## Norte activo
- Fuente canonica:
- Slice / OL actual:
- Dominio:
- JTBD:
- Historia(s):

## Foco de hoy
- Objetivo:
- Alcance minimo:
- No tocar:
- Definition of Done:

## Canon invocado hoy
- Quality Guardrails:
- Master Plan:
- Operational Roadmap:
- UX Behavioral:
- PR Operating System:
- UI Quality:
- UX Writing:
- IXD:
- Accessibility:
- Performance/Reliability:
- Privacy/Data/AI Safety:
- Store Readiness:

## Estado repo
- Rama esperada:
- Ultimo merge relevante:
- Working tree esperado:

## Riesgos / bloqueadores
- Producto:
- UX:
- UI:
- Datos:
- Runtime:
- QA:

## Parking lot
- Ideas buenas fuera de orden:
- Bugs no P0:
- Oportunidades futuras:

## Decision de desviaciones
- P0 operativo:
- Bloqueador del slice:
- Alineado al slice:
- Parking lot:
- Cambio estrategico:
```

---

## 3. Prompt de apertura diaria

Usar este prompt para desencadenar la operacion diaria en un nuevo chat:

```md
Actua como Product Architect + Operador FLOWYA.

Antes de ejecutar cualquier cosa:

1. Lee `docs/product-definition/FLOWYA_DAILY_OPERATING_BRIEF.md`.
2. Lee `docs/product-definition/FLOWYA_QUALITY_GUARDRAILS.md`.
3. Lee `docs/product-definition/FLOWYA_OPERATIONAL_ROADMAP.md`.
4. Lee `docs/ops/OPEN_LOOPS.md`.
5. Confirma rama, estado Git y ultimo commit.
6. Identifica el slice/OL activo y el foco recomendado.
7. Clasifica mi solicitud como:
   - P0 operativo
   - Bloqueador del slice actual
   - Alineado al slice
   - Parking lot
   - Cambio estrategico
8. Invoca solo los guardrails aplicables:
   - Product / Master Plan
   - Operational Roadmap
   - UX Behavioral
   - PR Operating System
   - UI Quality
   - UX Writing
   - IXD
   - Accessibility
   - Performance/Reliability
   - Privacy/Data/AI Safety
   - Store Readiness
9. Antes de implementar, define:
   - JTBD
   - historia(s)
   - alcance minimo
   - que NO tocar
   - riesgos
   - pruebas
   - rollback
10. Si mi solicitud esta fuera de orden, cuestionala y propon Parking Lot o cambio estrategico.
11. No ejecutes codigo hasta cerrar la clasificacion y el micro-scope.
```

---

## 4. Clasificacion obligatoria antes de ejecutar

Toda nueva solicitud debe clasificarse antes de ejecutarse.

| Clasificacion | Decision |
|---|---|
| P0 operativo | Se atiende ahora. |
| Bloqueador del slice actual | Se atiende si impide cerrar el objetivo activo. |
| Alineado al slice | Puede entrar si no infla alcance ni rompe DoD. |
| Parking lot | Se captura, pero no se ejecuta. |
| Cambio estrategico | Detiene ejecucion y requiere actualizar definicion/OL antes de codigo. |

---

## 5. Respuestas estandar

```text
Clasificacion: Parking Lot.
Es una buena idea, pero no bloquea el slice actual `{OL}`.
La capturo como candidato para `{dominio/OL futuro}` y no la ejecuto ahora para proteger foco.
```

```text
Clasificacion: Cambio estrategico.
Esto altera el plan vigente. Antes de ejecutar debemos actualizar contrato/OL y decidir tradeoffs.
```

```text
Clasificacion: P0 operativo.
Esto puede afectar datos/seguridad/runtime. Pauso el slice actual y diagnostico contrato + riesgo + rollback.
```

---

## 6. Reglas

- Clasifica antes de ejecutar.
- Invoca Quality Guardrails en la apertura.
- Un solo foco operativo por sesion.
- Parking lot no es basurero: debe revisarse al cerrar o abrir OL.
- Las ideas fuera de orden se respetan capturandolas, no metiendolas a la fuerza.
- Si el usuario pide algo que rompe secuencia, Codex debe cuestionarlo y proponer clasificacion.
- Vercel es senal informativa: no esperarlo para cerrar flujo Git salvo no-go real, bloqueo de merge o instruccion explicita del usuario.
