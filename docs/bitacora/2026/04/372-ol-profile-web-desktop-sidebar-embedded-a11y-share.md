# 372 — Perfil web: sidebar Explore embebido (desktop), a11y foco / aria-hidden, share visitados (WebKit)

**Fecha:** 2026-04-19  
**OL asociados (cierre documental en esta entrega):**

| OL | Estado | Notas |
|----|--------|--------|
| **OL-PROFILE-WEB-DESKTOP-SIDEBAR-001** | Cerrado (evidencia aquí) | Perfil ya no usa overlay full-screen del stack sobre el mapa en Explore desktop; UI en la misma columna que welcome/países/spot. |
| **OL-A11Y-ACCOUNT-NAV-WEB-001** | Cerrado (evidencia aquí) | Evitar warning «Blocked aria-hidden… descendant retained focus» al navegar entre pantallas de cuenta en web. |
| **OL-SHARE-VISITED-WEBKIT-001** | Cerrado (evidencia aquí) | Sheet de compartir en iOS/WebKit: una sola imagen compuesta sin `title` mezclado con `files` en `navigator.share`. |

> Los identificadores OL de la tabla son **etiquetas de trazabilidad** para esta bitácora; si producto usa otra numeración formal, enlazar desde el plan correspondiente.

---

## 1) Resumen ejecutivo

1. **Explore desktop (ancho ≥ `WEB_EXPLORE_SIDEBAR_MIN_WIDTH`, 1080px):** el perfil deja de montarse como pantalla del `Stack` raíz encima de todo el viewport. El estado vive en **`?account=profile|details|privacy|language`** en la ruta del mapa; **`MapScreenVNext`** renderiza **`AccountExploreDesktopPanel`** dentro de **`ExploreDesktopSidebarAnimatedColumn`**. Las rutas `app/account/*.web.tsx` hacen **`<Redirect>`** a `/` con el param adecuado cuando el sidebar Explore desktop está activo.
2. **Accesibilidad (web):** antes de `router.back()` / navegación entre subpantallas se llama **`blurActiveElement()`** para no dejar foco en un nodo que queda bajo `aria-hidden` del stack.
3. **Compartir «países visitados» (WebKit):** rama con archivos: **`navigator.share({ files: [file] })`** sin `title` cuando se comparten solo archivos (evita que el sheet muestre ítems duplicados tipo «2 Images»).

El **commit** asociado a esta bitácora incluye además el **inventario acumulado** en el working tree de la rama (perfil vNext, KPI, spot sheet, migraciones foto/privacidad, contratos, etc.); la sección 4 lista el alcance técnico ampliado según `git status` al cerrar.

---

## 2) Ajustes identificados en el hilo (detalle)

### 2.1 Perfil en columna Explore (desktop)

| Tema | Implementación |
|------|----------------|
| Query canónica | `lib/explore/account-desktop-query.ts` — clave `account`, valores `profile` \| `details` \| `privacy` \| `language`. |
| Detección sidebar desktop | `hooks/use-explore-desktop-sidebar-active.ts` — `webExploreUsesDesktopSidebar(width)`. |
| Mapa + chrome | `MapScreenVNext.tsx`: `useLocalSearchParams` incluye `account`; `accountDesktopExploreOpen`; `handleProfilePress` usa `router.setParams({ account: 'profile' })` en split desktop; sidebar renderiza **`AccountExploreDesktopPanel`** con prioridad sobre spot/países/welcome; **`accountProfileSidebarOpen`** incluye query embebida; botón perfil `selected` alineado. |
| Layout puro | `lib/explore-map-chrome-layout.ts` — input opcional **`accountDesktopExploreOpen`** para integrar el panel en **`exploreDesktopSidebarActive`** y ancho de columna. |
| Router de panel | `components/account/AccountExploreDesktopPanel.tsx` — conmuta paneles y cierra con `setParams({ account: '' })` / vuelve a `profile`. |
| Shell | `components/account/AccountShell.tsx` — **`layout: 'stack' \| 'embedded'`**; embebido sin `setOptions` de modal ni hacks DOM; stack mantiene modal transparente solo en ruta stack ancha (tablet). |
| Paneles reutilizables | `components/account/web/AccountHomePanel.web.tsx`, `AccountDetailsPanel.web.tsx`, `AccountPrivacyPanel.web.tsx`, `AccountLanguagePanel.web.tsx`. |
| Rutas web | `app/account/index.web.tsx`, `account.web.tsx`, `privacy.web.tsx`, `language.web.tsx` — Redirect en desktop + shell en vista estrecha. |
| Eliminado | `lib/web/account-profile-desktop-pointer-pass-through.ts` (sustituido por arquitectura embebida). |
| Contrato | `docs/contracts/PROFILE_AUTH_CONTRACT_CURRENT.md` — reglas web/desktop actualizadas. |

