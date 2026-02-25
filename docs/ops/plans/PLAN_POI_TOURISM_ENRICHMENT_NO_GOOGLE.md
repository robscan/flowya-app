# Plan: POI turístico sin Google — imágenes reales + textos

**Estado:** Documentado para ejecutar después (no ejecutar ahora).  
**Prioridad:** Alta (calidad de contenido turístico).  
**Última actualización:** 2026-02-25

> Objetivo: implementar pipeline de enriquecimiento turístico sin Google, usando Mapbox para descubrimiento y Wikimedia/Wikidata para imagen real + base factual; IA solo para redacción final de textos.

---

## 1. Objetivo

- Mostrar foto real y metadata útil en POIs turísticos.
- Evitar dependencia de Google APIs.
- Mantener trazabilidad de fuente/licencia y fallback seguro.

---

## 2. Arquitectura objetivo

1. **Descubrimiento**: Mapbox Search (lugar + coordenadas + señales de categoría).
2. **Enriquecimiento media/facts**: Wikidata/Wikimedia Commons.
3. **Redacción texto corto**: IA sobre facts estructurados (no alucinación libre).
4. **Persistencia**: guardar snapshot en DB (fuente + licencia + timestamps).

---

## 3. Pipeline por fases

### Fase A — Selección turística

- Definir allowlist de categorías turísticas (monument, museum, park, historic site, beach, viewpoint, etc.).
- Definir denylist de negocio privado (restaurant, cafe, store, hotel, salon, etc.).
- Solo POIs que pasen el filtro entran al pipeline de enriquecimiento.

### Fase B — Imagen real (Wikimedia)

- Resolver entidad (Wikidata id) y leer imagen principal (`P18`) cuando exista.
- Obtener URL de imagen + metadata de licencia/autor.
- Persistir en spot:
  - `cover_image_url` (o campo dedicado si se define)
  - `image_source='wikimedia'`
  - `image_license`, `image_author`, `image_attribution_url`
- Si no hay imagen válida: fallback a placeholder neutro o imagen de usuario.

### Fase C — Textos

- Construir facts base (tipo de lugar, ubicación, contexto histórico/cultural breve).
- Generar con IA:
  - `description_short` (1 frase breve)
  - `why_it_matters` (1-2 frases de valor turístico)
- Guardar también `text_source='ai_from_wikidata'` y snapshot de facts.
- Permitir override manual en edición.

### Fase D — QA + guardrails

- No publicar texto si facts vacíos o confianza baja.
- Bloquear contenido promocional/comercial para mantener enfoque turístico.
- Definir refresco: snapshot estable (sin re-sync automático agresivo).

---

## 4. Contratos a actualizar/crear

- Actualizar `docs/contracts/MAPBOX_PLACE_ENRICHMENT.md` para separar:
  - descubrimiento (Mapbox)
  - enriquecimiento factual/media (Wikimedia/Wikidata)
- Crear contrato nuevo sugerido: `docs/contracts/TOURISM_ENRICHMENT_PIPELINE.md`.
- Ajustar `SEARCH_NO_RESULTS_CREATE_CHOOSER` con criterio turismo/no-privado.

---

## 5. Riesgos y mitigación

- Riesgo: matching incorrecto Mapbox ↔ Wikidata.  
  Mitigación: score de matching y fallback sin imagen si score bajo.
- Riesgo: problemas de licencia/atribución.  
  Mitigación: requerir metadata de licencia antes de publicar imagen.
- Riesgo: texto IA inexacto.  
  Mitigación: IA restringida a facts + guardrails + editable por usuario.

---

## 6. DoD / AC

- [ ] Filtro turístico/no-privado activo en pipeline de POIs.
- [ ] Enriquecimiento Wikimedia funcional para casos de prueba.
- [ ] Textos cortos generados desde facts con trazabilidad de fuente.
- [ ] Fallback claro cuando no hay imagen/facts.
- [ ] Contratos/ops actualizados y bitácora de cierre.

---

## 7. Casos de prueba mínimos

- `Sagrada Familia`, `Parc Güell`, `Montjuïc`: deben resolver imagen + texto.
- Caso sin imagen en Wikimedia: debe usar fallback, sin romper UI.
- Caso negocio privado (ej. restaurante): no entra al pipeline turístico.

---

## 8. Referencias

- `docs/contracts/MAPBOX_PLACE_ENRICHMENT.md`
- `docs/definitions/search/SEARCH_INTENTS_RANKING.md`
- `docs/contracts/SEARCH_NO_RESULTS_CREATE_CHOOSER.md`
- Wikimedia / Wikidata APIs (fuentes externas de implementación)
