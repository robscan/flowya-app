# 371 — Search: teclado se cerraba al pasar de 2 a ≥3 caracteres (scroll unificado)

**Fecha:** 2026-04-19  
**Integración:** PR [#155](https://github.com/robscan/flowya-app/pull/155) (squash-merge a `main`, commit `4be635d`).

## Síntoma

Al escribir en el buscador de la ventana de búsqueda (Explore / `SearchSurface`), al superar el **umbral de 3 caracteres** el **teclado se ocultaba de inmediato**, sin que el usuario hubiera hecho scroll ni quitado el foco del campo.

## Causa raíz

La UI alternaba entre **distintos contenedores con scroll**:

- Con longitud &lt; 3 (vacío / pre-búsqueda): un **`ScrollView`** envolvía el header (incluido `SearchInputV2`) y el contenido.
- Con longitud ≥ 3 y resultados: se montaba **`ListView`** (`SearchResultsListV2`), es decir **otro** **`ScrollView`** con el header en su propiedad `header`.

Al cruzar el umbral, el **primer `ScrollView` se desmontaba** y el input pasaba a vivir bajo un **árbol nuevo** → el `TextInput` se **desmontaba**, se perdía el **foco** y el sistema cerraba el teclado.

## Solución

En **`components/search/SearchSurface.tsx`**:

- Un **solo** `ScrollView` para el área de resultados.
- El **mismo** bloque de header desplazable (`scrollableSearchHeaderEl`) permanece montado; solo cambian los **hijos inferiores** (listas por defecto, recientes, resultados, sin resultados).
- La lógica de **`fetchMore`** (proximidad al final del scroll) se integra en el **`onScroll`** de ese `ScrollView` (equivalente a lo que hacía `ListView`).

## Contrato UX (recordatorio)

- Cerrar teclado por **scroll** o **blur** del campo sigue gobernado por los adapters (`SearchOverlayWeb` / nativo) y `keyboardDismissMode` según plataforma; este cambio solo evita el cierre **accidental por remount** al teclear.

## Archivos

- `components/search/SearchSurface.tsx`

## Referencias

- [`docs/contracts/SEARCH_V2.md`](../../contracts/SEARCH_V2.md) (contexto Search V2)
- [`docs/ops/OPEN_LOOPS.md`](../../ops/OPEN_LOOPS.md)