### 2.2 Stack móvil — botón cerrar (X) en subpantallas

| Regla | Comportamiento |
|--------|----------------|
| **Home de perfil** (`showBack === false`) | **X** → `router.back()` (sale del stack de cuenta hacia la pantalla anterior, p. ej. mapa). |
| **Subpantalla** (Cuenta, Privacidad, Idioma; `showBack === true`) | **Flecha atrás** → `router.back()` (vuelve al home de perfil `/account`). **X** → **`router.replace('/')`** (cierra todo el flujo de perfil y vuelve a Explorar), no un solo pop como el back. |

Implementación: `components/account/AccountShell.tsx` — `handleClose`. El modo **embedded** (desktop Explore) no cambia: **X** sigue usando `onEmbeddedClosePanel` (limpia `?account=`).

### 2.3 A11y — foco vs `aria-hidden`

| Ubicación | Cambio |
|-----------|--------|
| `components/account/AccountShell.tsx` | `blurActiveElement()` en **Volver** y **Cerrar** antes de navegar. |
| `components/account/web/AccountHomePanel.web.tsx` | `blurActiveElement()` antes de abrir sub-panel (stack o `setParams`). |

*(En la versión final, el menú home dejó de vivir solo en `app/account/index.web.tsx` al extraer el panel; la lógica de blur quedó en el panel compartido.)*

### 2.4 Share visitados — WebKit

| Archivo | Cambio |
|---------|--------|
| `lib/share-countries-card.ts` | Compartir con archivo(s): **`await navigator.share({ files: [file] })`** (sin `title`/`text` en esa rama) para alinear con `canShare({ files })` y evitar duplicación en el sheet del sistema. |

---

## 3) Verificación recomendada (QA)

- [ ] Web ≥1080: abrir perfil → panel en columna izquierda; mapa pan/zoom/taps en la franja derecha.
- [ ] Web ≥1080: subpantallas y **X** / **Atrás** limpian `?account=` o vuelven a `profile`.
- [ ] Web estrecha o móvil: `/account` sigue en stack con comportamiento previo.
- [ ] Consola: sin warning «Blocked aria-hidden…» al navegar menú perfil (web).
- [ ] iOS/Safari: compartir tarjeta visitados → una sola imagen en el sheet.

---

## 4) Inventario ampliado del mismo commit (working tree al cerrar)

Además de lo anterior, el commit agrupa cambios ya presentes en el repositorio de trabajo en torno a **perfil vNext**, **KPI**, **Explore**, **spot sheet / imágenes**, **contratos** y **migraciones**, entre otros:

- **App / layout:** `app/_layout.tsx`, `app/design-system.web.tsx`, `app/spot/edit/[id].web.tsx`, rutas `app/account/*` (`.tsx` / `.web.tsx`).
- **Componentes:** `components/account/*`, `components/explorar/MapScreenVNext.tsx`, `CountriesSheet.tsx`, `SpotSheet.tsx`, `components/design-system/*` (KPI countries, search cards, add-image-cta, explore-map-profile-button, index DS), `components/ui/system-status-bar.tsx`, `components/ui/share-photos-consent-modal.tsx`.
- **Lib / hooks:** `hooks/use-profile-kpis.ts`, `hooks/use-explore-desktop-sidebar-active.ts`, `lib/explore/*` (entry-intents, visited-countries-share, profile-kpi-warm-cache, etc.), `lib/share-countries-card.ts`, `lib/share-countries-card-profile.ts`, `lib/profile/*`, `lib/photo-sharing/*`, `lib/spot-*`, `lib/mapbox-*`, `lib/async/*`, `lib/ui/*`, etc.
- **Contratos / docs:** `docs/contracts/INDEX.md`, `PROFILE_*`, `PHOTO_SHARING_CONSENT.md`, `SPOT_SHEET_CONTENT_RULES.md`, `GAMIFICATION_TRAVELER_LEVELS.md`, `EXPLORE_RUNTIME_RULES_INDEX.md`, `docs/patterns/*`.
- **Supabase:** `030_profiles_photo_sharing_pref.sql`, `031_spot_personal_images_private.sql`, `032_storage_spot_personal_private.sql`.
- **Types:** `types/react-dom-client.d.ts`.

---

## 5) Referencias

- [`PROFILE_AUTH_CONTRACT_CURRENT.md`](../../contracts/PROFILE_AUTH_CONTRACT_CURRENT.md)
- [`EXPLORE_WEB_DESKTOP_SIDEBAR_CANON.md`](../../contracts/EXPLORE_WEB_DESKTOP_SIDEBAR_CANON.md) (contexto columna lateral)
- [`lib/focus-management.ts`](../../../lib/focus-management.ts)
- Bitácora perfil previa: [`354-ol-profile-001-cierre-web-paridad-nativa-diferida.md`](354-ol-profile-001-cierre-web-paridad-nativa-diferida.md)
