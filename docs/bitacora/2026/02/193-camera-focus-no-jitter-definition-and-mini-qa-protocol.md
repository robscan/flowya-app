# 193 — Camera/focus no-jitter definition + mini QA protocol

Fecha: 2026-02-27
Tipo: planificación / criterios de aceptación

## Contexto
Se solicitó una propuesta precisa de cámara/foco para evitar comportamiento subjetivo y prevenir "temblores" antes de ejecutar Fase 2 del roadmap WOW.

## Cambios
- Se actualizó `docs/ops/plans/PLAN_WOW_ROADMAP_3_FASES.md` con:
  - Definición operativa de modos de cámara (`discover/inspect/act`).
  - Guardrails anti-jitter explícitos.
  - Protocolo de mini QA secuencial con regla de no avanzar si un paso falla.

## Resultado
- El alcance de cámara/foco deja de ser abstracto y queda evaluable con criterios concretos.
- UX puede aprobar/rechazar comportamiento por modo antes de integración total.

## Siguiente paso
- Ejecutar `OL-WOW-F2-005` respetando este protocolo y registrando evidencia por cada mini prueba.
