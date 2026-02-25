# Bitácora 125 — Fase C: calibración de umbrales + métricas del resolver

**Fecha:** 2026-02-25  
**Rama:** `codex/search-poi-linking-phase-b`  
**Relación:** PLAN_SPOT_LINKING_VISIBILITY_SAFE_ROLLOUT (Fase C inicial)

---

## Objetivo

Reducir falsos positivos de enlace y mejorar observabilidad del resolver antes de activar reglas visuales dependientes (`hide linked-unsaved`, iconografía por `maki`).

---

## Cambios aplicados

### 1) Calibración del resolver

Archivo:

- `lib/spot-linking/resolveSpotLink.ts`

Ajustes:

- versión: `v1-phase-c-calibrated`
- thresholds más estrictos:
  - `linked >= 0.82`
  - `uncertain >= 0.58`
- límites de distancia:
  - `linked` requiere distancia <= 0.18 km
  - `uncertain` requiere distancia <= 0.35 km
- linked además requiere score mínimo de similitud de nombre.
- si top-1 y top-2 están muy cerca (delta <= 0.06), clasifica como `uncertain` por ambigüedad.

### 2) Métrica local de resolución

Archivo:

- `lib/spot-linking/metrics.ts`

Se agrega telemetría local en memoria:

- contador total, `linked`, `uncertain`, `unlinked`, errores
- último motivo, score y duración
- exposición opcional para diagnóstico en runtime:
  - `globalThis.__flowyaSpotLinkMetrics`

### 3) Registro de motivos

El resolver ahora registra razones por salida:

- `linked_high_confidence`
- `uncertain_ambiguous_top_candidates`
- `uncertain_low_confidence`
- `unlinked_below_threshold`
- `resolver_error`
- etc.

---

## Guardrails mantenidos

- `ff_link_on_edit_save` sigue controlando persistencia de `link_*`.
- no se activó hide visual de `linked + unsaved`.
- no se activó iconografía `maki` en pin FLOWYA.

---

## Riesgos pendientes

- calibración basada en heurística; requiere QA en zonas densas reales.
- `maki`/categorías de proveedor pueden variar por país/región.
- falta etapa de render/iconografía para cerrar Fase C completa.

---

## Próximo paso

Fase C siguiente iteración:

- usar métricas para ajustar thresholds en entorno de prueba;
- implementar iconografía `maki` con fallback estable;
- mantener rollout por flags y smoke de performance.
