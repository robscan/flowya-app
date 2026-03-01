# CHECKLIST_QA_F3_002_ACTIVITY_SUMMARY_COUNTRIES

**Fecha:** 2026-02-28  
**Objetivo:** validar confiabilidad de `visitedCountriesCount` antes de cierre de `OL-WOW-F3-002`.

---

## Casos mínimos

1. **Usuario sin spots visitados**
- Esperado: `visitedCountriesCount = 0` o `—` según visibilidad configurada.
- No debe mostrar conteo inventado.

2. **Cobertura baja (< 0.40)**
- Dataset con direcciones incompletas/ambiguas.
- Esperado: calidad `low` y UI muestra `—`.

3. **Cobertura media (>= 0.40 y < 0.80)**
- Dataset mixto (parte con país resoluble).
- Esperado: calidad `medium`, conteo visible y consistente.

4. **Cobertura alta (>= 0.80)**
- Dataset estable con país resoluble en mayoría.
- Esperado: calidad `high`, conteo visible y deduplicado correcto.

5. **Deduplicación por país**
- Múltiples spots en mismo país.
- Esperado: el país cuenta una sola vez.

---

## Verificaciones transversales

- Cambiar filtros `saved/visited` no introduce conteos inconsistentes.
- El fallback `—` aparece solo cuando calidad `low`.
- Sin regresión visual en Search/Sheet al mostrar Activity Summary.

---

## Criterio de pase

- Todos los casos anteriores pasan en smoke manual.
- Evidencia registrada en bitácora del día con resultado por caso.
