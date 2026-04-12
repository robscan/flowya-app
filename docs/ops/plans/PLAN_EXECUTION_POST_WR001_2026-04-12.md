# Plan de ejecución — Tras reorganización OL (2026-04-12)

**Rol:** secuencia operativa + notas de arquitectura.  
**No sustituye** `OPEN_LOOPS.md` como fuente de verdad del loop activo. Trazabilidad: bitácora `338`.

---

## 1. Fases propuestas

| Fase | Objetivo | OL / entrega | Riesgo principal |
|------|-----------|--------------|-------------------|
| **A** | Cerrar web responsive con QA real | **`OL-WEB-RESPONSIVE-001`** — WR-05 + fixes desktop (sidebar, MapControls, animaciones) | Regresiones en mobile al tocar capas compartidas |
| **B** | Higiene legal / confianza | **`OL-PRIVACY-001`**, **`OL-SECURITY-VALIDATION-001`** | Alcance creep (política perfecta vs publicable) |
| **C** | Cuenta usable | **`OL-PROFILE-001`** + decisión **auth obligatoria** (producto) | Paridad web/native si preferencias viven en distintos almacenes |
| **D** | Valor diferencial datos | **`OL-CONTENT-002`** (galería), **`OL-CONTENT-001`** (Recordar-lite) | Mezclar contenido editorial con notas privadas |
| **E** | Clima + unidades | **`OL-CONTENT-CLIMATE-UNITS-001`** | Fuente de normales + granularidad geográfica; jobs de ingest |
| **F** | Internacionalización UI | **`OL-I18N-EN-001`** | Strings duplicados, RTL futuro, copy en DB vs código |
| **G** | Escala y coste | **`OL-SEARCHV2-002`**, **`OL-METRICS-001`** | Medición sin PII |

**Rama inmediata (Fase A):** `fix/wr05-explore-desktop-qa` — solo bugs QA desktop/sidebar acordados; merge cuando checklist WR-05 + desktop esté verde.

---

## 2. Criterios de cierre `OL-WEB-RESPONSIVE-001`

1. WR-01–WR-04 cumplidos según [PLAN_OL_WEB_RESPONSIVE_COMPONENTS_001_2026-03-28.md](PLAN_OL_WEB_RESPONSIVE_COMPONENTS_001_2026-03-28.md).
2. WR-05: smoke en tres anchos representativos.
3. **Desktop sidebar:** sin P0 en MapControls; animaciones sin flash blanco reproducible en casos canon (entrada welcome, KPI↔listado lugares, spot sheet).
4. Bitácora + una línea en `OPEN_LOOPS` al declarar cerrado.

---

## 3. Riesgos transversales (arquitectura)

1. **Acoplamiento `MapScreenVNext`:** Cualquier cambio en overlays/z-index/`pointerEvents` afecta búsqueda, filtros y controles. Mitigación: tocar solo con checklist en [EXPLORE_WEB_DESKTOP_SIDEBAR_CANON.md](../../contracts/EXPLORE_WEB_DESKTOP_SIDEBAR_CANON.md) §6 y `layer-z.ts`.

2. **Dos fuentes de verdad para unidades (°C/°F, km/mi):** Si la preferencia vive en AsyncStorage web y en otro sitio en native más adelante, habrá deriva. Mitigación: contrato `user_settings` en Supabase cuando exista `OL-PROFILE-001` o antes si el producto lo exige.

3. **Clima en DB:** Ingest batch mal diseñado puede duplicar filas o quedar obsoleto. Mitigación: clave natural documentada (zona o `(spot_id, season)`), job idempotente.

4. **i18n parcial:** Inglés solo en Explore y español en edición rompe confianza. Mitigación: definir “superficie mínima EN” en el DoD de `OL-I18N-EN-001`.

---

## 4. Preguntas abiertas (validar con producto)

| # | Pregunta | Por qué importa |
|---|----------|-----------------|
| 1 | ¿**Login obligatorio** antes de Fase C o después de MVP web cerrado? | Cambia prioridad de `OL-PROFILE-001` vs contenido. |
| 2 | ¿Clima por **spot**, **ciudad** o **macrozona** en v1? | Determina esquema SQL y coste de ingest. |
| 3 | ¿**Inglés** solo UI o también textos generados (descripciones)? | Afecta si `OL-I18N-EN-001` incluye pipeline editorial. |
| 4 | ¿Los bugs desktop bloquean **release** o son **follow-up** post-merge? | Define si la rama es hotfix o continúa el OL activo. |

---

## 5. Decisiones recomendadas (si no hay otra preferencia)

- **Fase A primero:** Sin web estable, iOS nativo hereda deuda.
- **Clima (`OL-CONTENT-CLIMATE-UNITS-001`) después** de `OL-WEB-RESPONSIVE-001` cerrado y preferiblemente con perfil/settings para unidades.
- **`OL-I18N-EN-001`** en paralelo solo si hay capacidad; si no, tras Fase A para no mezclar QA visual con extracción de strings.

---

## 6. Referencias

- Clima + unidades: [PLAN_OL_CLIMATE_SEASONAL_AND_UNITS_V1.md](PLAN_OL_CLIMATE_SEASONAL_AND_UNITS_V1.md)
- Sidebar desktop: [EXPLORE_WEB_DESKTOP_SIDEBAR_CANON.md](../../contracts/EXPLORE_WEB_DESKTOP_SIDEBAR_CANON.md)
- Cola oficial: [OPEN_LOOPS.md](../OPEN_LOOPS.md)
