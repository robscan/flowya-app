# 398 — Plan Maestro V1 FLOWYA

Fecha: 2026-04-27

## Contexto

El usuario pidio detener la ejecucion fragmentada de OL/planes y bajar una arquitectura completa de producto para FLOWYA: `Explore`, `Flow`, `Passport`, `Account`, Search global, membresias, mobile-first para tiendas, jobs to be done e historias de usuario.

Tambien pidio evaluar una reconstruccion estrategica: construir una nueva version mobile-first en paralelo mientras la pantalla actual se mantiene temporalmente.

## Decision

Se crea una carpeta canonica de definicion de producto:

- [`docs/product-definition/`](../../../product-definition/README.md)

La carpeta pasa a ser la fuente ejecutiva para:

- plan maestro V1;
- user research & UX behavioral foundation;
- revision critica producto/UX/behavioral/data;
- sistema diario de trabajo por roles para OL/PR;
- roadmap operativo critical-path hacia tiendas;
- daily operating brief para foco y contencion de desviaciones;
- prompt oficial de apertura diaria;
- quality guardrails para invocacion obligatoria de definiciones por area;
- sistema de calidad UI;
- sistema UX Writing;
- sistema Interaction Design;
- sistema Accessibility;
- sistema Performance/Reliability;
- sistema Privacy/Data/AI Safety;
- sistema Store Readiness para App Store y Play Store;
- vision V1;
- shell canonico;
- dominios;
- Search global;
- modelo de informacion;
- JTBD;
- historias de usuario;
- membresias;
- vitrina del sistema de diseno;
- deprecation register;
- secuencia de OL.

Documentos iniciales:

- [`FLOWYA_V1_MASTER_PLAN.md`](../../../product-definition/FLOWYA_V1_MASTER_PLAN.md)
- [`FLOWYA_UX_BEHAVIORAL_FOUNDATION.md`](../../../product-definition/FLOWYA_UX_BEHAVIORAL_FOUNDATION.md)
- [`FLOWYA_PRODUCT_ARCHITECTURE_REVIEW_2026-04-27.md`](../../../product-definition/FLOWYA_PRODUCT_ARCHITECTURE_REVIEW_2026-04-27.md)
- [`FLOWYA_PR_OPERATING_SYSTEM.md`](../../../product-definition/FLOWYA_PR_OPERATING_SYSTEM.md)
- [`FLOWYA_OPERATIONAL_ROADMAP.md`](../../../product-definition/FLOWYA_OPERATIONAL_ROADMAP.md)
- [`FLOWYA_DAILY_OPERATING_BRIEF.md`](../../../product-definition/FLOWYA_DAILY_OPERATING_BRIEF.md)
- [`FLOWYA_QUALITY_GUARDRAILS.md`](../../../product-definition/FLOWYA_QUALITY_GUARDRAILS.md)
- [`FLOWYA_UI_QUALITY_SYSTEM.md`](../../../product-definition/FLOWYA_UI_QUALITY_SYSTEM.md)
- [`FLOWYA_UX_WRITING_SYSTEM.md`](../../../product-definition/FLOWYA_UX_WRITING_SYSTEM.md)
- [`FLOWYA_INTERACTION_DESIGN_SYSTEM.md`](../../../product-definition/FLOWYA_INTERACTION_DESIGN_SYSTEM.md)
- [`FLOWYA_ACCESSIBILITY_SYSTEM.md`](../../../product-definition/FLOWYA_ACCESSIBILITY_SYSTEM.md)
- [`FLOWYA_PERFORMANCE_RELIABILITY_SYSTEM.md`](../../../product-definition/FLOWYA_PERFORMANCE_RELIABILITY_SYSTEM.md)
- [`FLOWYA_PRIVACY_DATA_AI_SAFETY_SYSTEM.md`](../../../product-definition/FLOWYA_PRIVACY_DATA_AI_SAFETY_SYSTEM.md)
- [`FLOWYA_STORE_READINESS_SYSTEM.md`](../../../product-definition/FLOWYA_STORE_READINESS_SYSTEM.md)

## Postura sobre reconstruccion

Se recomienda reconstruccion estrategica por strangler:

- crear superficie V1 Next aislada;
- mobile-first iOS/Android;
- conservar pantalla actual hasta paridad operacional;
- deprecar con inventario;
- no hacer reescritura total ni borrar flujos existentes sin reemplazo probado.

## Alcance

Solo documental/operativo.

No se tocaron:

- runtime;
- DB;
- RLS;
- Storage;
- secretos;
- migraciones.

## Proximo paso recomendado

Ejecutar `OL-GLOBAL-SHELL-SEARCH-001` despues de aprobacion del plan:

- bottom nav `Explore/Flow/Passport`;
- avatar top-left para Account;
- Search global top-right;
- superficie V1 Next mobile-first bajo flag/ruta interna.
