---
name: Fondo buscador por filtro
overview: Aplicar los mismos tokens de panel que `CountriesSheet` (`countriesPanel*`) al contenedor del buscador cuando `pinFilter` sea `saved` o `visited`, dejando `all` (y ausencia de filtro) con el comportamiento actual en web y nativo.
todos:
  - id: branch
    content: Crear rama feat/* desde main actualizado; no implementar en main
    status: pending
  - id: investigate-search-v2
    content: Releer contratos Search V2 y bitácora F2-001; fijar mapa adapters vs SearchSurface vs controller
    status: pending
  - id: docs-contracts
    content: Actualizar definitions/contracts (y JSDoc helper) para superficie panel por filtro web/native
    status: pending
  - id: helper
    content: Añadir getSearchPanelSurfaceColors (o equivalente) reutilizando tokens countriesPanel* y fallbacks web/native para all
    status: pending
  - id: web
    content: Integrar colores condicionales en SearchOverlayWeb panel View según pinFilter
    status: pending
  - id: native
    content: Integrar colores condicionales en SearchFloatingNative sheetPanel según pinFilter
    status: pending
  - id: verify
    content: tsc + checklist manual web/native (Todos vs saved/visited)
    status: pending
isProject: false
---

# Plan: fondo del buscador alineado con CountriesSheet (seguro)

**Ubicación:** este archivo en `docs/ops/plans/` es la copia canónica en el repo (2026-03-22).

## Objetivo

- `**pinFilter === 'all'**` (o equivalente sin filtro): **sin cambios** respecto al comportamiento actual.
  - Web: panel con `[colors.overlayScrim](../../../constants/theme.ts)` en [`SearchOverlayWeb.tsx`](../../../components/search/SearchOverlayWeb.tsx).
  - Nativo: panel con `colors.backgroundElevated` + `colors.borderSubtle` en [`SearchFloatingNative.tsx`](../../../components/search/SearchFloatingNative.tsx) (líneas ~151–155).
- `**pinFilter === 'saved' | 'visited'`**: fondo (y borde nativo) usando los mismos tokens que [`CountriesSheet`](../../../components/explorar/CountriesSheet.tsx) (`filterMode` → `countriesPanelToVisit*` / `countriesPanelVisited*`), en concreto `**backgroundElevated**` y `**borderSubtle**` del panel, para no inventar una tercera variante visual.

## Flujo Git (obligatorio)

- **Trabajar siempre en una rama** (p. ej. `feat/search-panel-surface-by-filter`), nunca commitear este cambio directamente en `main`.
- Antes de codificar: `git checkout main && git pull`, luego `git checkout -b feat/...`.
- Un commit lógico con todos los archivos tocados (helper + `SearchOverlayWeb` + `SearchFloatingNative`; alineado con la regla de commits completos del repo).
- Cierre: push de la rama y PR hacia `main` cuando corresponda.

## Investigación Search V2 (obligatoria antes de tocar UI de contenedor)

**Objetivo:** no implementar “a ciegas”: entender dónde está documentado el comportamiento y qué capa es **chrome de plataforma** vs **contenido compartido**.

### Dónde está documentado el comportamiento

| Recurso | Qué aporta |
|--------|------------|
| [docs/definitions/search/SEARCH_V2.md](../../definitions/search/SEARCH_V2.md) | Source of truth: motor (`useSearchControllerV2`), modos spots/places, reglas UX de filtros, SpotsStrategy. |
| [docs/contracts/SEARCH_V2.md](../../contracts/SEARCH_V2.md) | Contrato mínimo Explore: entry/exit, guardrails, web vs native, flags POI-first, referencias cruzadas. |
| [docs/contracts/explore/SEARCH_RUNTIME_RULES.md](../../contracts/explore/SEARCH_RUNTIME_RULES.md) | Reglas runtime por filtro (orden, refresh, reorden viewport, theming). |
| [docs/contracts/shared/SEARCH_STATE.md](../../contracts/shared/SEARCH_STATE.md), [SEARCH_EFFECTS.md](../../contracts/shared/SEARCH_EFFECTS.md) | Estado y efectos compartidos (según necesidad de alinear wording). |
| [docs/bitacora/2026/02/206-cierre-f2-001-single-search-surface.md](../../bitacora/2026/02/206-cierre-f2-001-single-search-surface.md) | Cierre OL-WOW-F2-001: extracción de `SearchSurface`; qué quedó en web vs native. |
| [docs/ops/analysis/RUNTIME_AUDIT_MAP_FILTER_CONTROLS_SEARCH_2026-02-26.md](../analysis/RUNTIME_AUDIT_MAP_FILTER_CONTROLS_SEARCH_2026-02-26.md) | Contexto MS-R3 / duplicación resuelta con `SearchSurface`. |

### Cómo se extrae la funcionalidad “core” de la sección

- **Contenido y árbol UI unificado:** [`SearchSurface.tsx`](../../../components/search/SearchSurface.tsx) — filtros inline, input, listados, estados empty/presearch/search/no-results. No pinta el **fondo del shell** completo del modal/sheet; eso vive en los adapters.
- **Adapters (plataforma):** [`SearchOverlayWeb.tsx`](../../../components/search/SearchOverlayWeb.tsx) (overlay, body scroll-lock, `100dvh`) y [`SearchFloatingNative.tsx`](../../../components/search/SearchFloatingNative.tsx) (sheet, handle, `KeyboardAvoidingView`). Ahí es donde hoy se fija `backgroundColor` / borde del panel contenedor.
- **Motor / datos:** `useSearchControllerV2` y estrategias en `lib/search` — **no** es el lugar para tokens de superficie del panel; el cambio de tinte es **presentación** en adapters + helper compartido.

Este trabajo toca solo la **capa adapter + helper de tema**, sin alterar contratos de resultados ni filtros de datos.

## Definiciones y contratos (replicabilidad nativo + futuros desarrollos)

**Actualizar o ampliar** (en el mismo PR que el código, para que otro dev repita el patrón sin adivinar):

1. **[docs/definitions/search/SEARCH_V2.md](../../definitions/search/SEARCH_V2.md)** — Añadir subsección breve **“Superficie del panel (chrome) por `pinFilter`”**: `all` = comportamiento actual por plataforma (web `overlayScrim` / native `backgroundElevated` + borde); `saved`/`visited` = mismos tokens que `CountriesSheet` (`countriesPanel*`), referencia al helper en código.
2. **[docs/contracts/SEARCH_V2.md](../../contracts/SEARCH_V2.md)** — Añadir un párrafo en la sección Web vs Native o Theming: el contenedor del buscador **debe** reflejar el filtro activo en superficie con tokens de tema (sin nuevos colores arbitrarios); pointer a definitions.
3. **Opcional (si encaja mejor la gobernanza):** una línea en [docs/contracts/explore/SEARCH_RUNTIME_RULES.md](../../contracts/explore/SEARCH_RUNTIME_RULES.md) bajo “Theming y tokens” enlazando a la definición anterior.
4. **Código:** JSDoc en el helper (`getSearchPanelSurfaceColors` o nombre final) con `@see` a `CountriesSheet` y a `MapPinFilterValue` / contrato de filtros.

Así **nativo y web** quedan explícitos en documentación única; nuevos desarrollos (p. ej. otro adapter) reutilizan el mismo helper y no duplican lógica de tokens.

## Enfoque técnico (una sola fuente de verdad)

1. **Nuevo helper** (p. ej. [`lib/search/searchPanelSurface.ts`](../../../lib/search/searchPanelSurface.ts) o junto a theme si preferís):

- Función `getSearchPanelSurfaceColors(pinFilter, colorScheme)` que devuelve `{ backgroundColor: string; borderColor?: string }`.
- Lógica:
  - `pinFilter === 'saved'` → `countriesPanelToVisitBackgroundElevated` + `countriesPanelToVisitBorderSubtle`.
  - `pinFilter === 'visited'` → `countriesPanelVisitedBackgroundElevated` + `countriesPanelVisitedBorderSubtle`.
  - En cualquier otro caso (`'all'`, `null`, `undefined`) → **fallback actual por plataforma**:
    - Para el helper puede aceptar un flag `variant: 'web' | 'native'` **o** devolver tokens genéricos y que cada adapter mapee: - Web “all”: `overlayScrim` y **sin borde** en el contenedor (como ahora). - Native “all”: `backgroundElevated` + `borderSubtle`.
      Así se evita duplicar el objeto `useMemo` de `CountriesSheet` (líneas 113–132) y se documenta el contrato en un solo sitio.

1. **Web — [`SearchOverlayWeb.tsx`](../../../components/search/SearchOverlayWeb.tsx)**

- `useMemo` con `[pinFilter, colorScheme]` para `backgroundColor` del `View` del panel (~línea 160–170).
- Si `pinFilter` es `saved`/`visited`, aplicar colores del helper; si no, **idéntico** a hoy (`overlayScrim`).
- No tocar [`SearchSurface.tsx`](../../../components/search/SearchSurface.tsx) salvo que un hijo necesite contraste (ver “Validación” abajo).

1. **Nativo — [`SearchFloatingNative.tsx`](../../../components/search/SearchFloatingNative.tsx)**

- Mismo `useMemo` en el `Animated.View` `sheetPanel`: para `saved`/`visited` usar tokens del helper; para `all` mantener `backgroundElevated` + `borderSubtle` actuales.
- El scrim detrás (`colors.overlayScrim`, línea ~144) puede **permanecer igual** (no forma parte del pedido; evita regresiones de dismiss).

## Qué no tocar (reducción de riesgo)

- `**MapPinFilterInline`, chips y lógica de filtro: ya están acordes; no hace falta cambiarlos para el fondo.
- **Tokens en [`constants/theme.ts`](../../../constants/theme.ts)**: reutilizar los existentes; no añadir colores nuevos salvo que QA pida ajuste fino después.

## Validación manual recomendada (post-implementación)

- Web: abrir búsqueda con **Todos** → aspecto igual que ahora; cambiar a **Por visitar** / **Visitados** → panel tintado coherente con sheet de países; scroll y teclado OK.
- Nativo: mismo flujo; comprobar borde superior del sheet y drag-to-close.
- **Contraste**: revisar a ojo textos `textSecondary` y placeholder del input sobre fondo tintado (si algo se lee mal, microajuste opcional solo en `SearchSurface` para el pill de búsqueda o labels — **solo si hace falta**).

## Verificación automática

- `npx tsc --noEmit`.

## Riesgos residuales (aceptables)

- Web y nativo seguirán diferir levemente en “Todos” (overlayScrim vs elevated) **como hoy**; solo se alinea el caso filtrado.
- Cambio de color al alternar filtro dentro del buscador: instantáneo; transición animada queda fuera de alcance salvo que la pidáis después.
