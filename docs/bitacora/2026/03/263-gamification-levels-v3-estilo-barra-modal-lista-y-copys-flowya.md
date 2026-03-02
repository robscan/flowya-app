# 263 - GAMIFICATION levels v3: estilo barra, modal lista y copys FLOWYA

Fecha: 2026-03-01  
Tipo: UX/UI + copy system  
Área: CountriesSheet + contrato de gamificación

## Resumen

Se ajusta el bloque de niveles para alinearlo con estilo visual de sheet y tono FLOWYA:

- Barra:
  - `Nivel: <Nombre>` (solo el nombre en bold).
  - Accionable derecho `X/12` en gris + icono de listado.
- Modal de niveles:
  - Cierre con botón circular de icono (estilo sheet).
  - Listado sin cards envolventes.
  - Composición por fila:
    - Izquierda: `Nivel N: Nombre`
    - Derecha: `a-b países`

## Nomenclatura

Se actualiza la escala a una versión más relajada y neutra:

1. Inicio  
2. En ruta  
3. Con impulso  
4. En expansion  
5. Buen ritmo  
6. Sin fronteras  
7. Avanzado  
8. Alto vuelo  
9. Referente  
10. Elite  
11. Legendario  
12. Total

## Archivos

- `components/explorar/CountriesSheet.tsx`
- `lib/traveler-levels.ts`
- `docs/contracts/GAMIFICATION_TRAVELER_LEVELS.md`

## Estado

- Implementado.
- Pendiente fase posterior: sistema de puntos por spots + países (modelo compuesto).
