# Plan de ejecución — Tras reorganización OL (2026-04-12)

**Rol:** secuencia operativa + notas de arquitectura.  
**No sustituye** `OPEN_LOOPS.md` como fuente de verdad del loop activo. Trazabilidad: bitácoras `338`, `339`, `340`, `341`.

---

## 1. Fases propuestas

| Fase | Objetivo | OL / entrega | Riesgo principal |
|------|-----------|--------------|-------------------|
| **A** | ~~Cerrar web responsive con QA real~~ **Hecho (2026-04-12)** | **`OL-WEB-RESPONSIVE-001`** — cerrado; sidebar desktop + QA multiviewport | Regresiones en mobile al tocar capas compartidas |
| **B** | Higiene legal / confianza | **`OL-PRIVACY-001`**, **`OL-SECURITY-VALIDATION-001`** | Alcance creep (política perfecta vs publicable) |
| **C** | Cuenta usable + **menor abuso de APIs** | **`OL-PROFILE-001`** + **login requerido** (producto) + `OL-SECURITY-VALIDATION-001` | Coste Mapbox/geocoding si sesiones anónimas o rutas abiertas; paridad web/native |
| **D** | Valor diferencial datos | **`OL-CONTENT-002`** (galería), **`OL-CONTENT-001`** (Recordar-lite) | Mezclar contenido editorial con notas privadas |
| **E** | Clima + unidades | **`OL-CONTENT-CLIMATE-UNITS-001`** | Fuente de normales + granularidad geográfica; jobs de ingest |
| **F** | Internacionalización UI | **`OL-I18N-EN-001`** — Explore + auth + **crear/editar/detalle** spot + **mapa** + **DS** (vitrina bilingüe); ver §4c–4e | Strings duplicados; preview DS vs preferencia usuario |
| **G** | Escala y coste | **`OL-SEARCHV2-002`**, **`OL-METRICS-001`** | Medición sin PII |

