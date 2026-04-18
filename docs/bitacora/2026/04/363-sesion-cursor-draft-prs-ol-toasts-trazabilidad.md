# 363 — Sesión 2026-04-18: PRs draft del bot Cursor, OPEN_LOOPS y toasts Explore (trazabilidad)

**Fecha:** 2026-04-18  
**Rama de integración:** `docs/bitacora-363-sesion-cursor-ol-toasts` — incluye bitácora + cherry-pick del commit de copy corto de toasts de filtro (`9d4e354` / mensaje `fix(explore): copy UX toasts de filtro (cortos)`), alineando `main` con el cierre acordado en chat respecto a la rama `fix/toast-filter-ux-copy-polish`.

## Objetivo

Dejar **una sola evidencia** que enlace PRs de GitHub, merges a `main`, cierres sin merge, cambios en **OPEN_LOOPS**, OL ejecutados y el hilo **toast filtro / semántica / copy**.

---

## 1. PRs del bot Cursor (estaban en draft; resolución)

| PR | Rama aprox. | Resultado | Qué aporta |
|----|-------------|------------|------------|
| **#147** | `cursor/critical-bug-inspection-985a` | **Cerrado sin merge** | Inspección de bug crítico (filtros Explore / fuga de estado). **Supersedido por #149** en el mismo área (`MapScreenVNext`); merge de #147 chocaba con #149. |
| **#148** | `cursor/critical-bug-inspection-1778` | **Merge a `main`** (`9eecbe9`) | **Perfil web:** al **quitar avatar**, orden correcto: **persistir en DB** (p. ej. `avatar_url` nulo) **antes** de borrar el objeto en **Storage**, para no dejar referencia rota ni pérdida de datos. Archivo: `app/account/index.web.tsx`. |
| **#149** | `cursor/critical-bug-inspection-ad20` | **Merge a `main`** (`a3e0ce6`) | **Explore:** al **cambiar de cuenta**, **reinicio de estado ligado a auth** en el mapa (incluye refetch de spots donde aplique). Archivo: `components/explorar/MapScreenVNext.tsx`. Sustituye la intención operativa de #147 para ese bug. |

---

## 2. OPEN_LOOPS: retiro zoom web y backlog QA (PR #150)

| PR | Merge | Contenido |
|----|-------|-----------|
| **#150** | `b588fd8` | **Retiro** de `OL-EXPLORE-WEB-ZOOM-GUARD-001` del backlog operativo (decisión producto: zoom web nativo sin bucle de reintento). **Nueva sección** de backlog QA Explore + toast como **OL dedicados** priorizables. Commits intermedios en rama: retiro del ítem, inventario/backlog. |

**Evidencia detallada:** bitácora [`360`](360-open-loops-retiro-zoom-ol-backlog-qa.md) y archivo [`docs/ops/OPEN_LOOPS.md`](../../ops/OPEN_LOOPS.md) (cabecera de sincronización 2026-04-18).

---

## 3. OL ejecutados en la misma sesión (PRs #151 y #152)

| PR | Merge | OL | Bitácora |
|----|-------|-----|----------|
| **#151** | `4cf26d7` | **OL-EXPLORE-FILTERS-CHIPS-COUNTERS-001** — chips **etiquetas → país**; contador de lugares alineado con KPI; ajustes relacionados (p. ej. título en sheet de países). | [`361`](361-ol-explore-filters-chips-counters-kpi-align.md) |
| **#152** | `a1fee30` | **OL-SYSTEM-TOAST-SEMANTIC-STABLE-001** — variantes **`success` / `error`** con tokens de estado, iconos, **`liveRegion` assertive** si hay error, coalescencia de **`setAnchor`** (rAF). Contrato y vitrina DS. | [`362`](362-ol-system-toast-semantic-stable.md) |

**Contrato:** [`docs/contracts/SYSTEM_STATUS_TOAST.md`](../../contracts/SYSTEM_STATUS_TOAST.md). **Implementación principal:** `components/ui/system-status-bar.tsx`; referencia en `app/design-system.web.tsx`.

En **OPEN_LOOPS**, los ítems **1–2** de la cola QA quedaron marcados **cerrados** con referencia a `361` / `362`. **Siguiente en cola (1.º):** **`OL-EXPLORE-FILTERS-ENTRY-LAYOUT-001`**.

---

## 4. Toasts de filtro en Explore (PR #153 + copy corto final)

| Entrega | Merge / commit | Descripción |
|---------|----------------|-------------|
| **PR #153** | `70df7ca` (`fix/toast-filter-default-copy`) | Toasts al **cambiar chip de filtro** del mapa en tipo **`default`** (neutro); **`success`** reservado a acciones de **guardar/crear**; textos sin redundar el nombre del chip; alineación con contrato de sistema. |
| **Copy UX corto** | Cherry-pick `9d4e354` en esta rama | Segunda pasada acordada en sesión: mensajes **más cortos**, **sin** prefijo «Tip:», comentario en código aclarando intención. Convive con #153; cierra la brecha entre `main` y la rama local `fix/toast-filter-ux-copy-polish`. |

**Ubicación en código:** `handleExploreFilterChange` → objeto `filterToast` en `components/explorar/MapScreenVNext.tsx`.

---

## 5. Índice rápido de evidencias (por número)

| ID | Tema |
|----|------|
| `360` | Retiro OL zoom + backlog QA en OPEN_LOOPS |
| `361` | Chips, orden país/etiquetas, contadores KPI |
| `362` | Toast semántico estable + contrato |
| `363` | **Este documento** — índice de sesión Cursor + OL + toasts |

---

## 6. Notas de gobernanza

- **Un cambio lógico = un commit con dependencias:** los PRs anteriores ya cumplen contrato entre consumidor y módulo en `main`; esta bitácora no introduce nuevas dependencias de código salvo el cherry-pick explícito de copy en `MapScreenVNext.tsx`.
- **Trazabilidad GitHub:** números de PR **#147–#153** como ancla en historial y revisiones.
