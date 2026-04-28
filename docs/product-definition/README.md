# FLOWYA Product Definition

**Estado:** CANONICO
**Fecha:** 2026-04-27

Esta carpeta concentra la definicion estrategica de producto. Su objetivo es evitar que decisiones de arquitectura, UX, behavioral design, datos, membresias y navegacion queden dispersas entre planes operativos.

## Documentos canonicos

1. [`FLOWYA_V1_MASTER_PLAN.md`](FLOWYA_V1_MASTER_PLAN.md)
   - Plan maestro V1.
   - Dominios, shell, modelo de informacion, JTBD, historias, secuencia OL, gates, membresias y estrategia de reconstruccion.

2. [`FLOWYA_UX_BEHAVIORAL_FOUNDATION.md`](FLOWYA_UX_BEHAVIORAL_FOUNDATION.md)
   - Usuario objetivo, JTBD por nivel, modelo mental, principios UX, Octalysis y Laws of UX.

3. [`FLOWYA_PRODUCT_ARCHITECTURE_REVIEW_2026-04-27.md`](FLOWYA_PRODUCT_ARCHITECTURE_REVIEW_2026-04-27.md)
   - Revision critica de coherencia producto/UX/behavioral/design/data antes de ejecutar desarrollo.
   - Define gaps, riesgos y ajustes estructurales.

4. [`FLOWYA_PR_OPERATING_SYSTEM.md`](FLOWYA_PR_OPERATING_SYSTEM.md)
   - Sistema diario de trabajo por roles para OL/PR.
   - Define roles, prompts, Definition of Ready/Done, no-go triggers y reglas de conflicto.

5. [`FLOWYA_QUALITY_GUARDRAILS.md`](FLOWYA_QUALITY_GUARDRAILS.md)
   - Indice obligatorio de guardrails por area.
   - Define que documento se invoca segun el tipo de decision o PR.

6. [`FLOWYA_DAILY_OPERATING_BRIEF.md`](FLOWYA_DAILY_OPERATING_BRIEF.md)
   - Ritual diario para abrir sesiones con foco, clasificar desviaciones y proteger el slice activo.
   - Incluye el prompt oficial de apertura diaria.

7. [`FLOWYA_UI_QUALITY_SYSTEM.md`](FLOWYA_UI_QUALITY_SYSTEM.md)
   - Reglas de calidad visual, tokens, templates, componentes canonicos, estados y QA visual.

8. [`FLOWYA_UX_WRITING_SYSTEM.md`](FLOWYA_UX_WRITING_SYSTEM.md)
   - Voz, tono, microcopy, errores, empty states, paywalls, anti-manipulacion e i18n.

9. [`FLOWYA_INTERACTION_DESIGN_SYSTEM.md`](FLOWYA_INTERACTION_DESIGN_SYSTEM.md)
   - Reglas IXD de navegacion, gestos, feedback, transitions, control y reversibilidad.

10. [`FLOWYA_ACCESSIBILITY_SYSTEM.md`](FLOWYA_ACCESSIBILITY_SYSTEM.md)
   - Reglas de accesibilidad mobile, mapa, foco, touch targets, contraste y reduced motion.

11. [`FLOWYA_PERFORMANCE_RELIABILITY_SYSTEM.md`](FLOWYA_PERFORMANCE_RELIABILITY_SYSTEM.md)
   - Reglas de performance y confiabilidad para mapa, Search, media, red, listas y acciones persistentes.

12. [`FLOWYA_PRIVACY_DATA_AI_SAFETY_SYSTEM.md`](FLOWYA_PRIVACY_DATA_AI_SAFETY_SYSTEM.md)
   - Reglas de privacidad, datos, RLS, Storage, IA, membresia y safety.

13. [`FLOWYA_STORE_READINESS_SYSTEM.md`](FLOWYA_STORE_READINESS_SYSTEM.md)
   - Reglas para App Store y Play Store: permisos, privacidad, account deletion, UGC, IAP, metadata, performance, review notes y release candidate.

14. [`FLOWYA_OPERATIONAL_ROADMAP.md`](FLOWYA_OPERATIONAL_ROADMAP.md)
   - Plan operativo critical-path hacia tiendas.
   - Define fases, gates, cadencia, contencion de ideas y decision usar/adaptar/reconstruir.

15. [`FLOWYA_V1_PLATFORM_CONVERGENCE_ARCHITECTURE.md`](FLOWYA_V1_PLATFORM_CONVERGENCE_ARCHITECTURE.md)
   - Arquitectura de convergencia V1 por plataforma.
   - Define que web actual es referencia/legacy, no objetivo de copia; establece jerarquia iOS/Android, clasificacion conservar/adaptar/reconstruir/retirar, renderer de mapa y reglas de convergencia V1.

## Regla operativa

Todo OL o PR estrategico debe mapear a estos documentos antes de ejecucion.

Los planes historicos en `docs/ops/plans/` quedan como evidencia o subplanes tecnicos; no deben competir con esta carpeta como fuente de direccion.

En cada apertura diaria debe invocarse [`FLOWYA_QUALITY_GUARDRAILS.md`](FLOWYA_QUALITY_GUARDRAILS.md) y activar selectivamente los documentos aplicables al slice.
