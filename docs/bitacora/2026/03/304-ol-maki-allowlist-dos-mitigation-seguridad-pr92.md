# 304 — OL-URGENT-MAKI-001: allowlist Maki + revisión de seguridad PR #92

**Fecha:** 2026-03-09  
**Tipo:** Seguridad / hardening  
**Estado:** Completado  
**PR:** #92 (`feat/ol-cluster-001-maki-textshadow`)

## Problema

Riesgo DoS por `linked_maki` arbitrario: valores no validados podían generar IDs de imagen fallback distintos (uno por valor), provocando carga descontrolada de assets y degradación de performance.

## Solución implementada

### Allowlist Maki en spots-layer

- **`lib/map-core/spots-layer.ts`**:
  - Import de `layouts` desde `@mapbox/maki/browser.esm.js`
  - `MAKI_ALLOWLIST = new Set(layouts)` — catálogo oficial de iconos Maki
  - En `buildMakiIconCandidates`: si `maki` no está en allowlist → devuelve `flowya-fallback-generic` (única imagen), no IDs derivados de valores arbitrarios

### Revisión de seguridad (PR #92)

Cobertura revisada:
- Inyección (SQL/comandos/plantillas/path traversal)
- AuthN/AuthZ y límites de permisos
- Secretos y filtraciones en logs
- XSS/SSRF/deserialización/forgery
- Supply chain por `@mapbox/maki`

**Resultado:** No se encontraron vulnerabilidades de alta confianza. La lógica de iconos Maki aplica controles defensivos (allowlist/fallback) y no hay flujos de entrada no confiable que habiliten ejecución de código o exfiltración.

## Archivos modificados

- `lib/map-core/spots-layer.ts` — allowlist + validación en `buildMakiIconCandidates`

## Referencias

- Bitácora 302: iconos Maki en listas y mapa
- Bitácora 303: clustering Mapbox
