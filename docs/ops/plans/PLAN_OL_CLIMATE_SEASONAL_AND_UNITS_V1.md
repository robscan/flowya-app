# PLAN — Clima por temporadas + unidades (°C/°F, km/mi) — v1

**Fecha:** 2026-04-12  
**Estado:** PLANIFICADO (ejecutar tras cierre de `OL-WEB-RESPONSIVE-001` o como OL dedicado)  
**Relacionado:** [PLAN_CONTENT_STACK_ENRICHMENT_2026-03-01.md](PLAN_CONTENT_STACK_ENRICHMENT_2026-03-01.md), [PLAN_OL_CONTENT_002_GALERIA_V1_2026-03-11.md](PLAN_OL_CONTENT_002_GALERIA_V1_2026-03-11.md) (allí el clima estaba *postponed* fuera del alcance de galería)

---

## 1. Objetivo

1. Mostrar **normales climáticas por estación** (rangos típicos en °C), no forecast diario ni tiempo en tiempo real.
2. **Persistir** esos datos en la base de Flowya (Supabase) para **no consultar APIs externas en cada vista**; refresco esporádico (manual job o anual).
3. Donde la UI muestre **temperatura**, permitir **alternar con un tap** entre **°C y °F** (solo presentación; preferencia de usuario persistida).
4. Donde la UI muestre **distancia**, permitir **alternar con un tap** entre **kilómetros y millas** (presentación; misma preferencia o clave relacionada).

**Fuera de alcance v1:** “nivel de seguridad” del destino; clima en tiempo real; mapas de radar.

---

## 2. Principios

- **Datos estables → DB:** agregados por zona geográfica o por spot enlazado; evitar N+1 llamadas a proveedores.
- **Unidades → cliente + preferencia:** conversión matemática local; persistir `preferred_temperature_unit` y `preferred_distance_unit` (perfil usuario o `user_settings`).
- **i18n:** textos de interfaz (etiquetas “Invierno”, “Clima”, “km”) vía sistema de traducción de la app; **frases editoriales largas** opcionalmente en DB por locale si el equipo prefiere editar sin deploy (ver §6).

---

## 3. Modelo de datos (propuesta)

Elegir **una** granularidad principal en v1 (evitar duplicar filas sin criterio):

| Opción | Uso |
|--------|-----|
| **A — Por lugar lógico** | `climate_zone_id` o `(country_code, admin_level_1, …)` con filas `season`, `temp_min_c`, `temp_max_c`, `source`, `fetched_at`. |
| **B — Por spot** | Columnas opcionales en `spots` o tabla hija `spot_climate_normals` solo si el enriquecimiento es por coordenadas. |

Campos mínimos sugeridos:

- `temp_min_c` / `temp_max_c` (o un `jsonb` por estación: `winter`, `spring`, `summer`, `autumn`).
- `source` (ej. proveedor + versión del dataset), `fetched_at`.
- Hemisferio / convención de “invierno”: documentar si se usa calendario local o meteorológico por latitud.

**Refresh:** job raro o al importar dataset; no en cold path de Explore.

---

## 4. UI / UX

### 4.1 Clima

- Mostrar solo si hay fila en DB (o zona resuelta); sin datos → no bloquear sheet ni mostrar placeholder vacío ruidoso.
- **Tap en el bloque de temperatura** (o en un chip “°C | °F”) alterna unidad; mostrar ambas no es obligatorio: basta **un valor activo** + hint accesible.

### 4.2 Distancia

- Donde ya exista distancia (SpotSheet, listados, etc.), **mismo patrón**: tap alterna km ↔ mi; formateo con precisión acordada (ej. 1 decimal bajo 10 mi).

### 4.3 Fórmulas (referencia)

- °F = °C × 9/5 + 32  
- mi = km × 0.621371  

---

## 5. Integración técnica

1. Migración Supabase + tipos TS.
2. Resolver **zona climática** desde coordenadas o desde jerarquía ya guardada en el spot (país/región).
3. Lectura en runtime: **solo DB** en la ruta feliz; ingest batch separado.
4. Alineación con futuro **pipeline turístico** ([PLAN_POI_TOURISM_ENRICHMENT_NO_GOOGLE.md](PLAN_POI_TOURISM_ENRICHMENT_NO_GOOGLE.md)): mismos principios de snapshot y trazabilidad.

---

## 6. Traducción (recomendación)

| Tipo | Dónde |
|------|--------|
| CTAs, filtros, toggles, errores, auth | **Catálogo i18n en app** (`es` / `en`). |
| Textos largos opcionales de clima por zona | **DB** (`description_es` / `description_en` o `jsonb`) si queréis editar sin release. |

No mezclar toda la UI en DB: solo contenido que cambia con editorial.

---

## 7. Definition of Done

- [ ] Normales por estación visibles en la superficie acordada (SpotSheet o detalle) cuando existan datos.
- [ ] Datos servidos desde Supabase en uso normal; sin llamada a API meteorológica por tap.
- [ ] Toggle °C/°F con persistencia de preferencia.
- [ ] Toggle km/mi con persistencia de preferencia.
- [ ] Contrato breve en `docs/contracts/` si la forma del bloque UI se estabiliza.

---

## 8. OL sugerido (registrar en OPEN_LOOPS al activar)

Nombre tentativo: **`OL-CONTENT-CLIMATE-UNITS-001`** — depende de identidad/perfil si las preferencias viven en `user_settings`; puede ejecutarse después de `OL-PROFILE-001` o en paralelo solo con `AsyncStorage` en web si se acepta paridad limitada.
