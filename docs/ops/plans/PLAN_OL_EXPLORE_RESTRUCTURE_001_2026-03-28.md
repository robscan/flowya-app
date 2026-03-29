# PLAN_OL_EXPLORE_RESTRUCTURE_001_2026-03-28

## Estado

- **Estado:** cerrado en implementación
- **Fecha de cierre:** 2026-03-29
- **Bitácora:** `315-ol-explore-restructure-shell-web-home-accionable.md`

## Cierre aplicado

- shell inferior con `input + perfil` dentro de un contenedor único
- launcher de búsqueda visible en home; tap abre la búsqueda actual
- placeholder final: `Busca países o lugares`
- filtros inline arriba al centro con variante responsiva:
  - `compact` para anchos pequeños
  - `wide/auto` con labels visibles para anchos tipo iPhone 12+
- afinación de densidad visual en filtros wide
- ocultar contador del filtro activo
- logout encima del perfil con ajuste fino de offset
- `FLOWYA` como trigger secundario de feedback
- badge `países | flows` en banda inferior con estilo de filtro no activo
- badge oculto cuando hay toast o logout visible
- tap en badge `países | flows` abre el mismo flujo que el KPI de países visitados
- piezas canonizadas en design system en vez de resolverlas inline en `MapScreenVNext`

## Objetivo

Reestructurar la pantalla de Explore para que la home web comunique mejor la acción principal desde el primer render:

- input de búsqueda visible en la base de la pantalla
- placeholder que invite a actuar
- perfil a la derecha del input, en la misma hilera
- filtros inline arriba al centro (`Todos`, `Por visitar`, `Visitados`)
- ubicación revisada para letrero `FLOWYA` como trigger de feedback

sin reabrir V3 ni cambiar el core de búsqueda.

## Contexto real del repo

- la entrada web real sigue siendo `MapScreenVNext`
- el buscador hoy se comporta como overlay/entry separado
- el perfil vive mezclado con otros controles de Explore
- los contratos actuales describen entry/exit de búsqueda, no una home con search abierto por defecto
- el patrón de Apple Maps documentado por Apple muestra la foto o iniciales del usuario junto al search field, no como botón aislado arriba a la derecha

Referencias:

- `components/explorar/MapScreenVNext.tsx`
- `components/search/SearchOverlayWeb.tsx`
- `docs/contracts/SEARCH_V2.md`
- `docs/ops/analysis/EXPLORE_PHASE0_ANALYSIS.md`

## Alcance

### ER-01 Shell de Explore

- redefinir la jerarquía visible del home
- mantener mapa como superficie principal
- dejar el buscador como capa base visible en la parte inferior

### ER-02 Buscador abierto por defecto

- Explore debe iniciar con el **input visible** en la base de la pantalla
- el tap sobre el input debe abrir la experiencia actual de búsqueda
- no significa mantener el panel/listado abierto desde el primer render
- conservar keyboard-safe y evitar que el shell colapse

### ER-03 Placeholder de invitación

- actualizar placeholder para que invite a actuar, no solo describa el campo
- el copy debe empujar descubrimiento intencional

### ER-04 Reubicación de controles

- perfil a la derecha del input, en la misma hilera inferior
- filtros inline arriba al centro
- validar equilibrio visual con slogan o elementos de marca existentes
- usar como referencia el patrón de Apple Maps: botón de cuenta junto al campo, no flotando aparte

### ER-05 Prueba de interacción

- probar si con el perfil a la derecha y filtros inline al centro la home se lee mejor
- validar que no se rompan z-index, pointer events ni gestures

### ER-06 Filtros inline superiores

- usar como variante activa los filtros superiores desplegados inline
- alcance:
  - `Todos`
  - `Por visitar`
  - `Visitados`
- objetivo:
  - evaluar legibilidad
  - evaluar rapidez de uso
  - evaluar si mejora la comprensión frente al control actual

### ER-07 Letrero `FLOWYA` como trigger de feedback

- revisar ubicación del letrero `FLOWYA` para que funcione como disparador de `FlowyaBetaModal`
- el trigger debe seguir existiendo, pero sin competir con acciones primarias
- la ubicación final debe reforzar jerarquía de acciones:
  - primaria: búsqueda
  - secundaria: filtros
  - terciaria: perfil
  - cuaternaria: feedback / marca

