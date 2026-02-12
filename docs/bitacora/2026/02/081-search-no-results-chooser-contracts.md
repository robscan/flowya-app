# Bitácora 081 (2026/02) — Search: no-results chooser (anti-traición) + contracts

**Fecha:** 2026-02-11  
**Objetivo:** documentar y fijar contrato para el estado “Sin resultados” en Search V2 evitando “traición” por homónimos.

---

## Problema

- **“Traición” por homónimos:** un CTA tipo **“Crear <query>”** puede resolver texto y terminar creando un match inesperado (ej. “Torre Eiffel” → calle homónima), rompiendo la promesa de búsqueda y confundiendo al usuario.

---

## Decisión

- **Chooser explícito** en “Sin resultados” (anti-traición): en vez de un único “Crear <query>”, mostrar opciones claras (sugerencias con coords vs crear nuevo UGC) según contrato.
- **Ranking/taxonomía v0** como base (sin IA por ahora): priorizar POI/landmark sobre streets; acciones separadas (create-from-place vs create-new UGC).

---

## Fuentes de verdad tocadas

- `docs/definitions/search/SEARCH_V2.md`
- `docs/contracts/SEARCH_V2.md`
- `docs/contracts/SEARCH_NO_RESULTS_CREATE_CHOOSER.md`
- `docs/definitions/search/SEARCH_INTENTS_RANKING.md`
- `docs/contracts/INDEX.md`

---

## Qué sigue (Parte 2)

- UI por secciones + chooser visible en el estado no-results.
- Preview → create (selección explícita de suggestion con coords).
- Wiring de ranking/taxonomía v0 (intents + dedupe) en el controller/strategy.
- Sin IA por ahora (mantener v0 deterministic y auditable).

