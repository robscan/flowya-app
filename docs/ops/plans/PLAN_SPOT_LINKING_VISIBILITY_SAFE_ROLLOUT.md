# Plan: Spot Linking + Visibilidad Condicional + Maki (rollout seguro)

**Estado:** Documentado, pendiente de dependencia previa (no ejecutar aún).  
**Prioridad:** Alta (impacta mapa, creación, edición, percepción visual).  
**Última actualización:** 2026-02-25

> Objetivo: implementar linking de spots con POI/Landmark y reglas de visibilidad sin regresiones funcionales ni deuda irreversible.

---

## 1) Decisiones de contexto (vigentes)

- La base de datos se reiniciará (volumen actual bajo, ~18 spots), por lo que **no se ejecutará backfill legacy** en esta fase.
- No se realizará borrado destructivo como estrategia de feature; la limpieza será operativa (reset inicial) y el sistema nuevo quedará no destructivo.
- `Visitado` y `Por visitar` conservan prioridad visual como estados de usuario.

---

## 2) Qué sí tiene sentido y qué no (consultoría crítica)

### Sí tiene sentido

1. Re-evaluar link al guardar nueva ubicación del spot.
2. Mostrar POI/Landmark base cuando el spot está `linked` pero no está en `saved/visited`.
3. Mostrar pin FLOWYA cuando `saved/visited`, con icono `maki` si existe.

### No tiene sentido ejecutar directo sin prerequisitos

1. Ocultar pin FLOWYA `linked + no estado` sin validar que el POI base esté visible.
   - Si capas base están ocultas por estilo/config, el lugar desaparece visualmente.
2. Confiar en `maki` como único icono.
   - No todos los `maki` existen en sprite/estilo; requiere fallback.
3. Enlazar solo por distancia.
   - En zonas densas produce falsos positivos (nombres repetidos/features múltiples).

---

## 3) Principios de seguridad del cambio

1. **No-governance break:** no romper tap→sheet ni rutas actuales de create/edit.
2. **No data lock-in:** schema mínimo y extensible; metadatos pesados fuera de `spots` en fase posterior.
3. **No hidden failures:** errores de link no bloquean guardado de ubicación.
4. **Rollback instantáneo:** feature flags para apagar reglas nuevas sin migración inversa.

---

## 4) Diseño de datos mínimo (fase 1)

Agregar en `public.spots` (MVP operativo):

- `link_status text not null default 'unlinked'` (`linked|uncertain|unlinked`)
- `link_score numeric null`
- `linked_place_id text null`
- `linked_place_kind text null` (`poi|landmark`)
- `linked_maki text null`
- `linked_at timestamptz null`
- `link_version text null`

Checks:

- `link_status` en set permitido.
- `linked_place_kind` en set permitido o null.

Índice recomendado:

- `(link_status)`
- `(linked_place_id)`

Nota estratégica:

- No agregar aún payload largo, categorías amplias, ni traducciones en `spots`.
- `poi_catalog` / `poi_catalog_i18n` quedan para fase 2 de modelado.

---

## 5) Arquitectura funcional (MVP)

### Resolver de link (unificado)

Crear `resolveSpotLink({ title, lat, lng })`:

- obtiene candidatos POI/Landmark cercanos;
- score por distancia + similitud nombre + compatibilidad de tipo;
- devuelve:
  - `linked` (alta confianza),
  - `uncertain` (ambiguo),
  - `unlinked` (sin candidato confiable),
  junto con `place_id`, `kind`, `maki`, `score`.

### Integración en Edit Spot (ubicación)

Al guardar ubicación:

1. persistir lat/lng;
2. ejecutar resolver;
3. persistir `link_*`.

Regla de resiliencia:

- Si resolver falla, no bloquear ubicación; guardar `link_status='unlinked'` y mostrar estado de sistema.

---

## 6) Reglas de render (objetivo producto)

1. `linked && !saved && !visited`:
   - no renderizar pin FLOWYA;
   - se muestra POI/Landmark base.
2. `saved || visited`:
   - renderizar pin FLOWYA;
   - si `linked_maki` válido, mostrar icono en pin;
   - fallback icono genérico si no hay sprite.
3. `unlinked || uncertain`:
   - mantener pin FLOWYA visible (no ocultar).

---

## 7) Feature flags (obligatorio)

- `ff_link_on_edit_save`
- `ff_hide_linked_unsaved`
- `ff_flowya_pin_maki_icon`

Orden de activación:

1. link persistente sin cambios visuales,
2. icono `maki` con fallback,
3. ocultamiento condicional de linked-unsaved.

---

## 8) Dependencias previas (bloqueantes)

1. Confirmar política visual de capas base:
   - POI/Landmark base deben estar disponibles cuando el pin FLOWYA se oculta.
2. Confirmar fuente de candidatos para resolver:
   - runtime map features vs servicio de búsqueda.
3. Definir contrato de `place_id` estable para enlazado.

Sin estas 3 definiciones, no se ejecuta implementación.

---

## 9) Plan por fases

### Fase A — Contratos y migración

- Migración SQL de `spots.link_*`.
- Tipos TS en app.
- Documentar en `DATA_MODEL_CURRENT` y `MAPBOX_PLACE_ENRICHMENT`.

### Fase B — Resolver + save en Edit Spot

- `resolveSpotLink` con thresholds versionados.
- Hook en guardar ubicación.
- Estado de sistema en error/no-match.

### Fase C — Render e iconografía

- Regla `linked-unsaved` hide.
- Pin con `maki` + fallback.
- QA visual zoom/tema/densidad.

### Fase D — Hardening

- Telemetría mínima (`linked`, `uncertain`, `unlinked`, errores resolver).
- Ajuste de thresholds con evidencia.

---

## 10) Matriz de riesgos y mitigación

1. Falso positivo de link.
   - Mitigar con estado `uncertain` no ocultable.
2. POI base no visible tras ocultar FLOWYA.
   - Mitigar con precheck de capas y smoke de estilo.
3. Icono `maki` faltante.
   - Mitigar con fallback local.
4. Cambios de estilo Mapbox rompen clasificación.
   - Mitigar con `link_version` + resolver desacoplado de un único layer id.

---

## 11) Criterios de No-Go (detener despliegue)

- `uncertain` > 15% en muestra de QA.
- Casos reproducibles donde lugar desaparece (ni POI base ni pin FLOWYA).
- Fallas de tap→sheet en spots linked.
- Degradación evidente de FPS en mapa al activar iconografía.

---

## 12) DoD / AC

- [ ] Migración `spots.link_*` aplicada.
- [ ] Resolver integrado al guardar ubicación en Edit Spot.
- [ ] Reglas de render activadas por flags y verificadas.
- [ ] Fallback de icono implementado para `maki` desconocido.
- [ ] QA funcional y visual en zonas densas + zonas sin POI.
- [ ] Documentación actualizada + bitácora de cierre.

---

## 13) Documentos a actualizar en ejecución

- `docs/contracts/DATA_MODEL_CURRENT.md`
- `docs/contracts/MAPBOX_PLACE_ENRICHMENT.md`
- `docs/contracts/MAP_PINS_CONTRACT.md`
- `docs/ops/OPEN_LOOPS.md`
- `docs/bitacora/2026/02/NNN-*.md`

