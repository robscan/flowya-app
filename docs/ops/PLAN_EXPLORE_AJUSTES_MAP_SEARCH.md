# Plan: Ajustes Explore — Mapa + Búsqueda

**Estado:** Documentado para ejecución por fases  
**Prioridad:** Después de P0 (soft delete, create spot mínimo)  
**Última actualización:** 2026-02-14

> Plan maestro de ajustes acordados para mapa y búsqueda en Explorar. Ejecución por micro-scopes; revisión tras cada MS para verificar ausencia de regresiones.

---

## 1. Objetivos (JTBD)

| Objetivo | Descripción |
|----------|-------------|
| **Encontrar** | Usuario busca por nombre de lugar/edificio (POIs), no por calles. Facilitar hallar lo que busca. |
| **Crear** | Mostrar POIs cuando no hay spots; ayudar a crear spots con contexto real (Fundació Joan Miró, Montjuïc, etc.). |
| **Seguridad** | Create spot solo por long-press intencional; nunca por pinch/zoom accidental. |
| **Claridad** | Pin visible en Paso 0 donde se creará el spot; mapa con colores útiles (agua, zonas verdes). |

---

## 2. Orden de ejecución

| # | MS | Título | Riesgo | Dependencias |
|---|-----|--------|--------|--------------|
| A | MS-A | Long-press solo un dedo | Bajo | Ninguna |
| B | MS-B | Pin visible en Paso 0 | Bajo | Ninguna |
| C | MS-C | POIs/landmarks en mapa | Medio | Decisión: landmarks solo vs todos POIs |
| D | MS-D | Colores agua y zonas verdes | Bajo | Ninguna |
| E | MS-E | Búsqueda POIs en sin-resultados | Medio | Verificación API Mapbox Search Box |

**Regla:** Un MS por PR; revisión y confirmación antes de pasar al siguiente.

---

## 3. Micro-scopes (detalle)

### MS-A — Long-press solo con un dedo (OL-P0-003)

**Objetivo:** Create spot se activa únicamente por long-press de un dedo (o mouse), sin arrastre. Pinch/zoom con dos dedos no debe disparar el flujo.

**Ejecución:**
1. En `handleMapPointerDown`, comprobar si `touches.length > 1` o si hay más de un puntero activo. Si sí → no iniciar timer long-press.
2. Documentar en contrato `CREATE_SPOT_LONG_PRESS.md` las reglas canónicas.
3. Mantener constantes actuales: `LONG_PRESS_MS = 3000`, `LONG_PRESS_DRAG_THRESHOLD_PX = 10`.

**Archivos:** `hooks/useMapCore.ts`, `lib/map-core/constants.ts` (referencias), nuevo `docs/contracts/CREATE_SPOT_LONG_PRESS.md`.

**Riesgos:**
- Eventos touch/pointer pueden variar entre web y native; falsos positivos/negativos.

**Mitigación:**
- Usar `originalEvent.touches?.length` para touch; para pointer events considerar `getPointerType`/count. Fallback conservador: si hay duda, no iniciar long-press.
- Smoke test en dispositivo real (pinch/zoom 10 veces sin activar create).

**DoD:**
- [x] Contrato CREATE_SPOT_LONG_PRESS creado.
- [x] Multi-touch detectado y long-press cancelado.
- [ ] Smoke: pinch/zoom no activa create spot (verificar en dispositivo).
- [x] Bitácora 102.

---

### MS-B — Pin visible en Paso 0

**Objetivo:** Mostrar el pin en el mapa en la posición exacta donde se creará el spot mientras el overlay Paso 0 (nombre) está visible. Evitar confusión: hoy el pin solo aparece tras confirmar ubicación.

