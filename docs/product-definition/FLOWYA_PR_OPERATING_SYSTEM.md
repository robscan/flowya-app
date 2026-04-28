# FLOWYA PR Operating System

**Estado:** CANONICO / SISTEMA DIARIO DE TRABAJO
**Fecha:** 2026-04-27
**Fuentes:** [`FLOWYA_QUALITY_GUARDRAILS.md`](FLOWYA_QUALITY_GUARDRAILS.md), [`FLOWYA_V1_MASTER_PLAN.md`](FLOWYA_V1_MASTER_PLAN.md), [`FLOWYA_UX_BEHAVIORAL_FOUNDATION.md`](FLOWYA_UX_BEHAVIORAL_FOUNDATION.md), [`FLOWYA_PRODUCT_ARCHITECTURE_REVIEW_2026-04-27.md`](FLOWYA_PRODUCT_ARCHITECTURE_REVIEW_2026-04-27.md), [`FLOWYA_DAILY_OPERATING_BRIEF.md`](FLOWYA_DAILY_OPERATING_BRIEF.md), [`FLOWYA_UI_QUALITY_SYSTEM.md`](FLOWYA_UI_QUALITY_SYSTEM.md), [`FLOWYA_UX_WRITING_SYSTEM.md`](FLOWYA_UX_WRITING_SYSTEM.md), [`FLOWYA_INTERACTION_DESIGN_SYSTEM.md`](FLOWYA_INTERACTION_DESIGN_SYSTEM.md), [`FLOWYA_ACCESSIBILITY_SYSTEM.md`](FLOWYA_ACCESSIBILITY_SYSTEM.md), [`FLOWYA_PERFORMANCE_RELIABILITY_SYSTEM.md`](FLOWYA_PERFORMANCE_RELIABILITY_SYSTEM.md), [`FLOWYA_PRIVACY_DATA_AI_SAFETY_SYSTEM.md`](FLOWYA_PRIVACY_DATA_AI_SAFETY_SYSTEM.md), [`FLOWYA_STORE_READINESS_SYSTEM.md`](FLOWYA_STORE_READINESS_SYSTEM.md)

---

## 1. Proposito

Este documento define como debe trabajar FLOWYA en cada OL/PR para evitar ejecucion superficial, deuda de producto y decisiones inconsistentes.

Los roles son lentes de calidad y ownership. No son teatro de proceso. Cada PR activa solo los roles relevantes para su alcance.

Objetivos:

- asegurar que cada PR resuelve un JTBD real;
- separar producto, UX, UI, copy, frontend, backend y QA;
- hacer explicitos riesgos, tradeoffs y rollback;
- evitar manipulacion conductual;
- proteger datos, privacidad, RLS y Storage;
- mantener una app mobile-first, emocional, map-first y simple de consultar.

---

## 2. Roles canonicos

### Product Architect

Responsable de intencion, alcance, tradeoffs, secuencia y no-go.

Preguntas:

- Que JTBD resuelve?
- Que historia(s) del Master Plan cubre?
- Que no toca?
- Cual es el riesgo de producto?
- Que decision estrategica queda tomada?
- Es V1 o backlog futuro?
- El cambio respeta que FLOWYA es emocional, exploratorio y map-first?

### UX Designer

Responsable de flujo, jerarquia, navegacion, estados y control del usuario.

Preguntas:

- El usuario entiende donde esta?
- Sabe que puede hacer ahora?
- Puede volver, cerrar o deshacer?
- Hay dead ends?
- La progressive disclosure esta bien aplicada?
- El mapa muestra una intencion dominante?
- El flujo reduce incertidumbre sin quitar control?

### UI Designer

Responsable de sistema visual, composicion, componentes, responsive y vitrina.

Preguntas:

- Usa componentes/tokens canonicos?
- Se ve correcto en mobile primero?
- Tiene estados loading, empty, error, disabled y premium si aplica?
- Hay riesgo de saturacion visual?
- Texto y controles no se solapan?
- Debe pasar por vitrina/design system antes de runtime?
- Se mantiene simple, ordenado y facil de consultar?

### Interaction Designer

Responsable de navegacion, gestos, feedback, transitions, estado async, control y reversibilidad.

Preguntas:

- Cual es la intencion dominante de la superficie?
- El usuario tiene back/cerrar/deshacer?
- Cada accion tiene feedback?
- Los gestos tienen alternativa visible?
- Hay riesgo de doble tap o duplicado?
- La transicion orienta o solo decora?
- Las acciones sensibles tienen confirmacion/control explicito?

### UX Writer

Responsable de claridad, tono, microcopy, errores, empty states y paywalls.

Preguntas:

- El copy reduce ansiedad?
- Explica que paso y que puede hacer el usuario?
- Evita culpa, FOMO, urgencia falsa y presion?
- Diferencia informacion, recomendacion y accion?
- Los errores son accionables?
- El paywall explica valor real sin manipular?
- El texto funciona en varios idiomas o deja preparada la localizacion?
- Cumple [`FLOWYA_UX_WRITING_SYSTEM.md`](FLOWYA_UX_WRITING_SYSTEM.md)?