## No alcance

- migración a Radix/shadcn
- rediseño completo de mapa o sheet
- cambios de lógica Search V2
- cambios de Recordar-lite

## Principios

- explorar debe sentirse accionable desde el primer frame
- no esconder la búsqueda como CTA secundaria
- mantener map-first, pero con search-first como invitación de uso
- no romper contratos de selección, cierre de sheet ni keyboard-safe
- diferenciar claramente entre “input visible” y “overlay de búsqueda abierto”
- tratar filtros inline como la variante activa mientras validamos uso real
- la marca no debe robar la posición de una acción principal
- el trigger de feedback debe sentirse disponible pero secundario

## Análisis del requerimiento

### 1. Qué cambia realmente

El requerimiento no pide “más branding”; pide una home que detone acciones mejor.

Por lo tanto, la jerarquía correcta del shell debe ser:

1. `Buscar`
2. `Filtrar`
3. `Entrar a perfil`
4. `Dar feedback`

Si `FLOWYA` compite visualmente con 1 o 2, deja de ayudar y empieza a estorbar.

### 2. Cómo se cruzan las referencias dadas

#### Referencia Apple Maps

- patrón principal: botón de cuenta junto al search field
- la acción dominante visible es el campo de búsqueda
- la interfaz se entiende por acciones, no por branding grande

#### Referencia runtime actual del repo

- hoy `FLOWYA` vive abajo a la izquierda y abre `FlowyaBetaModal`
- ese patrón funcionaba cuando abajo no existía una hilera `perfil + input`
- con el nuevo shell, esa posición compite con la nueva base accionable

### 3. Implicación de diseño

Si movemos el perfil a la derecha del input, la hilera inferior queda cerrada como bloque accionable y el borde izquierdo del input pasa a ser el mejor ancla visual disponible.

Entonces `FLOWYA` ya no debe competir ni con el perfil ni con la búsqueda. Debe pasar a una posición de apoyo, cercana al clúster inferior pero con menos peso visual.

## Sugerencias de alineación

### Opción A — Recomendada

Ubicación:

- `FLOWYA` como wordmark pequeño, tappable, **justo arriba de la hilera inferior**
- alineado con el borde izquierdo del **input**, no con el borde del perfil ni con el borde total de pantalla

Razones:

- no compite con el perfil
- no invade la esquina de filtros
- se mantiene cerca del área de acción principal
- preserva `FLOWYA` como trigger de feedback sin convertirlo en CTA dominante

Lectura visual:

- arriba: filtros/contexto
- centro: mapa
- abajo: `FLOWYA` secundario + hilera `input + perfil`

### Opción B — Aceptable

Ubicación:

- `FLOWYA` pequeño en la esquina superior derecha

Razones:

- deja libre la base
- se separa claramente del clúster de búsqueda

Problema:

- compite con una zona donde luego podrían vivir acciones de mapa o cuenta
- se siente más “badge de marca” que detonador contextual de feedback

### Opción C — No recomendada

Ubicación:

- pegar `FLOWYA` al perfil o convertirlo en CTA principal

Problema:

- rompe la jerarquía accionable del shell
- le roba claridad a búsqueda y filtros

## Recomendación final de ubicación

Usar la **Opción A**:

- `FLOWYA` como trigger de feedback
- pequeño, discreto y tappable
- colocado **encima de la hilera inferior**
- alineado con el borde izquierdo del input

## Reglas visuales sugeridas

- tipografía: misma familia de marca, pero un nivel por debajo del input en peso visual
- opacidad o contraste ligeramente menor que el input
- no usar contenedor pesado ni botón sólido
- mantenerlo como texto accionable o chip de marca muy liviano
- tap abre `FlowyaBetaModal`

## Regla de producto

Si hay conflicto entre:

- claridad de búsqueda
- claridad de filtros
- o visibilidad del perfil

entonces `FLOWYA` debe ceder antes que cualquiera de esos tres.

## Comportamiento de `FLOWYA` según estado del sheet

### Sheet colapsado / peek

Comportamiento recomendado:

- `FLOWYA` puede seguir visible
- debe mantenerse en su posición secundaria, justo arriba de la hilera inferior
- no debe bloquear el tap del sheet ni del input

