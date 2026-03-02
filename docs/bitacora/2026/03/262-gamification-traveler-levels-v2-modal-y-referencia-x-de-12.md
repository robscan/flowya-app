# 262 - GAMIFICATION_TRAVELER_LEVELS v2: barra con referencia `X/12` + modal de niveles

Fecha: 2026-03-01  
Tipo: UX + Producto + Implementación  
Área: Explore > CountriesSheet + Share card + Contratos

## Resumen

Se implementa versión v2 de niveles de exploración con lenguaje neutro y escala extendida (12 niveles), incluyendo:

- Barra de progreso en `visitados` con:
  - Izquierda: `Nivel de exploración: <NombreNivel>`
  - Derecha: `<nivelActual>/12` (accionable)
- Modal informativo al tocar `X/12` con todos los niveles y rangos.
- Fuente canónica de niveles en código para evitar desalineaciones.

## Problema

- El esquema previo (5 niveles) quedaba corto para progresiones altas.
- El copy mezclaba estilos y términos con posible sesgo de género.
- No existía una forma visible de entender la posición relativa del nivel actual.

## Decisión

1. Definir una escala de 12 niveles con nomenclatura neutra y consistente.
2. Mostrar nivel actual como texto + posición (`X/12`) en la barra del sheet de `visitados`.
3. Abrir modal de referencia al tocar `X/12`, sin efectos secundarios en estado.
4. Reusar la misma fuente de niveles para share card.

## Implementación

### 1) Fuente canónica de niveles

- Archivo nuevo: `lib/traveler-levels.ts`
- Contiene:
  - `TRAVELER_LEVELS` (12 niveles)
  - `resolveTravelerLevel(countriesCount)`
  - `formatTravelerLevelRange(level)`

### 2) CountriesSheet (visitados)

- Archivo: `components/explorar/CountriesSheet.tsx`
- Cambios:
  - Barra de progreso: texto izquierdo + botón derecho `X/12`.
  - Botón `X/12` abre modal.
  - Modal listado de niveles (`Nivel N: Nombre` + `(a-b países)`).
  - Resaltado visual del nivel actual.
  - Ajuste de alto del bloque de progreso para soportar doble línea/acciones.

### 3) Share card

- Archivo: `lib/share-countries-card.ts`
- Cambio:
  - Texto de nivel calculado desde la fuente canónica:
    - `Nivel de exploración: <NombreNivel>`

### 4) Contrato actualizado

- Archivo: `docs/contracts/GAMIFICATION_TRAVELER_LEVELS.md`
- Se documenta:
  - Escala v2 de 12 niveles.
  - Comportamiento del modal `X/12`.
  - Criterios y riesgos.

## Escala v2 aplicada

1. Inicial (0-4)  
2. Activo (5-9)  
3. Regional (10-19)  
4. Extendido (20-34)  
5. Constante (35-49)  
6. Global (50-69)  
7. Avanzado (70-89)  
8. Experto (90-109)  
9. Referente (110-129)  
10. Elite (130-149)  
11. Legendario (150-174)  
12. Total (175-195)

## Riesgos y mitigación

- Riesgo: demasiados niveles sin valor percibido.
  - Mitigación: modal informativo claro + potencial futura simplificación por telemetría.
- Riesgo: inconsistencias entre UI y share.
  - Mitigación: cálculo único en `lib/traveler-levels.ts`.

## Estado

- Implementado.
- Pendiente: validación UX con usuarios reales para ajustar umbrales/copy si aplica.
