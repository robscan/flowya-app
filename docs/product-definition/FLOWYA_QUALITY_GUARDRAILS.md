# FLOWYA Quality Guardrails

**Estado:** CANONICO / INVOCACION OBLIGATORIA
**Fecha:** 2026-04-27

---

## 1. Proposito

Este documento evita que las definiciones se vuelvan obsoletas. Cada apertura diaria, OL y PR debe invocar la definicion canonica aplicable, no depender de memoria humana.

Regla central:

> Si una decision toca producto, UX, UI, IXD, copy, datos, seguridad, performance, accesibilidad, IA, membresia o QA, debe mapear a su guardrail canonico antes de ejecutarse.

---

## 2. Fuentes canonicas por area

| Area | Documento | Cuando aplica |
|---|---|---|
| Producto / arquitectura | [`FLOWYA_V1_MASTER_PLAN.md`](FLOWYA_V1_MASTER_PLAN.md) | Siempre que cambie alcance, dominio, modelo o secuencia. |
| Roadmap operativo | [`FLOWYA_OPERATIONAL_ROADMAP.md`](FLOWYA_OPERATIONAL_ROADMAP.md) | Para priorizar critical path, orden de OL, gates y decisiones usar/adaptar/reconstruir. |
| Convergencia de plataforma V1 | [`FLOWYA_V1_PLATFORM_CONVERGENCE_ARCHITECTURE.md`](FLOWYA_V1_PLATFORM_CONVERGENCE_ARCHITECTURE.md) | Siempre que toque iOS/Android, web, shell, mapa, Search, renderer, paridad/convergencia o decisiones multiplataforma. |
| Usuario / behavioral | [`FLOWYA_UX_BEHAVIORAL_FOUNDATION.md`](FLOWYA_UX_BEHAVIORAL_FOUNDATION.md) | Siempre que toque JTBD, comportamiento, gamificacion o motivacion. |
| Revision critica | [`FLOWYA_PRODUCT_ARCHITECTURE_REVIEW_2026-04-27.md`](FLOWYA_PRODUCT_ARCHITECTURE_REVIEW_2026-04-27.md) | Antes de ejecucion grande o cambio estrategico. |
| Operacion diaria | [`FLOWYA_DAILY_OPERATING_BRIEF.md`](FLOWYA_DAILY_OPERATING_BRIEF.md) | En toda apertura de sesion. |
| PR / roles | [`FLOWYA_PR_OPERATING_SYSTEM.md`](FLOWYA_PR_OPERATING_SYSTEM.md) | En todo PR/OL. |
| UI | [`FLOWYA_UI_QUALITY_SYSTEM.md`](FLOWYA_UI_QUALITY_SYSTEM.md) | Todo cambio visual, componente, layout o template. |
| UX Writing | [`FLOWYA_UX_WRITING_SYSTEM.md`](FLOWYA_UX_WRITING_SYSTEM.md) | Todo texto visible, error, empty state, paywall, toast o onboarding. |
| Interaction Design | [`FLOWYA_INTERACTION_DESIGN_SYSTEM.md`](FLOWYA_INTERACTION_DESIGN_SYSTEM.md) | Navegacion, gestos, sheets, transitions, inputs, feedback. |
| Accesibilidad | [`FLOWYA_ACCESSIBILITY_SYSTEM.md`](FLOWYA_ACCESSIBILITY_SYSTEM.md) | Todo cambio UI/UX, especialmente mobile, inputs, modales y icon buttons. |
| Performance / reliability | [`FLOWYA_PERFORMANCE_RELIABILITY_SYSTEM.md`](FLOWYA_PERFORMANCE_RELIABILITY_SYSTEM.md) | Runtime, mapa, search, media, network, startup, lists, expensive operations. |
| Privacy / data / AI safety | [`FLOWYA_PRIVACY_DATA_AI_SAFETY_SYSTEM.md`](FLOWYA_PRIVACY_DATA_AI_SAFETY_SYSTEM.md) | Datos, RLS, Storage, IA, recomendaciones, membresia, fotos, recuerdos. |
| Store readiness | [`FLOWYA_STORE_READINESS_SYSTEM.md`](FLOWYA_STORE_READINESS_SYSTEM.md) | Mobile, permisos, auth, fotos, UGC, pagos, metadata, release y validacion de tiendas. |

---

## 3. Invocacion en apertura diaria

Cada apertura debe declarar:

```md
## Canon invocado hoy
- Master Plan:
- V1 Platform Convergence:
- Operational Roadmap:
- UX Behavioral:
- Daily Brief:
- PR Operating System:
- UI Quality:
- UX Writing:
- IXD:
- Accessibility:
- Performance/Reliability:
- Privacy/Data/AI Safety:
- Store Readiness:
```

No hace falta leer todos los documentos completos cada vez. Pero si el slice toca un area, el documento correspondiente debe consultarse selectivamente y respetarse.

---

## 4. Clasificacion por solicitud

Antes de ejecutar:

1. Clasificar la solicitud con `FLOWYA_DAILY_OPERATING_BRIEF`.
2. Mapear la solicitud a historias/JTBD del Master Plan.
3. Activar roles del `FLOWYA_PR_OPERATING_SYSTEM`.
4. Activar guardrails por area.
5. Definir alcance minimo, no tocar, riesgo, pruebas y rollback.

---

## 5. Regla anti-obsolescencia

Un documento canonico debe actualizarse cuando:

- una decision cambia su regla;
- un PR introduce un nuevo patron;
- un bug revela que la regla era insuficiente;
- una historia queda fuera de los guardrails;
- se detecta contradiccion entre documentos.

No crear documento nuevo si uno existente puede ampliarse sin perder claridad.

---

## 6. No-go

No ejecutar si:

- no se sabe que guardrail aplica;
- el cambio contradice un guardrail sin decision explicita;
- se intenta resolver por gusto visual sin JTBD;
- se introduce patron nuevo sin UI/IXD/UXW;
- se toca datos/privacidad/IA sin safety review;
- se toca performance-sensitive runtime sin plan de medicion o rollback.
- se toca mobile/release/permisos/pagos/UGC sin Store Readiness.