### Frontend Dev

Responsable de implementacion mobile/web, performance, accesibilidad y mantenibilidad.

Preguntas:

- Es mobile-first y seguro para iOS/Android?
- Evita patrones web-only en flujo mobile?
- Reutiliza componentes/helpers existentes?
- Evita duplicar logica?
- Maneja loading/error/offline/lento?
- Tiene a11y minima?
- El rollback es claro?

### Backend Dev

Responsable de datos, contratos, migraciones, RLS, APIs, Storage y rollback.

Preguntas:

- Que contrato de datos toca?
- Hay introspeccion/contraste con runtime?
- RLS se mantiene correcta?
- La migracion es aditiva o tiene backup?
- Hay hard delete? Si si, hay aprobacion explicita?
- Storage se toca por API, nunca por SQL?
- Hay unique constraints o dedupe donde aplica?
- No se guardan secretos?

### QA / Reviewer

Responsable de riesgos, regresiones, criterios de aceptacion y evidencia.

Preguntas:

- Que regresiones son probables?
- Que casos manuales son obligatorios?
- Que pruebas automatizadas aplican?
- Que screenshots/builds/logs hacen falta?
- Que bloquea merge?
- Que queda como deuda aceptada?
- El PR cumple su Definition of Done?

---

## 3. Cuando aplica cada rol

| Tipo de PR | Product | UX | UI | UXW | FE | BE | QA |
|---|---:|---:|---:|---:|---:|---:|---:|
| Tipo de PR | Product | UX | IXD | UI | UXW | FE | BE | QA |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Documental estrategico | Si | Si | Opcional | Opcional | Si | No | No | Si |
| Shell / navegacion | Si | Si | Si | Si | Si | Si | No | Si |
| Search | Si | Si | Si | Si | Si | Si | Si si toca datos/API | Si |
| Geo / modelo de datos | Si | Si | Opcional | Opcional | Opcional | Si si toca UI | Si | Si |
| Sheet / flujo UX | Si | Si | Si | Si | Si | Si | Si si persiste | Si |
| Flow / Passport | Si | Si | Si | Si | Si | Si | Si | Si |
| Account / membresia | Si | Si | Si | Si | Si | Si | Si | Si |
| Copy only | Si | Si | Opcional | Opcional | Si | Si si toca runtime | No | Si |
| DB/RLS/Storage | Si | Opcional | No | No | Opcional | Si si consumidor cambia | Si | Si |
| Bugfix pequeno | Si | Segun impacto | Segun impacto | Segun impacto | Segun copy | Si | Segun datos | Si |

Regla:

- Si un PR toca datos o privacidad, Backend y QA aplican.
- Si un PR toca una decision visible para usuario, UX y UXW aplican.
- Si un PR toca navegacion, gestos, feedback, transitions o async state, IXD aplica.
- Si un PR toca componentes o layout, UI y FE aplican.
- Si un PR cambia alcance, Product aplica siempre.

---

## 4. Definition of Ready

Un PR no debe iniciar si no puede responder:

1. Que JTBD resuelve?
2. Que historia(s) cubre?
3. Cual es el alcance minimo?
4. Que no toca?
5. Que contrato o documento canonico aplica?
6. Cuales roles aplican?
7. Cual es el riesgo principal?
8. Cual es el rollback?
9. Que evidencia se necesita para cerrar?

Excepcion:

- Bug P0 runtime puede iniciar con diagnostico parcial, pero debe documentar contrato/riesgo/rollback antes de merge.

---

## 5. Definition of Done

Un PR esta listo cuando:

- cubre una historia o micro-scope claro;
- actualiza docs/bitacora si cambia contrato, decision o estado;
- no introduce deuda de dominio no autorizada;
- cumple roles aplicables;
- tiene pruebas/evidencia acordes al riesgo;
- define rollback;
- deja el repo limpio;
- no guarda secretos;
- no cambia RLS/Storage/DB sin verificacion;
- no usa behavioral design manipulativo.
- cumple los guardrails aplicables segun [`FLOWYA_QUALITY_GUARDRAILS.md`](FLOWYA_QUALITY_GUARDRAILS.md).
- cumple Store Readiness si toca mobile, permisos, auth, UGC, fotos, pagos, metadata o release.

---

## 6. Prompt operativo por PR

Cada PR debe incluir este bloque, completando solo roles aplicables:

```md
## Product / JTBD
- JTBD:
- Historia(s):
- Alcance:
- No toca:
- Tradeoff:

## Role Review Prompts
- Product Architect:
- UX Designer:
- Interaction Designer:
- UI Designer:
- UX Writer:
- Frontend Dev:
- Backend Dev:
- QA / Reviewer:

## Riesgo y rollback
- Riesgo principal:
- Rollback:

## Evidencia
- Tests:
- QA manual:
- Docs/bitacora:
- Store Readiness si aplica:
```

