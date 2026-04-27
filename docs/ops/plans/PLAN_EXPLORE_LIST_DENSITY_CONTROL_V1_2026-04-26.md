# PLAN — Explore List Density Control V1

Fecha: 2026-04-26  
Estado: implementado / pendiente QA final de producto

## Objetivo

Permitir que el usuario controle el nivel de detalle visual de los listados sin cambiar filtros, resultados ni pines visibles.

## Decisión de arquitectura

No se crean tres familias de cards. Se extiende el componente canónico `SearchListCard` / `ResultRow` con una prop `density`:

- `detail`: lectura completa.
- `compact`: escaneo con tags y editor.
- `simple`: navegación rápida por nombre e imagen/icono, sin envolvente de card y con padding mínimo.

La selección múltiple se define como estado transversal del mismo componente (`selectionMode`, `selected`, `disabled`) y debe funcionar en las tres densidades.

## Alcance V1

- `ExploreListDensityControl` en Design System.
- Persistencia local de preferencia UI.
- Aplicación en listados de Lugares y Buscador.
- Vitrina DS con matriz de densidad + selección.
- Documentación de contrato.
- Color contextual de card según filtro activo (`Todos`, `Por visitar`, `Visitados`) usando tokens existentes.
- Riel canónico de controles de listado: `Seleccionar` + densidad, fuera del header de sección.
- Imagen de portada como rail vertical full-height en `detail`/`compact`; en `simple`, thumbnail circular equivalente al icono.
- CTA compacto de subir foto en `Visitados`: cuando no hay imagen visible y existe `add_image`, `compact`/`simple` muestran `ImagePlus` accionable con el lenguaje visual del slot de media pendiente, sin label.
- Filtro por categorías Maki en la ventana `Filtrar`, calculado desde los elementos del listado actual.
- Chips activos para categorías Maki en las barras de filtros, con opción de limpiar cada categoría.

## Fuera de alcance V1

- Reordenamiento de ranking por densidad.
- Personalización por usuario en Supabase.
- Densidad por lista/contexto diferente.
- Cambios de datos, RLS o migraciones.
- Taxonomía propia de producto; Maki sigue siendo señal de proveedor/snapshot, no categoría editorial definitiva.
- Persistencia remota de categorías seleccionadas.

## DoD

- Cambiar densidad no cambia resultados, filtros ni pines.
- Selección múltiple conserva indicador claro en `detail`, `compact` y `simple`.
- `compact` no muestra dirección/descripción.
- `simple` no muestra acciones ni metadata.
- Buscador y Lugares usan el mismo canon.
- DS documenta control y estados.
- `SearchListCard` respeta color contextual sin cambiar resultados ni visibilidad.
- `Seleccionar` no compite visualmente con `Filtrar` ni con el header de sección.
- La portada mantiene comportamiento consistente por densidad: rail en lectura/escaneo y círculo en navegación mínima.
- `simple` conserva target táctil usable, pero reduce altura visual y elimina borde de card.
- En `Visitados`, el icono `ImagePlus` de `compact`/`simple` sube foto sin abrir la ficha y no aparece en `selectionMode`.
- Filtrar por Maki acota lista, búsqueda y pines con semántica OR entre categorías seleccionadas.
- Las opciones Maki se recalculan con el scope vigente y se limpian si dejan de existir en el listado actual.
- Los chips activos de Maki se muestran junto a los otros filtros y pueden retirarse sin abrir el modal.
- En buscador `Todos`, `Por visitar` y `Visitados` comparten fila `Buscar` + `Filtrar` y riel `Seleccionar` + densidad.
- El fallback cross-filter usa copy corto y accionable: “No hay resultados en [filtro], buscando en el mapa.”
- Ese copy no aparece si la lista final ya contiene resultados del filtro activo, aunque técnicamente se haya usado el pool ampliado.

## QA manual

1. En Visitados > Lugares, cambiar entre las tres densidades.
2. Activar Seleccionar y verificar indicador vacío/check en cada densidad.
3. En Buscador con Visitados/Por visitar, repetir cambio de densidad.
4. En Buscador con Todos, confirmar que aparecen `Filtrar`, `Seleccionar` y densidad.
5. Confirmar que filtros activos, cantidad de resultados y pines no cambian.
6. Confirmar que `Etiquetar` solo aparece en `detail`/`compact`.
7. Confirmar que Por visitar y Visitados tiñen cards de forma sutil y legible.
8. Confirmar que `Seleccionar` aparece en el riel de controles, no en `LUGARES EN EL MAPA`.
9. Confirmar que las imágenes de portada ocupan todo el alto en `detail`/`compact` y círculo compacto en `simple`.
10. En `Visitados` sin imagen, tocar el `ImagePlus` en `compact`/`simple` y confirmar que abre picker/subida sin abrir la ficha.
11. Activar selección múltiple y confirmar que `ImagePlus` se reemplaza por círculo/check de selección.
12. Abrir `Filtrar`, seleccionar una o varias categorías y confirmar que el listado, buscador y pines se acotan.
13. Limpiar una categoría desde su chip activo y confirmar que se recuperan resultados.

## Siguiente micro-scope recomendado

Cerrar QA transversal de Explore antes de seguir agregando superficie UI:

- Listas: densidad, selección múltiple, Maki, tags, país y CTA de imagen en `Todos`/`Por visitar`/`Visitados`.
- Sheets: welcome, países, lugares y spot sheet bajo cambios de filtro/navegación.
- Media: subida desde sheet/lista, refresh inmediato y estado de carga.
- Mapa: pines visibles, selección preservada, no saltos de cámara y encuadres por bbox.
