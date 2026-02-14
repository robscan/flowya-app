# Bitácora 085 (2026/02) — SpotSheet V3: drawer 3 estados sin bugs de layout

## Qué se ajustó

- **Peek**: Barra/carta totalmente tappable (excepto X). Sin botón "Ver detalle". Mini imagen, título, descripción corta (1-2 líneas). X a la derecha.
- **Medium**: Header (Share izq, título centro, Close der). Debajo: descripción corta, imagen, pills Guardar/Visitado. Sin scroll, height auto. Handle/chevron para expandir.
- **Expanded**: Mismo header + handle + mismo bloque Medium. Luego ScrollView con: distancia "de tu ubicación", Por qué importa, Dirección, Cómo llegar, Editar detalles. maxHeight 86dvh, overflowY auto.
- Helpers internos: renderHeader(), renderMediumCore(), renderExpandedExtras() para evitar duplicación.
- Cerrar Dialog => setSheetState("peek") sin perder selectedSpot.

## Cómo probar

1. `/exploreV3` web, seleccionar un spot => aparece Peek.
2. Tap en Peek (casi toda el área) => abre Medium sin scroll.
3. Medium: Share izq, Close der, título centrado; debajo desc, imagen, Guardar/Visitado.
4. Tap en handle (chevron) => Expanded con extras scrolleables.
5. Cerrar (X o fuera) => vuelve a Peek, selectedSpot sigue.
6. Consola: sin error CSSStyleDeclaration.