Racional:

- en `peek` todavía hay espacio visual suficiente
- el usuario sigue en modo exploración ligera
- el trigger de feedback sigue disponible sin invadir la acción principal

### Sheet medium

Comportamiento recomendado:

- `FLOWYA` debe ocultarse

Racional:

- en `medium` la prioridad ya cambió a contenido/contexto del spot
- mantener `FLOWYA` visible competiría con el sheet y con la lectura del lugar
- reduce ruido y evita taps accidentales

### Sheet expanded

Comportamiento recomendado:

- `FLOWYA` debe permanecer oculto

Racional:

- en `expanded` el foco es totalmente el contenido del sheet
- la marca/feedback no debe convivir con una tarea de detalle o edición contextual

## Regla canónica de visibilidad

- visible solo cuando el usuario está en modo exploración base y el sheet está en `peek` o ausente
- oculto cuando:
  - `sheetState === 'medium'`
  - `sheetState === 'expanded'`
  - búsqueda abierta
  - overlays de creación activos

## Objetivo UX de esta regla

- `FLOWYA` acompaña la exploración
- no compite con selección ni lectura de detalle
- desaparece cuando el usuario ya está dentro de una tarea más profunda

## Archivos ancla del repo

- `components/explorar/MapScreenVNext.tsx`
- `components/search/SearchOverlayWeb.tsx`
- `components/search/SearchSurface.tsx`
- `components/search/SearchInputV2.tsx`
- `components/explorar/layer-z.ts`

## Backlog técnico sugerido

- `BT-EXP-REST-01` Definir layout objetivo del shell Explore web.
- `BT-EXP-REST-02` Ajustar estado inicial para mostrar el input visible, no el panel abierto.
- `BT-EXP-REST-03` Reposicionar la hilera `perfil + input` en la base de la pantalla sin romper sheet/mapa.
- `BT-EXP-REST-04` Cambiar placeholder del buscador a copy de invitación.
- `BT-EXP-REST-05` Mover perfil al lado derecho del input.
- `BT-EXP-REST-06` Mover filtros inline arriba al centro.
- `BT-EXP-REST-07` Validar la lectura y estabilidad de la variante inline (`Todos`, `Por visitar`, `Visitados`).
- `BT-EXP-REST-08` Ajustar logout para que se despliegue arriba del perfil sin salir de viewport.
- `BT-EXP-REST-09` Reubicar el trigger `FLOWYA` / feedback sin competir con la hilera inferior.
- `BT-EXP-REST-10` Definir y aplicar regla de visibilidad de `FLOWYA` según estado del sheet y del toast.
- `BT-EXP-REST-11` QA de z-index, pointer events, scroll, teclado, toast y selección.

## Riesgos

1. Abrir el buscador por defecto y romper continuidad con SpotSheet.
- Mitigación: no abrir el panel/listado por defecto; mostrar solo el input.

2. Saturar la home con demasiados elementos arriba.
- Mitigación: dejar solo filtros inline centrados; no sumar controles nuevos en la franja superior.

3. Tocar layout y responsividad en el mismo cambio sin reglas claras.
- Mitigación: este OL define la estructura; `OL-WEB-RESPONSIVE-001` la estabiliza entre viewports.

4. Adoptar filtros inline sin vigilar la claridad del mapa.
- Mitigación: revisar densidad visual y respuesta del mapa antes de consolidar el layout.

5. Darle demasiado peso a `FLOWYA` y debilitar la interfaz accionable.
- Mitigación: tratar la marca/feedback como acción terciaria o cuaternaria.

## Criterio de cierre

Se considera cerrado cuando:

1. Explore abre con el input visible en la base.
2. El placeholder invita a la acción.
3. El perfil queda a la derecha del input y los filtros se muestran inline arriba al centro.
4. El logout del usuario autenticado aparece encima del perfil.
5. La pantalla sigue siendo usable y coherente en web sin romper el loop principal.
6. `FLOWYA` sigue detonando feedback, pero desde una ubicación secundaria que no compite con la búsqueda ni con el toast.

## Posición en roadmap

Se ejecutó antes de `OL-WEB-RESPONSIVE-001`, cumpliendo la secuencia prevista: primero cerrar la estructura del shell y después estabilizar su consistencia entre viewports.
