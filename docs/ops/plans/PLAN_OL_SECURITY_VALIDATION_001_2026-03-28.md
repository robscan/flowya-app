# PLAN_OL_SECURITY_VALIDATION_001_2026-03-28

## Objetivo

Ejecutar una validación de seguridad mínima pero seria sobre el estado web-first real de FLOWYA antes de seguir ampliando alcance.

## Qué debe validar

- RLS y ownership reales
- migraciones remotas críticas aplicadas
- mutaciones protegidas por auth
- ausencia de hard delete expuesto
- privacidad de geolocalización
- futura capa de analytics sin PII ni coordenadas exactas

## Contexto real del repo

Hay evidencia y loops previos de seguridad, pero no un cierre único y reciente del estado actual:

- contratos y migraciones recientes de spots
- `user_tags` / `pin_tags`
- futura instrumentación de métricas
- riesgos de deriva documental entre esquema y runtime

Referencias:

- `docs/contracts/PROFILE_AUTH_CONTRACT_CURRENT.md`
- `docs/ops/plans/PLAN_OL_PRIVACY_001_2026-03-10.md`
- `docs/ops/analysis/ANALYSIS_V1_WEB_FIRST_TO_APPSTORE_2026-03-23.md`

## Alcance

### SV-01 DB / RLS / ownership

- enumerar policies reales por tabla:
  - `spots`
  - `pins`
  - `feedback`
  - `user_tags`
  - `pin_tags`
- verificar ownership esperado
- validar escenarios A/B entre usuarios

### SV-02 Migraciones remotas

- confirmar aplicación de:
  - `018_spots_block_client_hard_delete.sql`
  - `022_spots_owner_write_guardrails.sql`
  - `020_user_tags_pin_tags.sql`
  - `021_user_tags_set_user_id_trigger.sql`

### SV-03 Runtime y mutaciones

- verificar que create/edit/delete/save/visited no operan sin auth cuando no deben
- verificar que no hay éxito falso ante rechazo RLS
- verificar que delete real no está expuesto al cliente

### SV-04 Privacidad

- validar que `userCoords` no se envían a backend/logs/analytics
- alinear disclosure con `OL-PRIVACY-001`

### SV-05 Analytics future-safe

- validar que `OL-METRICS-001` arranca con lista blanca de campos
- bloquear payloads con PII o texto libre

## No alcance

- pentest externo
- auditoría formal de compliance
- hardening de infraestructura de proveedor

## Backlog técnico sugerido

- `BT-SEC-01` Inventario real de policies y ownership.
- `BT-SEC-02` Checklist de migraciones remotas críticas.
- `BT-SEC-03` QA auth-gate de mutaciones.
- `BT-SEC-04` QA A/B de autorización cruzada.
- `BT-SEC-05` Checklist de privacidad geoloc + analytics.
- `BT-SEC-06` Documento de cierre con hallazgos, severidad y follow-ups.

## Criterio de cierre

Se considera cerrado cuando:

1. Se sabe qué policies están activas y cómo afectan cada tabla core.
2. Las migraciones remotas críticas están confirmadas o escaladas.
3. Las mutaciones core no dejan huecos de auth o ownership.
4. Geoloc y analytics respetan el contrato de privacidad.
5. Existe un documento de hallazgos y follow-ups, aunque no todo se corrija en el mismo loop.

## Posición en roadmap

Debe ejecutarse antes de perfil robusto, antes de social login y antes de monetización.