---

## 7. Prompts por rol

### Product Architect prompt

```text
Evalua este PR como Product Architect de FLOWYA.
Confirma que resuelve un JTBD real, que el alcance es minimo, que no invade otro dominio y que respeta el Master Plan.
Senala tradeoffs, no-go decisions, deuda aceptada y si debe moverse a backlog.
```

### UX Designer prompt

```text
Evalua este PR como UX Designer.
Revisa flujo, jerarquia, navegacion, back/cerrar/deshacer, progressive disclosure, control del usuario y ausencia de dead ends.
Confirma que el mapa/sheet/search muestran una intencion dominante y que el usuario no pierde contexto.
```

### UI Designer prompt

```text
Evalua este PR como UI Designer.
Revisa consistencia visual, componentes canonicos, estados, densidad, mobile-first, iOS/Android, responsive, accesibilidad visual y necesidad de vitrina.
Bloquea patrones nuevos no documentados o UI saturada.
```

### Interaction Designer prompt

```text
Evalua este PR como Interaction Designer.
Usa FLOWYA_INTERACTION_DESIGN_SYSTEM.md como fuente. Revisa intencion dominante, navegacion, gestos, feedback, transitions, estado async, back/cerrar/deshacer y control explicito para acciones sensibles.
Bloquea interacciones que creen duplicados, oculten contexto o dependan solo de gestos invisibles.
```

### UX Writer prompt

```text
Evalua este PR como UX Writer.
Revisa microcopy, errores, empty states, paywalls, tono emocional y claridad.
El copy debe reducir ansiedad, explicar accion siguiente y evitar FOMO, culpa, urgencia falsa o presion.
```

### Frontend Dev prompt

```text
Evalua este PR como Frontend Dev.
Revisa arquitectura de componentes, reutilizacion, performance, estado async, mobile-first, accesibilidad, errores, rollback y ausencia de logica duplicada.
```

### Backend Dev prompt

```text
Evalua este PR como Backend Dev.
Revisa contratos de datos, RLS, migraciones, indices, dedupe, Storage API, rollback, introspeccion previa y seguridad.
Bloquea hard delete sin aprobacion y cualquier secreto persistido.
```

### QA / Reviewer prompt

```text
Evalua este PR como QA / Reviewer.
Identifica regresiones probables, pruebas automatizadas, QA manual, edge cases, evidencia requerida y bloqueadores de merge.
Prioriza riesgos P0/P1 antes de detalles menores.
```

---

## 8. No-go triggers

Un PR debe detenerse si:

- no mapea a JTBD o historia;
- crea pais/region/ciudad como `spot`;
- mezcla dominios sin contrato;
- agrega gamificacion manipulativa;
- bloquea privacidad o seguridad tras paywall;
- toca RLS sin verificacion;
- borra datos o Storage sin aprobacion explicita;
- borra Storage por SQL;
- guarda secretos;
- rompe mobile-first;
- introduce Search global sin jerarquia/fuente clara;
- usa IA para persistir decisiones sin confirmacion;
- toca mobile/release/permisos/pagos/UGC sin revisar [`FLOWYA_STORE_READINESS_SYSTEM.md`](FLOWYA_STORE_READINESS_SYSTEM.md);
- no tiene rollback para cambio riesgoso.

---

## 9. Reglas de conflicto

Cuando roles entren en conflicto:

1. Seguridad/privacidad gana sobre velocidad.
2. Control del usuario gana sobre automatizacion.
3. JTBD gana sobre feature deseada.
4. Mobile-first gana sobre comodidad web.
5. Datos canonicos ganan sobre atajos UI.
6. Simplicidad V1 gana sobre ambicion V2.
7. Evidencia gana sobre opinion.

Decision final:

- Product Architect decide alcance.
- Backend Dev puede bloquear por seguridad/datos.
- QA puede bloquear por regresion P0/P1.
- UX/UXW pueden bloquear por manipulacion, confusion critica o perdida de control.

---

## 10. Aplicacion al siguiente slice

Siguiente slice recomendado:

- `OL-GLOBAL-SHELL-SEARCH-001`

Roles aplicables:

- Product Architect;
- UX Designer;
- UI Designer;
- UX Writer;
- Frontend Dev;
- QA / Reviewer.

Backend Dev no aplica salvo que el slice persista datos o cambie auth/membresia.

Prompts clave:

- Product: validar que el shell no reconstruye dominios prematuramente.
- UX: validar bottom nav, avatar Account y Search global sin conflicto de superficies.
- UI: validar mobile-first iOS/Android y estados basicos.
- UXW: validar labels simples, no promesas excesivas.
- FE: validar feature flag/ruta interna, no romper Explore actual.
- QA: validar navegacion, back/cerrar, tab persistence y no regresion de Explore.
