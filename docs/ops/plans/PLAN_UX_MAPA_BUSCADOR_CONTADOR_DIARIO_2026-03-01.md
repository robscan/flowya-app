# Plan Integral: UX de Filtros + Buscador + Contador Países + Base para Diario Privado

## Estado de cobertura (cruce al 2026-03-01)

### Bloque A (UX crítica, sin migración DB)

- Toasts por contexto de filtro: **Cubierto**.
- CTA de estado en sheet con toggles explícitos y remover estado: **Cubierto**.
- Casuísticas de navegación/filtro: **Cubierto** (con ajustes iterativos).
- Fix quick action `Agregar imagen` desde visitados: **Cubierto**.
- Quick action descripción corta + estabilidad de foco/teclado: **Cubierto**.
- Ajustes visuales/posición de contadores en mapa y buscador: **Cubierto**.
- Bloqueo de zoom confuso web en mini-mapa: **Cubierto**.

### Bloque B (Mapa y pines)

- Pin Flowya inactivo sin filtro activo: **Cubierto**.
- Tap en mini-mapa con encuadre por zona (no hit estricto de país): **Cubierto**.
- KPI países en buscador y enlace a lista: **Cubierto**.
- Contador de spots sobre mapa + desduplicación con dropdown activo: **Cubierto**.

### Bloque C (privacidad Mi Diario)

- `description_short` y `why_it_matters` privados por usuario: **Pendiente**.
- Contrato de campos enriquecidos no editables: **Pendiente**.
- DTOs separados `SpotPublicData` / `SpotPrivateJournalData`: **Pendiente**.
- RLS/policies + pruebas A/B de privacidad: **Pendiente**.

### Bloque D (perfil y OAuth social)

- `username`, foto de perfil, OAuth social: **Pendiente** (fase separada).

### Pendientes operativos para declarar cierre de este plan

1. Cerrar QA final y freeze de `OL-P3-002.B`.
2. Ejecutar `OL-CONTENT-001` (Mi diario v1) para cubrir Bloque C inicial.
3. Abrir contrato específico de diario privado (si se mantiene como contrato nuevo).
4. Mantener V2 de gamificación solo documentada (sin implementación) hasta tener telemetría.

## Resumen
- Objetivo: cerrar fricciones críticas de uso en mapa/buscador/filtros sin romper contratos actuales, y dejar lista la base para “Mi diario” privado.
- Decisiones cerradas:
  1. Modelo de estado de spot con 2 toggles explícitos (`Por visitar`, `Visitado`) sin transiciones implícitas.
  2. `description_short` y `why_it_matters` pasan a privado por usuario en esta fase.
  3. `perfil + OAuth social` va en Fase 2 separada.
- Alineación con `OPEN_LOOPS`: ejecución en bloques secuenciales para no mezclar dominios y mantener sanidad operativa.

## Alcance y Orden (secuencial)
1. Bloque A (UX crítica, sin migración DB):
- Toasts de bienvenida/contexto por filtro.
- CTA de estado en sheet con 2 toggles explícitos + remover estado claro.
- Casuísticas de navegación/filtro resueltas.
- Fix “Agregar imagen desde listado visitados” (flujo completo).
- Ajustes de contador visuales/ubicación en mapa y buscador.
- Bloqueo de zoom confuso en web al interactuar con sheet de países.

2. Bloque B (Mapa y pines, coherencia visual/funcional):
- Pin Flowya inactivo visible cuando no hay filtro activo (evitar desaparición).
- Interacción en mapa de países cambia a encuadre por zona tocada (no estrictamente por geometría país).
- KPI países en buscador (en filtro `Todos`) y enlace a lista completa.

3. Bloque C (modelo de datos privado “Mi diario”):
- Privacidad de campos de diario por usuario.
- Campos enriquecidos API marcados como no editables.
- Lectura/escritura con políticas y DTOs explícitos.

4. Bloque D (Fase 2 separada):
- Perfil (`username`, foto) y OAuth social.

## Cambios de interfaz/API/tipos (canónicos)
1. Estado de pin (UI + dominio):
- Reemplazar ciclo implícito por acciones explícitas:
  - `setToVisit(spotId, enabled: boolean)`
  - `setVisited(spotId, enabled: boolean)`
- Regla de consistencia:
  - Si `visited=true` y usuario activa `to_visit=true`, mantener ambos permitidos solo si producto lo acepta.
  - Default recomendado: `visited=true` desactiva automáticamente `to_visit` y se comunica con microcopy.
- En filtro activo, al desactivar estado que define el filtro, el spot sale de esa lista y UI queda en el mismo filtro mostrando el siguiente resultado válido.

2. Buscador visitados (card enriquecida):
- Prioridad de texto: `description_short` (si existe), si no CTA inline “Agregar una descripción corta”.
- Si no imagen: placeholder visual en slot de imagen con acción directa `add_image`.
- Evitar nested pressables en web (no `<button>` dentro de `<button>`).

