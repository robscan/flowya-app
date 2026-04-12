# Plan de ejecución — Tras reorganización OL (2026-04-12)

**Rol:** secuencia operativa + notas de arquitectura.  
**No sustituye** `OPEN_LOOPS.md` como fuente de verdad del loop activo. Trazabilidad: bitácora `338`.

---

## 1. Fases propuestas

| Fase | Objetivo | OL / entrega | Riesgo principal |
|------|-----------|--------------|-------------------|
| **A** | Cerrar web responsive con QA real | **`OL-WEB-RESPONSIVE-001`** — WR-05 + **calidad de transiciones sidebar desktop** (principal foco residual); MapControls validados en QA (sin P0 al cierre 2026-04-12) | Regresiones en mobile al tocar capas compartidas |
| **B** | Higiene legal / confianza | **`OL-PRIVACY-001`**, **`OL-SECURITY-VALIDATION-001`** | Alcance creep (política perfecta vs publicable) |
| **C** | Cuenta usable | **`OL-PROFILE-001`** + decisión **auth obligatoria** (producto) | Paridad web/native si preferencias viven en distintos almacenes |
| **D** | Valor diferencial datos | **`OL-CONTENT-002`** (galería), **`OL-CONTENT-001`** (Recordar-lite) | Mezclar contenido editorial con notas privadas |
| **E** | Clima + unidades | **`OL-CONTENT-CLIMATE-UNITS-001`** | Fuente de normales + granularidad geográfica; jobs de ingest |
| **F** | Internacionalización UI | **`OL-I18N-EN-001`** | Strings duplicados, RTL futuro, copy en DB vs código |
| **G** | Escala y coste | **`OL-SEARCHV2-002`**, **`OL-METRICS-001`** | Medición sin PII |

**Rama inmediata (Fase A):** `fix/wr05-explore-desktop-qa` — mejoras de **transición/animación** sidebar + WR-05; merge cuando checklist WR-05 + desktop esté verde.

---

## 2. Criterios de cierre `OL-WEB-RESPONSIVE-001`

1. WR-01–WR-04 cumplidos según [PLAN_OL_WEB_RESPONSIVE_COMPONENTS_001_2026-03-28.md](PLAN_OL_WEB_RESPONSIVE_COMPONENTS_001_2026-03-28.md).
2. WR-05: smoke en tres anchos representativos.
3. **Desktop sidebar:** transiciones **perceptiblemente pulidas** (sin degradar calidad de producto: flash, saltos, clip); casos canon en [EXPLORE_WEB_DESKTOP_SIDEBAR_CANON.md](../../contracts/EXPLORE_WEB_DESKTOP_SIDEBAR_CANON.md). MapControls: sin regresión; no bloqueó cierre (QA 2026-04-12).
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
| 4 | ¿Los bugs desktop bloquean **release** o son **follow-up** post-merge? | **Resuelto (2026-04-12):** controles del mapa OK; foco en **transiciones sidebar**. |

---

## 4b. Acuerdo de alcance — `OL-I18N-EN-001` (2026-04-12)

**Producto actual:** solo lo que el usuario ve en **Explorar** y en **editar spot**, más **auth** (modal / flujos de sesión enlazados a Explore).

| Incluir (v1 EN) | Notas |
|-----------------|--------|
| **Explore** | `app/(tabs)/index.web.tsx` y árbol que compone el mapa: `MapScreenVNext`, búsqueda (`SearchOverlayWeb` / `SearchFloating`), filtros, SpotSheet, CountriesSheet, welcome, overlays del mapa. |
| **Auth** | `contexts/auth-modal` y copy de entrada/sesión usados desde Explore. |
| **Editar spot** | `app/spot/edit/[id].web.tsx` y pantallas/componentes compartidos con ese flujo. |

| Excluir (no v1 o explícitamente “no producto”) | Notas |
|-----------------------------------------------|--------|
| **`/design-system`** | Vitrina / pruebas; no es superficie de usuario. |
| Otras rutas de laboratorio | Misma regla: solo si en el futuro pasan a producto. |

**Recomendación de arquitectura (además de lo que pediste):**

- **Crear spot** (`app/create-spot/index.web.tsx`): aunque no lo citaste, comparte DS y entra desde Explore; si se deja en español y el resto en inglés, la UX se rompe. **Sugerencia:** incluir **crear spot** en el mismo OL de i18n en cuanto el CTA siga vivo en Explore, salvo decisión explícita de congelar ese flujo.
- **`app/spot/[id].web.tsx` (detalle):** útil si compartís enlaces profundos; si el tráfico real es Explore → sheet → editar, puede ser **fase 1.1** tras Explore+edit+auth.

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
