# PROFILE_KPI_STALE_WHILE_REVALIDATE — KPI de perfil y Explorar (caché + revalidación)

**Estado:** ACTIVE (2026-04)  
**Relaciona:** `PROFILE_VNEXT_MENU_KPIS.md`, `ACTIVITY_SUMMARY.md`, `explore/EXPLORE_RUNTIME_RULES_INDEX.md`

## Objetivo

Definir **un solo criterio de datos** y **un patrón de carga** para los KPI de “países / lugares / flows / nivel” en:

- **Explorar** (`MapScreenVNext`): pastillas, `CountriesSheet`, contadores del mapa.
- **Perfil** (`/account`, hook `useProfileKpis`): misma fila KPI (`CountriesSheetKpiRow`) + progreso.

Sin este contrato, Perfil y Explorar pueden **duplicar peticiones** (`spots` + pins) y Perfil puede **pintar tarde** el bloque KPI (saltos de layout sobre el menú).

## Principios

1. **Fuente de verdad del servidor** sigue siendo **Supabase + RLS**. El cliente **no** sustituye autorización; solo coordina **lecturas** y **presentación**.
2. **Stale-while-revalidate (SWR)**: mostrar **último estado conocido** en cuanto exista, y **revalidar en segundo plano** al montar Perfil o al compartir inflight con un `refetch` del mapa.
3. **Deduplicación**: dos llamadas concurrentes al mismo pipeline (`spots` visibles + pins) deben **compartir una promesa en vuelo** por usuario autenticado.

## Implementación canónica (referencia de código)

| Pieza | Rol |
|--------|-----|
| `lib/explore/spots-map-select.ts` | `SPOT_SELECT_FOR_MAP` único para mapa + perfil. |
| `lib/explore/fetch-visible-spots-with-pins.ts` | `fetchVisibleSpotsWithPinsDeduped(userId)`: sesión, `spots` + pins, `onlyVisible`; **inflight** por `userId`. |
| `lib/explore/profile-kpi-warm-cache.ts` | `commitProfileKpiWarmSnapshotFromExploreSpots`, `readProfileKpiWarmSnapshot`, `clearProfileKpiWarmSnapshot`. |
| `MapScreenVNext` | `refetchSpots` usa el fetch deduplicado; un `useEffect` hace **commit** de la instantánea KPI cuando cambian `spots` + usuario autenticado; al salir de sesión limpia caché. |
| `useProfileKpis` | Si hay instantánea **warm** para el `user.id`, **aplica KPI al instante** (`loading` false) y **sigue** con el fetch deduplicado para revalidar; al cerrar sesión limpia caché. |

## Semántica de los números

Los KPI de perfil deben usar la **misma proyección** que Explorar para spots en memoria:

- Misma selección SQL (`SPOT_SELECT_FOR_MAP`).
- Mismo merge de pins y mismo `onlyVisible` que el mapa.
- Mismo cálculo agregado vía `computeVisitedCountryKpisFromSpots` (`lib/explore/visited-country-kpis.ts`).

Así, **no** se interpretan “países visitados” con un criterio distinto en Perfil frente al sheet de países del mapa.

El **compartir imagen** de países visitados usa el mismo criterio de buckets/spots vía `buildVisitedCountriesShareBaselineFromSpots` y el flujo canónico `shareVisitedCountriesProgress` — ver **`VISITED_COUNTRIES_SHARE_FLOW.md`** (no acoplado al sheet).

## UX en Perfil (web y futura nativa)

- **Con instantánea warm** (usuario vino de Explorar con datos ya cargados): el bloque KPI **no debe quedar oculto** esperando red; puede mostrarse de inmediato.
- **Sin warm** (entrada directa a `/account`, cold start): se muestra **placeholder de altura estable** (skeleton / bloque reservado), no solo un spinner mínimo, para **no desplazar** el menú cuando lleguen los datos.
- Tras la primera revalidación, `refetch({ silent: true })` en foco **no** debe forzar spinner de pantalla completa en el bloque KPI.

## Seguridad y límites

- El fetch deduplicado **valida** que `session.user.id === expectedUserId`; si no coincide, devuelve lista vacía (cambio de sesión / carrera).
- La caché warm es **por sesión en memoria** (no persistida en disco): al cerrar sesión o usuario anónimo debe llamarse `clearProfileKpiWarmSnapshot()`.
- Cualquier **mutación** (guardar pin, crear spot, etc.) sigue validándose en servidor; esta capa solo evita lecturas redundantes y mejora continuidad visual.

## Checklist al añadir nuevas pantallas con KPI

- [ ] ¿Necesitas los mismos agregados visitados? → Reutiliza `fetchVisibleSpotsWithPinsDeduped` + `computeVisitedCountryKpisFromSpots` (o lee la warm cache si basta para primer frame).
- [ ] ¿Montas otra query paralela a `spots`+pins para el mismo usuario? → Evítalo o justifícalo (otro RLS / otro conjunto de columnas).
- [ ] ¿Cambias el criterio de “visible” o de pins? → Actualiza **mapa y perfil** a la vez y este contrato.
