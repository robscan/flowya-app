# FLOWYA V1 Platform Convergence Architecture

**Estado:** CANONICO / ARQUITECTURA DE PLATAFORMA
**Fecha:** 2026-04-27
**Decision:** V1 no busca paridad con la web actual. V1 busca convergencia hacia el producto objetivo mobile-first.

---

## 1. Por que existe este documento

El hallazgo de iOS Simulator con `Map available on web.` demostro que la experiencia web habia avanzado mas que la app nativa.

La conclusion incorrecta seria intentar que iOS/Android alcancen paridad con esa web.

La conclusion correcta es:

> La web actual es una fuente de aprendizaje y piezas rescatables, no el destino que mobile debe copiar.

FLOWYA ya habia decidido reestructurar la experiencia. Por lo tanto, copiar la web actual trasladaria deuda al producto de tiendas.

La regla no es desperdiciar el aprendizaje ganado en web. La regla es no aferrarse a su implementacion.

De web se rescatan:

- aprendizajes de pruebas;
- evidencia UX;
- comportamiento que si resolvio JTBD;
- contratos y reglas de dominio;
- datos depurados;
- helpers reutilizables;
- patrones visuales que pasen por el target V1.

De web se descarta o reconstruye:

- todo patron que herede errores;
- toda superficie acoplada a desktop/sidebar/hover;
- toda solucion que bloquee iOS/Android;
- toda pieza que contradiga el target V1;
- toda complejidad que exista por historia, no por necesidad.

---

## 2. Principio directivo

No se termina web primero.

No se persigue paridad con web actual.

No se reescribe todo a ciegas.

Producto autoriza reconstruir cuando copiar o adaptar herede errores estructurales.

FLOWYA ejecuta **convergencia V1 mobile-first**:

1. definir la experiencia objetivo V1;
2. mantener web actual estable;
3. clasificar piezas existentes como conservar, adaptar, reconstruir o retirar;
4. extraer logica compartida donde sirva al objetivo V1;
5. construir iOS/Android desde el modelo correcto;
6. alinear web despues al contrato V1, no al reves.

---

## 3. Jerarquia de verdad

### Fuente de verdad V1

1. JTBD y Master Plan.
2. Store Readiness iOS/Android.
3. Contratos de datos, privacidad y RLS.
4. Arquitectura de dominio compartida.
5. UX objetivo mobile-first.
6. Implementacion iOS/Android.
7. Web actual como referencia/legacy.

### Implicacion

Si una pieza web no sirve al modelo V1, se adapta o se retira.

Si una pieza mobile necesita simplificar la web actual para llegar a tiendas, se simplifica.

Si una pieza existe solo en web, no queda automaticamente aprobada para V1.

---

## 4. Estados posibles de una pieza actual

Toda superficie, componente o logica existente debe clasificarse antes de migrar o reutilizar.

| Estado | Significado | Accion |
|---|---|---|
| Conservar | Sirve al modelo V1 y es multiplataforma o portable. | Mantener y cubrir con pruebas/contrato. |
| Adaptar | Tiene valor, pero esta acoplada a web o a una UX vieja. | Extraer lo util y rehacer la capa de plataforma. |
| Reconstruir | Resuelve un JTBD necesario, pero su forma actual bloquea V1. | Crear version V1 limpia por slice. |
| Retirar | No sirve a V1, compite con el modelo o agrega ruido. | Marcar deprecable y no seguir extendiendo. |

Regla:

> Ninguna pieza se porta por inercia.

---

## 5. Que se comparte

Debe vivir en codigo compartido siempre que sea razonable:

- tipos de dominio;
- contratos de datos;
- normalizacion de busqueda;
- scoring/ranking local;
- dedupe;
- visibilidad/soft delete;
- reglas de privacidad;
- reglas de pins `saved/visited`;
- parsing de deep links;
- helpers de media;
- estado de dominio;
- keys/copy tokens i18n;
- design tokens base.

La logica compartida no debe depender de `window`, DOM, Mapbox GL Web ni APIs nativas especificas.

---

## 6. Que puede variar por plataforma

Puede tener implementacion especifica:

- renderer de mapa;
- gestos del mapa;
- sheets/drawers;
- modales;
- pickers de fotos;
- share sheet;
- safe areas;
- teclado;
- haptics;
- permisos;
- layout desktop/sidebar;
- captura/preview web;
- affordances de hover.

Regla:

> La plataforma puede variar en interaccion y layout, pero no en intencion, contratos ni resultado de dominio.

---

## 7. Renderer de mapa

### Web actual

Web puede seguir usando Mapbox GL / `MapScreenVNext` mientras sea estable.

Esa implementacion no es automaticamente el contrato V1.

### iOS/Android V1

iOS/Android pueden usar `react-native-maps` como renderer V1 inicial si cumple:

- mapa visible y estable;
- pan/zoom fluido;
- pins visibles;
- seleccion de lugar/spot;
- sheet contextual;
- Search handoff;
- guardar/visitado;
- performance aceptable;
- no crashes en simulador/dispositivo.

