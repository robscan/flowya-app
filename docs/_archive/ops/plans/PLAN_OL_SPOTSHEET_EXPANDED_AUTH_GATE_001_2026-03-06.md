# PLAN — OL-SPOTSHEET-EXPANDED-AUTH-GATE-001 (2026-03-06)

**ARCHIVADO** — Proyecto eliminado por completo. Tendencia: todo dentro de auth; por ahora anon permitido para testing. Política vigente: auth en mutaciones. Ver OPEN_LOOPS.

---

Estado original: PLANIFICADO  
Objetivo: eliminar fricción de activación en Explore asegurando que `medium -> expanded` no solicite auth cuando el usuario solo consulta información.

---

## 1) Problema

En el flujo actual de SpotSheet, al pasar de `medium` a `expanded` desde POI/spot sin sesión, puede dispararse modal de autenticación por rutas acopladas a persistencia/creación.

Impacto:
- Rompe descubrimiento temprano de valor.
- Contradice la política de activación sin fricción.
- Introduce percepción de bloqueo antes de acciones mutantes.

---

## 2) Decisión

1. Lectura libre sin auth en Explore:
- Abrir y expandir SpotSheet para consultar título/dirección/detalle no requiere auth.

2. Auth solo para mutaciones explícitas:
- `guardar`, `visitar`, `editar`, `crear` mantienen gate de auth.

3. UX de transición:
- En `medium -> expanded` mostrar loader neutral: `Cargando información...`.
- No usar copy de guardado en este tramo.

---

## 3) Política de persistencia temporal

- No bloquear consulta por sesión.
- Separar claramente lectura vs mutación:
  - lectura: permitida sin auth,
  - mutación: autenticada.
- Si existe auto-persistencia técnica ligada al expand, debe ser transparente y no condicionar acceso al detalle.

---

## 4) Criterios de aceptación (AC/DoD)

1. Usuario sin sesión puede abrir SpotSheet en `medium` y `expanded` sin modal de auth.
2. El modal de auth aparece solo al ejecutar mutaciones (`guardar/visitar/editar/crear`).
3. En transición a `expanded`, el estado de carga muestra `Cargando información...`.
4. Sin regresión de gestos/snap (`peek/medium/expanded`) ni de cierre de sheet.
5. No se introducen toasts o copys que impliquen guardado en el camino de lectura.

---

## 5) Riesgos y mitigaciones

1. **Regresión de boundaries de auth** (impacto alto).
- Mitigación: review explícito de handlers de mutación vs handlers de lectura.

2. **Race conditions en carga de detalle** (impacto medio).
- Mitigación: control de request activo + descarte de respuestas obsoletas cuando cambia selección.

3. **Inconsistencia de copy/carga** (impacto medio).
- Mitigación: unificar copy de loading en SpotSheet para este flujo.

4. **Deriva entre docs y runtime** (impacto medio).
- Mitigación: cierre obligatorio con bitácora + actualización de `OPEN_LOOPS` y `CURRENT_STATE`.

---

## 6) Validación mínima

- QA manual:
  - caso no-auth: tap spot -> medium -> expanded (sin auth prompt),
  - caso no-auth: tap mutación (`Por visitar`/`Visitado`/`Editar`) sí muestra auth,
  - verificación de copy `Cargando información...` durante carga de expanded.

---

## 7) Rollback

1. Revertir cambios del gate en runtime y restaurar flujo previo.
2. Revertir copy de loader a estado anterior.
3. Registrar rollback en bitácora con impacto y motivo.