**Ejecución:**
1. Pasar `createSpotPendingCoords` a la capa del mapa cuando `createSpotNameOverlayOpen && createSpotPendingCoords`.
2. Renderizar un Marker de preview en esa posición: MapPinSpot `selected` (más grande para visibilidad).
3. Label del pin = valor actual del input (actualizado en tiempo real conforme el usuario escribe). CreateSpotNameOverlay `onValueChange` → MapScreenVNext `createSpotNameValue` → MapCoreView `previewPinLabel`.
4. Actualizar contrato `CREATE_SPOT_PASO_0.md`: pin de preview en sección E.

**Archivos:** `components/explorar/MapScreenVNext.tsx`, `components/explorar/MapCoreView.tsx` (o equivalente donde se renderizan Markers).

**Riesgos:**
- Bajo. Solo afecta visualización; no cambia flujo ni persistencia.

**Mitigación:**
- El pin de preview no debe ser interactivo (no responder a tap). Implementado: MapPinSpot selected + previewPinLabel en tiempo real.

**DoD:**
- [x] Pin visible en Paso 0 cuando hay coords pendientes.
- [x] Contrato CREATE_SPOT_PASO_0 actualizado.
- [x] Bitácora 103.

---

### MS-C — POIs/Landmarks visibles en mapa

**Objetivo:** Mostrar lugares relevantes (Fundació Joan Miró, Montjuïc, etc.) en el mapa para orientación y descubrimiento.

**Contexto actual:** `hideNoiseLayers` en `lib/map-core/constants.ts` oculta la capa `poi-label` por decisión de diseño (Bitácora 006) para reducir ruido comercial.

**Ejecución (opciones):**
- **A.** Quitar `poi-label` de `HIDE_LAYER_IDS` → muestra todos los POIs (puede ser ruidoso).
- **B.** Migrar a Mapbox Standard Style con `showLandmarkIconLabels` si aplica (verificar compatibilidad con react-map-gl).
- **C.** Filtrar capas por tipo (solo landmarks) si el estilo lo permite.

**Archivos:** `lib/map-core/constants.ts`, `hooks/useMapCore.ts`, posiblemente configuración de mapStyle.

**Riesgos:**
- Medio. Cambio visual amplio; aumento de ruido si se muestran todos los POIs.
- Incompatibilidad de estilos (Standard vs light-v11).

**Mitigación:**
- Decisión explícita antes de implementar: ¿landmarks solo o todos los POIs?
- Si A: probar en varias zonas (centro ciudad vs suburbio) para evaluar ruido.
- Si B/C: validar con doc Mapbox y versión de react-map-gl.

**DoD:**
- [ ] Decisión landmarks vs POIs documentada.
- [ ] POIs/landmarks visibles en zonas de prueba (Montjuïc, etc.).
- [ ] Sin regresión en rendimiento ni legibilidad de pins Flowya.
- [ ] Bitácora de cierre.

---

### MS-D — Colores agua y zonas verdes

**Objetivo:** Añadir toque de color al mapa: agua (azul) y zonas verdes (parques) más visibles para orientación.

**Contexto actual:** `light-v11` y `dark-v11` ya incluyen capas de agua y vegetación; pueden ser sutiles.

**Ejecución (opciones):**
- **A.** Cambiar a `outdoors-v12` (énfasis en naturaleza).
- **B.** Mantener light-v11 y ajustar opacidad/color de capas water y landcover si la API lo permite.
- **C.** Estilo custom en Mapbox Studio.

**Archivos:** Donde se configura `mapStyle` (MapScreenVNext, MapCoreView).

**Riesgos:**
- Bajo. Cambio estético; bajo impacto funcional.

**Mitigación:**
- A/B son reversibles. Probar outdoors-v12 en paralelo antes de commit.

**DoD:**
- [x] Agua y zonas verdes más distinguibles.
- [x] Estilo FLOWYA desde Mapbox Studio (carga directa, sin runtime tweaks).
- [x] Bitácora 104.

---

### MS-E — Búsqueda POIs en sin-resultados (placeSuggestions)