**WR-05:** docs rama + bitácora `341` fusionados (**PR #136**). Implementación (transiciones sidebar + QA multiviewport): nueva rama desde `main` cuando se retome; merge al cumplir checklist WR-05.

---

## 2. Criterios de cierre `OL-WEB-RESPONSIVE-001` — **cerrado 2026-04-12**

1. WR-01–WR-04 cumplidos según [PLAN_OL_WEB_RESPONSIVE_COMPONENTS_001_2026-03-28.md](PLAN_OL_WEB_RESPONSIVE_COMPONENTS_001_2026-03-28.md).
2. WR-05: smoke en tres anchos representativos.
3. **Desktop sidebar:** transiciones y mapa (`setPadding`, clip 400↔720); MapControls OK en QA.
4. `OPEN_LOOPS.md` actualizado; plan responsive con sección **Estado: cerrado**.

---

## 3. Riesgos transversales (arquitectura)

1. **Acoplamiento `MapScreenVNext`:** Cualquier cambio en overlays/z-index/`pointerEvents` afecta búsqueda, filtros y controles. Mitigación: tocar solo con checklist en [EXPLORE_WEB_DESKTOP_SIDEBAR_CANON.md](../../contracts/EXPLORE_WEB_DESKTOP_SIDEBAR_CANON.md) §6 y `layer-z.ts`.

2. **Dos fuentes de verdad para unidades (°C/°F, km/mi):** Si la preferencia vive en AsyncStorage web y en otro sitio en native más adelante, habrá deriva. Mitigación: contrato `user_settings` en Supabase cuando exista `OL-PROFILE-001` o antes si el producto lo exige.

3. **Clima en DB:** Ingest batch mal diseñado puede duplicar filas o quedar obsoleto. Mitigación: clave natural documentada (zona o `(spot_id, season)`), job idempotente.

4. **i18n parcial:** Inglés solo en Explore y español en edición rompe confianza. Mitigación: definir “superficie mínima EN” en el DoD de `OL-I18N-EN-001`.

---

## 4. Respuestas producto (2026-04-12)

| # | Tema | Decisión |
|---|------|----------|
| 1 | Bugs desktop MapControls | **No reproducidos** en QA reciente; tratados como incidente temporal. **Enfoque WR-05:** mejorar **transiciones del sidebar** (calidad percibida). |
| 2 | Alcance **`OL-I18N-EN-001`** (actualizado) | **Incluye `/design-system`** como vitrina de **componentes canónicos** compartidos con Explore; **no** es “pantalla de prueba” descartable si sirve para validar EN en los mismos atomos. Añadir **crear spot**, **detalle spot** (`/spot/[id].web`), **mapa** (misma fuente de idioma). Ver §4c–4e. |
| 3 | Login | **Prioridad alta** — limitar **abuso de APIs** (coste). Documento de capas: [API_AND_AUTH_PROTECTION_LAYERS.md](../governance/API_AND_AUTH_PROTECTION_LAYERS.md). |

**Pendiente (no bloqueante):** granularidad clima v1; inglés en textos generados (IA/DB) vs solo UI.

### 4c — Design System e idioma (recomendación)

- **Incluir DS en el alcance i18n** porque documenta y prueba los mismos componentes que Explore.
- **Conmutador “preview ES / EN”** en la vitrina: idealmente vía **contexto local** o `?lang=` para que los equipos vean **matrices de estado en ambos idiomas** sin cambiar la preferencia global del usuario (hasta definir “sincronizar con app”).
- Las **descripciones largas** de secciones en `design-system.web.tsx` pueden seguir siendo claves de catálogo i18n o quedar en ES hasta segunda pasada.

### 4d — Inventario rutas web productivas (strings a cubrir)

| Superficie | Archivo / entrada | Notas |
|------------|-------------------|--------|
| Explore | `(tabs)/index.web.tsx` → `MapScreenVNext` | Mayor volumen de copy. |
| Búsqueda | `SearchOverlayWeb`, `SearchSurface`, cards | Ligado a filtros y tags. |
| Crear spot | `create-spot/index.web.tsx` | Antes omitido explícitamente; **incluir** si el flujo es productivo. |
| Editar spot | `spot/edit/[id].web.tsx` | Confirmado. |
| Detalle spot | `spot/[id].web.tsx` | Deep links / compartir. |
| Auth | `contexts/auth-modal` + mensajes | Confirmado. |
| Modales / sistema | `FlowyaBetaModal`, duplicados, confirmaciones desde Explore | Revisar que no queden solo en ES. |
| Design System | `design-system.web.tsx` | Preview bilingüe de canónicos. |

**Posibles huecos:** feedback fuera de Explore, share card, pantallas **solo nativas** en el futuro (fuera de alcance web v1).

### 4e — Mapa y locale (estado código)

- Hoy: `lib/i18n/locale-config.ts` con **`APP_LOCALE_MODE = "manual"`** y `APP_MANUAL_LOCALE = "es-MX"`.
- `MapCoreView` recibe `mapLanguage`; `MapScreenVNext` usa `getCurrentLanguage() === "es" ? "es" : "en"`.
- Geocoding / `searchPlaces` / `searchPlacesPOI` ya pasan `language` desde `getCurrentLanguage()`.
- **Ajuste recomendado en `OL-I18N-EN-001`:** sustituir el modo manual fijo por **preferencia de usuario + fallback sistema**, unificando UI y mapa (sin segundo switch). Contrato: [APP_LOCALE_AND_MAP_LANGUAGE.md](../../contracts/APP_LOCALE_AND_MAP_LANGUAGE.md).

---

## 5. Capas de protección API (objetivo login + coste)

Ver **[API_AND_AUTH_PROTECTION_LAYERS.md](../governance/API_AND_AUTH_PROTECTION_LAYERS.md)** — producto, identidad, RLS, proxy/edge, proveedor, observabilidad. Objetivo: que **login obligatorio** se combine con controles que **no dependan solo del cliente**.

---

## 6. Decisiones recomendadas (si no hay otra preferencia)

- **Fase A primero:** Sin web estable, iOS nativo hereda deuda.
- **Clima (`OL-CONTENT-CLIMATE-UNITS-001`) después** de `OL-WEB-RESPONSIVE-001` cerrado y preferiblemente con perfil/settings para unidades.
- **`OL-I18N-EN-001`** en paralelo solo si hay capacidad; si no, tras Fase A para no mezclar QA visual con extracción de strings.
- **Login y coste API:** aplicar checklist en [API_AND_AUTH_PROTECTION_LAYERS.md](../governance/API_AND_AUTH_PROTECTION_LAYERS.md); **`OL-SECURITY-VALIDATION-001`** alineado con gate de app.

---

## 7. Referencias

- Clima + unidades: [PLAN_OL_CLIMATE_SEASONAL_AND_UNITS_V1.md](PLAN_OL_CLIMATE_SEASONAL_AND_UNITS_V1.md)
- Sidebar desktop: [EXPLORE_WEB_DESKTOP_SIDEBAR_CANON.md](../../contracts/EXPLORE_WEB_DESKTOP_SIDEBAR_CANON.md)
- Locale + mapa: [APP_LOCALE_AND_MAP_LANGUAGE.md](../../contracts/APP_LOCALE_AND_MAP_LANGUAGE.md)
- Capas API / auth: [API_AND_AUTH_PROTECTION_LAYERS.md](../governance/API_AND_AUTH_PROTECTION_LAYERS.md)
- Cola oficial: [OPEN_LOOPS.md](../OPEN_LOOPS.md)
