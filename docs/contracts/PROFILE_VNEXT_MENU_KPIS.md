# PROFILE_VNEXT_MENU_KPIS — Contrato perfil vNext (web-first)

**Estado:** ACTIVE (2026-04)

## Objetivo

Reestructurar `/account` para que deje de ser una “página única larga” y se convierta en:

- **Home de menú** con accesos a subpantallas
- **Header KPI interactivo** reusando el canon de Explore: “Países, lugares y flows”
- **Acceso a niveles** vía `TravelerLevelsModal`
- **Desktop**: sidebar como `transparentModal` manteniendo el mapa interactivo fuera del panel

## 1) Rutas (web)

- `/account` → **Home menú**
- `/account/account` → **Cuenta** (avatar, nombre, email)
- `/account/privacy` → **Privacidad de fotos** (toggle `share_photos_with_world`)
- `/account/language` → **Idioma** (placeholder)

## 2) Layout: `AccountShell`

- **Desktop (web ≥ tablet)**:
  - Presentación: `transparentModal`
  - Panel fijo izquierdo (400px)
  - El resto del viewport **no** debe bloquear interacción con el mapa
  - Regla de hit-testing: root usa `pointerEvents="box-none"` y el panel `pointerEvents="auto"`
- **Mobile / web angosta**:
  - Pantalla normal (no modal transparente)

## 3) Header KPI (home menú)

### 3.1 Componente de UI

- Usar `CountriesSheetKpiRow` como fila canónica “países · lugares · flows”.
- Mantener interactividad:
  - Tap **Países**: abre CountriesSheet en Explore (filtro `visited`).
  - Tap **Lugares**: abre CountriesSheet y hace drilldown a **listado “Lugares”** (`all_places`).
  - Tap **Nivel**: abre `TravelerLevelsModal`.

### 3.2 Fuente de datos

- **Contrato de carga y paridad con Explorar:** `PROFILE_KPI_STALE_WHILE_REVALIDATE.md` (instantánea warm, fetch deduplicado, revalidación en foco).
- Agregados visitados: `computeVisitedCountryKpisFromSpots` sobre spots visibles con pins (`visitedPlacesCount`, `visitedCountriesCount`, `flowsPoints`, `visitedWorldPercent`, nivel por puntos).
- `flowsPoints`: fórmula canónica `computeTravelerPoints` (ver `GAMIFICATION_TRAVELER_LEVELS.md`).
- `currentTravelerLevel`: `resolveTravelerLevelByPoints(flowsPoints)`.

## 4) Bridge de navegación (Perfil → Explore)

Cuando el KPI se pulsa en `/account`, se usa un **intento one-shot** para que Explore ejecute la acción al volver:

- Guardar en `sessionStorage` una intención efímera (`flowya_explore_entry_intent_v1`).
- En `MapScreenVNext`, consumirla una sola vez y ejecutar:
  - `handleVisitedCountriesPress()` y opcionalmente `handleCountriesSpotsKpiPress()` para `all_places`.

## 5) Guardrails

- No hacer `supabase.auth.getUser()` en hot paths del header KPI; preferir sesión local.
- El home menú debe renderizar aunque el perfil falle (no bloquear UX).
- Evitar overlays transparentes que capturen clics fuera del panel en desktop.

## 6) Compartir avance (PNG países visitados)

- El CTA **«Compartir mi avance»** en home menú debe usar solo `shareVisitedCountriesProgress` desde `@/lib/explore/visited-countries-share`.
- Contrato detallado: **`VISITED_COUNTRIES_SHARE_FLOW.md`**.
