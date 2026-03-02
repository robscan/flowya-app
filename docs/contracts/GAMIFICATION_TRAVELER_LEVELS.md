# GAMIFICATION_TRAVELER_LEVELS

Fecha: 2026-03-01  
Estado: Definición v5 (V1 activa en runtime + V2 documentada)  
Scope: `CountriesSheet` + `MapScreen` (chip perfil) + imagen para compartir

## Objetivo

Definir una progresión de exploración clara, motivante y consistente entre:

- UI en tiempo real (sheet + mapa).
- Imagen compartible.
- Fuente canónica de cálculo.

## Lenguaje canónico (producto)

- En UX para usuario final usamos **flows**.
- En código interno se mantiene el nombre técnico **points**.
- Equivalencia canónica:
  - `1 flow == 1 point`.

## V1 activa (implementada)

### 1) Cálculo de flows

Fuente canónica: `lib/traveler-levels.ts`.

- País: `+120 flows`
- Spot: `+8 flows`
- Fórmula:
  - `flows = (countriesCount * 120) + (spotsCount * 8)`

Constantes:

- `TRAVELER_COUNTRY_POINTS = 120`
- `TRAVELER_SPOT_POINTS = 8`

### 2) Dónde se muestra

- `CountriesSheet`:
  - Orden canónico KPI (izquierda -> derecha): `países`, `spots`, `flows`.
  - `visitados`: tercera KPI etiquetada como `flows`.
  - `por visitar`: tercera KPI etiquetada como `flows por obtener`.
- `MapScreen`:
  - chip flotante sobre perfil con total de flows.
  - tap al chip: toast contextual con pista de uso (`mapa` / `buscador`).
- Share card:
  - orden KPI alineado al sheet: `países`, `spots`, `flows`.
  - mantiene fondo sólido por filtro.
  - etiqueta de marca: `flowya.app`.

### 3) Niveles (V1)

- Niveles resueltos por flows (`resolveTravelerLevelByPoints`).
- Total: `12` niveles (`X/12`).
- Barra de nivel visible solo en `visitados`.
- En `por visitar` **no** se muestra barra de nivel.

## Escala de niveles (v5)

| Nivel | Nombre | Rango países | Rango flows |
|---|---:|---:|---|
| 1 | `Inicio` | 0-4 | `0-299 flows` |
| 2 | `En ruta` | 5-9 | `300-799 flows` |
| 3 | `Con impulso` | 10-19 | `800-1999 flows` |
| 4 | `En expansión` | 20-34 | `2000-3199 flows` |
| 5 | `Buen ritmo` | 35-49 | `3200-4499 flows` |
| 6 | `Sin fronteras` | 50-69 | `4500-5899 flows` |
| 7 | `Avanzado` | 70-89 | `5900-7399 flows` |
| 8 | `Alto vuelo` | 90-109 | `7400-8999 flows` |
| 9 | `Referente` | 110-129 | `9000-10599 flows` |
| 10 | `Élite` | 130-149 | `10600-12399 flows` |
| 11 | `Legendario` | 150-174 | `12400-14599 flows` |
| 12 | `Total` | 175-195 | `14600+ flows` |

## Modal de niveles

- Trigger: tap en `X/12`.
- Composición por fila:
  - izquierda: `Nivel N: Nombre`
  - derecha: rango de flows del nivel
- El nivel actual se resalta con fondo más oscuro.
- Botón cerrar: circular con icono (patrón sheet).
- Sin cards envolventes por fila.

## Ejemplos V1 (numéricos)

- Caso A: `11 países`, `50 spots`
  - `flows = 11*120 + 50*8 = 1320 + 400 = 1720`
  - Nivel resultante: `3/12` (`Con impulso`).
- Caso B: `3 países`, `16 spots`
  - `flows = 3*120 + 16*8 = 360 + 128 = 488`
  - Nivel resultante (si aplicara barra): `2/12` (`En ruta`).

## Riesgos V1

1. Sobrepeso de países frente a spots.
- Mitigación: documentar calibración V2 (sin romper UX actual).

2. Confusión terminológica (`points` vs `flows`).
- Mitigación: contrato explícito de equivalencia y naming de UX unificado.

3. Progresión percibida lenta en perfiles con muchos spots locales.
- Mitigación: validar pesos con telemetría V2.

## V2 (documentada, no implementada)

### Objetivo V2

Evolucionar de un score lineal simple a un score calibrado con evidencia real:

- comportamiento real de uso,
- señal de distancia,
- retención por acciones de valor.

### 1) Capa de datos ideal

`analytics_sessions`:

- `session_id` (uuid)
- `user_id` (nullable)
- `platform` (`web`/`ios`/`android`)
- `app_version`
- `started_at`
- `ended_at`

`analytics_events`:

- `id` (uuid)
- `session_id` (fk)
- `user_id` (nullable)
- `event_name`
- `screen`
- `spot_id` (nullable)
- `country_code` (nullable)
- `filter_mode` (nullable)
- `payload_json` (jsonb)
- `created_at`

### 2) Eventos mínimos V2

- `filter_selected`
- `spot_sheet_opened`
- `spot_marked_to_visit`
- `spot_marked_visited`
- `country_sheet_opened`
- `country_level_modal_opened`
- `countries_share_requested`
- `countries_share_completed`
- `quick_add_image_started`
- `quick_add_image_completed`
- `quick_add_note_started`
- `quick_add_note_saved`

### 3) Distancia (propuesta de calibración por tramos)

Bono discreto por spot visitado confirmado:

- `0-1 km` -> `+0 flows`
- `1-5 km` -> `+2 flows`
- `5-20 km` -> `+5 flows`
- `20+ km` -> `+10 flows`

### 4) Guardrails V2

- tracking no bloqueante (si falla, UX sigue).
- sin PII sensible en `payload_json`.
- envíos en batch por sesión + reintento liviano.
- feature flag para activar/desactivar instrumentación.

## Criterio de salida para activar V2

1. Tabla de eventos estable en los 3 clientes (`web/ios/android`).
2. 4-6 semanas de datos de uso consistentes.
3. Recalibración aprobada de pesos (país/spot/distancia) sin degradar comprensión de usuario.
4. Plan de migración de score V1 -> V2 sin saltos bruscos de nivel.