### Mapbox Native

Mapbox Native solo debe considerarse si `react-native-maps` bloquea una necesidad V1 real:

- POI tapping con identidad Mapbox necesaria;
- estilo/branding de mapa imprescindible para el JTBD;
- clustering/capas nativas requeridas por performance;
- resultado de dominio imposible con `react-native-maps`;
- costo total menor que sostener divergencia.

No adoptar Mapbox Native por estetica ni por copiar visualmente la web actual.

---

## 8. Web en modo soporte

Web sigue siendo importante, pero no lidera V1.

Permitido:

- bugfix P0/P1;
- mantener deploy/export;
- usar web como laboratorio de datos o UX cuando acelere V1;
- validar share preview/rutas publicas;
- soporte desktop posterior;
- conservar piezas que pasen la matriz `conservar/adaptar/reconstruir/retirar`.

No permitido sin decision explicita:

- nuevas features web-only;
- cerrar comportamiento solo con QA web;
- usar sidebar/hover como patron base de mobile;
- crecer `MapScreenVNext` sin salida hacia shared/V1;
- diferir iOS/Android hasta "terminar web";
- declarar paridad con web actual como objetivo.

---

## 9. Secuencia operativa recomendada

### Bloque A — Target shell V1

OL: `OL-GLOBAL-SHELL-SEARCH-001`

DoD:

- bottom nav `Explore/Flow/Passport`;
- avatar Account top-left;
- Search top-right;
- safe areas correctas;
- iOS Simulator smoke;
- Android smoke si aplica;
- web no roto;
- no copiar patrones web si no sirven al target mobile.

No incluye:

- Flow profundo;
- Passport profundo;
- pagos;
- DB nueva.

### Bloque B — Target Explore mobile foundation

Objetivo:

- mapa nativo estable;
- pines;
- seleccion;
- sheet minima;
- acciones `saved/visited`;
- fallback/loading/error;
- no duplicados por taps concurrentes.

### Bloque C — Target Search mobile

Objetivo:

- entry global;
- overlay o pantalla mobile;
- resultados geo/spot;
- handoff a mapa/sheet;
- keyboard-safe;
- costo/API controlado.

### Bloque D — Target Geo/Spot sheets

Objetivo:

- GeoSheet y SpotSheet V1;
- progressive disclosure;
- acciones claras;
- back/cerrar reversibles.

### Bloque E — Web convergence

Objetivo:

- alinear web al contrato V1 ya validado;
- retirar patrones web-only que compitan;
- conservar desktop como extension, no como producto paralelo.

---

## 10. Matriz de decision por PR

Antes de ejecutar un PR que toque Explore, Shell, Search, Account, Flow o Passport:

| Pregunta | Si la respuesta es no |
|---|---|
| La pieza responde al target V1, no solo a web actual? | No iniciar o reducir alcance. |
| Existe comportamiento definido para iOS? | No iniciar implementacion o crear primero contrato. |
| Existe comportamiento definido para Android? | Documentar deuda explicita y smoke pendiente. |
| La pieza web se clasifico como conservar/adaptar/reconstruir/retirar? | Clasificar antes de portar. |
| Web depende de una implementacion diferente? | Separar renderer/adapters. |
| La logica de dominio esta compartida? | Extraer antes o justificar duplicacion temporal. |
| Hay smoke de iOS Simulator? | No cerrar PR si toca mobile/store-critical. |
| El cambio puede vivir sin DB nueva? | Preferir sin DB en shells/superficies. |

---

## 11. Reglas de no-go

No se debe mergear un PR store-critical si:

- solo fue validado en web;
- rompe iOS Simulator;
- introduce feature web-only como fuente canonica;
- copia web actual sin pasar por target V1;
- mezcla renderer de mapa con reglas de dominio;
- introduce DB/RLS para compensar falta de arquitectura de UI;
- pide permisos antes de explicar valor;
- no tiene rollback claro.

---

## 12. Definicion de convergencia V1

Convergencia V1 no significa pantallas identicas.

Convergencia V1 significa que iOS, Android y web terminan obedeciendo el mismo modelo de producto:

- abrir app;
- ver mapa;
- buscar destino/lugar;
- seleccionar resultado;
- abrir ficha;
- guardar/visitado;
- iniciar Flow basico cuando exista;
- ver progreso Passport basico cuando exista;
- controlar cuenta/privacidad/idioma/ayuda;
- recuperarse de loading/error/offline razonable.

Cada plataforma puede resolver esos JTBD con UI nativa y layout propio.

---

## 13. Rollback

Si una implementacion mobile-first bloquea demasiado:

1. mantener web estable;
2. revertir solo el slice mobile;
3. preservar contratos compartidos utiles;
4. reabrir decision renderer/scope;
5. no volver automaticamente a web-first;
6. no convertir web actual en objetivo de copia.
