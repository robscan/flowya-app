# 266 — Gamification: orden canónico KPI en CountriesSheet/share + toast de flows orientado a acción

Fecha: 2026-03-01  
Tipo: UX/UI + copy + consistencia canónica  
Área: `CountriesSheet`, `share-countries-card`, `MapScreenVNext`, contratos

## Objetivo

Alinear la jerarquía de información en KPI y mejorar guía de uso de flows con copy accionable.

## Cambios aplicados

### 1) CountriesSheet (visitados + por visitar)

Archivo: `components/explorar/CountriesSheet.tsx`

- Se reordena la fila de KPI de izquierda a derecha a:
  1. `países`
  2. `spots`
  3. `flows` / `flows por obtener`
- No se altera comportamiento de acciones ni estados; solo orden de presentación.

### 2) Imagen para compartir (ambos filtros)

Archivo: `lib/share-countries-card.ts`

- Se alinea orden de KPI al canónico del sheet:
  1. `países`
  2. `spots`
  3. `flows` (o `flows por obtener` en `por visitar`)
- El valor de flows se calcula con la fórmula V1 vigente.

### 3) Toast de flows sobre perfil

Archivo: `components/explorar/MapScreenVNext.tsx`

- Copy actualizado para guiar acción de forma concreta:
  - `Suma flows marcando spots como visitados desde el mapa o buscador.`

## Contrato actualizado

Archivo: `docs/contracts/GAMIFICATION_TRAVELER_LEVELS.md`

- Se documenta explícitamente:
  - orden canónico de KPI en sheet y share,
  - diferenciación `flows` vs `flows por obtener`,
  - intención del toast como guía de uso (mapa/buscador).

## Resultado esperado

- Mayor consistencia visual y semántica entre sheet y share.
- Mejor comprensión de progresión (de contenido estructural a score).
- Mejor activación de usuario vía toast con instrucción directa.