**Objetivo:** Cuando no hay resultados de spots, mostrar POIs (Fundació Joan Miró, Montjuïc, museos, etc.) en lugar de calles/direcciones. El usuario busca por nombre de lugar, no por calle.

**Contexto actual:** `placeSuggestions` usa Mapbox Geocoding v6 (`searchPlaces`). Geocoding v6 **no devuelve POIs**; solo lugares administrativos, calles, direcciones. Por eso aparecen "Carretera De Montjuïc" en vez de "Fundació Joan Miró". Mapbox indica usar **Search Box API** para POIs.

**Ejecución (prueba controlada):**
1. Crear `searchPlacesPOI` (o similar) que llame a Mapbox Search Box API (o API que devuelva POIs).
2. Usar esa función **solo** en el useEffect de placeSuggestions en MapScreenVNext (cuando `isNoResults`).
3. Mantener `searchPlaces` (Geocoding) como fallback si la nueva API falla o no devuelve resultados.
4. Validar con queries: "Fundació Joan Miró", "Montjuïc", "Sagrada Familia".
5. Si la prueba es exitosa, evaluar extensión a Create Spot (mode=places) en fase posterior.

**Archivos:** `lib/places/searchPlaces.ts` (o nuevo `searchPlacesPOI.ts`), `components/explorar/MapScreenVNext.tsx` (useEffect placeSuggestions).

**Riesgos:**
- Medio. Nueva API; formato de respuesta distinto; posible diferencia de pricing/cuotas.
- Fallback debe ser robusto para no romper flujo existente.

**Mitigación:**
- Adapter: mapear respuesta Search Box a `PlaceResult` para no cambiar UI.
- Fallback explícito: si Search Box falla o devuelve vacío → llamar a searchPlaces (Geocoding) como hoy.
- Prueba acotada: solo placeSuggestions; no tocar Create Spot ni spotsStrategy.
- Verificar documentación Mapbox Search Box antes de implementar (endpoints, auth, rate limits).

**DoD:**
- [ ] Función searchPlacesPOI implementada con fallback a Geocoding.
- [ ] placeSuggestions en sin-resultados usa POIs cuando disponibles.
- [ ] Smoke: "Fundació Joan Miró", "Montjuïc" devuelven lugares relevantes.
- [ ] Sin regresión: Create Spot y flujo de spots intactos.
- [ ] Bitácora de cierre.
- [ ] Documentar limitación previa (Geocoding) y decisión (Search Box) en bitácora.

---

## 4. Contratos a crear/actualizar

| Contrato | Acción |
|----------|--------|
| `CREATE_SPOT_LONG_PRESS.md` | **Crear.** Reglas: solo un dedo, 3s, umbral 10px arrastre, multi-touch cancela. |
| `CREATE_SPOT_PASO_0.md` | **Actualizar.** Añadir: pin de preview visible durante Paso 0. |
| `SEARCH_NO_RESULTS_CREATE_CHOOSER.md` | **Actualizar** (post MS-E). Origen placeSuggestions: Search Box API (POIs) con fallback Geocoding. |

---

## 5. Trazabilidad

- **OPEN_LOOPS:** OL-P0-003 (long-press) se cierra con MS-A. OL-PLAN-EXPLORE referencia este plan.
- **CURRENT_STATE:** Referencia a este plan en "Foco siguiente" o "Plan documentado".
- **Bitácoras:** Una por MS al cerrar (ej. `10X-ms-explore-long-press.md`).
- **EXPLORE_UX_MICROSCOPES:** Este plan es independiente; MS1-MS3 ya tienen bitácoras propias. No sobrescribir.

---

## 6. Guardrails

1. **Revisión tras cada MS:** Usuario confirma que no hay errores antes de continuar.
2. **Un PR por MS:** Facilita rollback y trazabilidad.
3. **Fallbacks:** MS-E debe tener fallback a Geocoding; MS-C/D deben ser reversibles.
4. **No mezclar scope:** Cada MS es autocontenido; evitar "ya que tocamos X, arreglemos Y".