3. Contador países / mapa:
- Evento tap en mini-mapa: resolver zona destino por proximity/grid bbox y ejecutar `fitBounds` de zona.
- En estado expanded, ocultar flecha en KPI `PAÍSES` (solo visible en medium).
- Contador de spots del filtro activo sobre botón de contador países con reglas:
  - En mapa: mostrar contador siempre, ocultar pin solo cuando ese filtro está activo.
  - En buscador: mantener contadores en filtros no seleccionados.

4. Privacidad Diario (Fase C):
- `description_short` y `why_it_matters` pasan a entidad privada por usuario/spot.
- Campos de enriquecimiento externo (`editorial_summary`, tags/POI metadata) solo lectura.
- DTO lectura:
  - `SpotPublicData` (compartible/no editable usuario).
  - `SpotPrivateJournalData` (solo dueño).

5. Design System (fuente única de color):
- Consolidar tokens usados por filtros/chips/sheet contador/botón contador.
- Eliminar tokens no usados y mapear todos los componentes a la fuente canónica.

## Casuísticas definidas (sin ambigüedad)
1. Usuario en filtro `Por visitar` marca `Visitado`:
- Resultado: spot deja de cumplir `Por visitar`; se remueve de vista actual.
- Pantalla: permanece en filtro `Por visitar`, con lista actualizada y toast contextual.

2. Usuario en filtro `Por visitar` desactiva `Por visitar`:
- Resultado: vuelve a `Todos` a nivel de estado del spot (sin marca).
- Pantalla: permanece en filtro `Por visitar`; spot desaparece de esa lista, se muestra siguiente/empty state.

3. Usuario elimina filtro activo (chip superior):
- Resultado: vuelve a `Todos`.
- Pantalla: se muestran POI + Flowya pins, incluyendo Flowya inactivos con nuevo pin.

4. Spot Flowya no-POI sin filtros:
- Resultado: no desaparece; se renderiza con pin Flowya inactivo estilo POI-like.

## Riesgos y mitigación
1. Regresiones en lógica de pin status:
- Mitigar con pruebas unitarias de state machine y snapshots de transiciones.
2. Web interacciones (zoom/gesture/event bubbling):
- Mitigar con guardas específicas web, `preventDefault` selectivo y pruebas e2e web.
3. Privacidad/seguridad de campos diario:
- Mitigar con RLS/policies y tests de autorización cruzada usuario A/B.
4. Desalineación visual cross-component:
- Mitigar con tokens únicos + auditoría de referencias.

## Pruebas y criterios de aceptación
1. Unitarias:
- State machine de toggles (`to_visit`, `visited`) y filtros.
- Resolución de acciones rápidas en cards (`add_image`, `edit_description`).

2. Integración UI (mapa/buscador/sheet):
- En `visitados`, card usa descripción corta; sin descripción muestra CTA editable.
- Sin imagen, placeholder accionable abre flujo de subida y persiste al volver.
- Sin nested button warnings en web.

3. E2E (casos críticos):
- Flujo completo de los 4 escenarios de casuística definidos.
- Tap en mapa países hace encuadre zona correcto.
- No pérdida de contexto UI por zoom accidental en web durante sheet países.
- Toasters correctos:
  - Desde `Todos`: copy de invitación a acción.
  - Desde filtro específico: recordatorio de contexto de filtro activo.

4. Datos/privacidad:
- Usuario A no lee/edita diario de usuario B.
- Export/share excluye campos privados por defecto.

## Documentación a actualizar
1. `docs/ops/OPEN_LOOPS.md`
- Crear/actualizar loops separados para Bloques A, B, C y D.
2. `docs/ops/CURRENT_STATE.md`
- Estado operativo y orden de ejecución.
3. `docs/contracts/*`
- `RECORDAR_ENTRY_SPOT_SHEET`, `MAP_PINS_CONTRACT`, `DATA_MODEL_CURRENT`, nuevo contrato de `SPOT_PRIVATE_JOURNAL`.
4. `docs/bitacora/*`
- Entradas detalladas de microcopy, color tokens canónicos, filtros con delay post-flyTo, cards visitados con acciones rápidas.
5. `docs/design-system/*`
- Canon de tokens final y mapeo de componentes consumidores.

## Supuestos y defaults explícitos
- Se prioriza estabilidad UX y claridad de estados antes de OAuth/perfil.
- `visited` prevalece semánticamente sobre `to_visit` en conflicto.
- Privado por usuario significa no visible en listados/exports públicos por defecto.
- Mantener persistencia de filtro activo entre sesiones como comportamiento vigente.
- Implementación en lotes pequeños, cada bloque con PR separado y sanidad local completa.
