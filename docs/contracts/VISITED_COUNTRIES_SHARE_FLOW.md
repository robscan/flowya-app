# VISITED_COUNTRIES_SHARE_FLOW — Compartir tarjeta «Países visitados»

**Estado:** ACTIVE (2026-04)  
**Relaciona:** `PROFILE_KPI_STALE_WHILE_REVALIDATE.md`, `ACTIVITY_SUMMARY.md`, `GAMIFICATION_TRAVELER_LEVELS.md`, `lib/share-countries-card.ts`

## Objetivo

Definir un **único flujo de producto** para generar y compartir la imagen PNG de **países visitados** (KPI + mapa + top países + marca), **sin acoplarlo al sheet de países** ni a un único entry point UI.

El sheet de países en Explorar puede **seguir mostrando** el mismo preview y pasar un snapshot ya listo, pero **no es** la fuente de verdad del flujo: cualquier pantalla puede invocar la API canónica.

## API canónica

| Export | Rol |
|--------|-----|
| `shareVisitedCountriesProgress(params)` (`lib/explore/visited-countries-share/flow.ts`) | Orquestación única: Web Share / descarga / portapapeles vía `shareCountriesCard` + feedback `notifyShareCountriesCardOutcome`. |
| `buildVisitedCountriesShareBaselineFromSpots` | Mismos buckets que Explorar/Perfil (`buildCountryBuckets` sobre spots con `pinStatus === "visited"`). |
| `warmVisitedCountriesShareCache` / `readVisitedCountriesShareCache` / `clearVisitedCountriesShareCache` | Caché warm **opcional** en memoria tras un compartir exitoso con PNG de mapa; lectura acelera un segundo intento. Los alias `syncCountriesShareVisitedSession` / `readCountriesShareVisitedSession` / `clearCountriesShareVisitedSession` quedan **deprecated** por compatibilidad. |
| `captureVisitedCountriesMapDataUrlWeb` (solo web, import interno) | Monta `CountriesMapPreview` fuera de pantalla y obtiene `data:image/png`. El contenedor replica **`getCountriesSheetMapPreviewCaptureSizePx`** (`lib/explore/countries-sheet-map-preview-dimensions.ts`): mismas reglas que el `mapPreviewWrap` del `CountriesSheet` (panel desktop 400 − padding; sheet móvil acotado a `WEB_SHEET_MAX_WIDTH` y viewport). La composición final PNG sigue definiéndose en `shareCountriesCard` / `SHARE_COUNTRIES_VISITED_MAP_SLOT`. |

Barrel público: `@/lib/explore/visited-countries-share` (`index.ts`). No reexportar captura en el barrel para no arrastrar implementación web a bundles nativos innecesariamente.

## Pie de tarjeta (marca + usuario)

En **web**, antes de pintar el canvas, `shareCountriesCard` fusiona datos de perfil vía `resolveShareCardProfileForCurrentUser` (`lib/share-countries-card-profile.ts`): avatar público en **data URL** (evita canvas “tainted”) y nombre (`display_name` → `email`). El pie: **foto y nombre en línea** (misma altura, `textBaseline: middle`), avatar en círculo con relleno tipo **cover** (sin bandas laterales en retratos), **flowya.app** a la derecha (`drawCard`). Sin sesión o sin datos, pie centrado solo con `flowya.app`.

## Contrato de datos

1. **Spots + pins:** `fetchVisibleSpotsWithPinsDeduped(userId)` — misma deduplicación y RLS que KPI perfil (`PROFILE_KPI_STALE_WHILE_REVALIDATE.md`).
2. **Métricas:** `countriesCount` = `buildCountryBuckets(visited).length`; `spotsCount` = cardinal de visitados; `worldPercentage` = redondeo `(countriesCount / 195) * 100`.
3. **Items:** orden y conteos idénticos a buckets del mapa (lista «Top países» en PNG).
4. **Mapa en PNG:** en **web**, si no hay `precomposed.mapSnapshotDataUrl` ni caché warm con snapshot, se genera con `captureVisitedCountriesMapDataUrlWeb`. En **nativo**, sin captura web, el flujo puede completar la tarjeta **sin** imagen de mapa en el canvas (bloque vacío); no se exige abrir el sheet.

## Resolución de entrada (`shareVisitedCountriesProgress`)

1. Si `params.precomposed.mapSnapshotDataUrl` está relleno → compartir con ese payload (p. ej. preview ya generado en Explorar).
2. Si no, si la caché warm tiene snapshot → mismo paso.
3. Si no → sesión Supabase → spots → baseline → (web) captura offscreen → compartir.
4. Tras éxito con snapshot, **siempre** `warmVisitedCountriesShareCache` (no-op si mapa vacío).

## Entry points actuales (no exhaustivo)

- **Perfil web** — botón «Compartir mi avance»: `shareVisitedCountriesProgress({ show, colorScheme })`.
- **Explorar** — compartir con overlay **visitados** y snapshot KPI: `shareVisitedCountriesProgress({ ..., precomposed: { … } })`. Overlay **por visitar** sigue usando `shareCountriesCard` directo (otro título/accento); fuera de este contrato hasta que se unifique.

## Seguridad y límites

- Sin sesión autenticada (o anónimo) → mensaje de error vía `show`; no se llama a Storage ni Mapbox con datos de otro usuario.
- Caché warm en memoria: limpiar en **logout** y **cambio de cuenta** (hosts: `MapScreenVNext`, pantallas de cuenta). No persistir en disco.
- `EXPO_PUBLIC_MAPBOX_TOKEN` requerido para **captura web** offscreen; si falla, mensaje explícito al usuario.

## Checklist al añadir un nuevo entry point

- [ ] ¿Llamas solo a `shareVisitedCountriesProgress` (o pasas `precomposed` si ya tienes snapshot + métricas coherentes)?
- [ ] ¿Evitas duplicar lógica de buckets, porcentaje o composición PNG fuera de `lib/share-countries-card`?
- [ ] ¿En logout / switch de cuenta llamas `clearVisitedCountriesShareCache` (o alias deprecated)?
